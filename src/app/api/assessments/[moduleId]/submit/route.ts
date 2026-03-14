import { SubmitAssessmentSchema } from "@/lib/validators/assessment";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { generateCertNo } from "@/lib/utils/certificate";
import { canRoleAccessAudience } from "@/lib/training/role-access";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const { moduleId } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SubmitAssessmentSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const { data: module, error: moduleError } = await supabase
    .from("training_modules")
    .select("id, title, audience_role")
    .eq("organization_id", user.organizationId)
    .eq("id", moduleId)
    .eq("is_active", true)
    .maybeSingle();

  if (moduleError) {
    return fail(moduleError.message, 400, "FETCH_FAILED");
  }

  if (!module) {
    return fail("Module not found", 404, "NOT_FOUND");
  }

  if (!canRoleAccessAudience(user.role, module.audience_role)) {
    return fail("Forbidden for your role", 403, "FORBIDDEN_ROLE");
  }

  const answers = parsed.data.answers;
  const questionIds = answers.map((item) => item.questionId);

  const { data: options } = await supabase
    .from("question_options")
    .select("id, question_id, is_correct")
    .in("question_id", questionIds);

  const correctByQuestion = new Map<string, string>();
  for (const option of options ?? []) {
    if (option.is_correct) {
      correctByQuestion.set(option.question_id, option.id);
    }
  }

  let correctAnswers = 0;
  for (const answer of answers) {
    if (correctByQuestion.get(answer.questionId) === answer.optionId) {
      correctAnswers += 1;
    }
  }

  const total = answers.length;
  const score = total > 0 ? Number(((correctAnswers / total) * 100).toFixed(2)) : 0;
  const passed = score >= 80;

  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .insert({
      organization_id: user.organizationId,
      user_id: user.id,
      module_id: moduleId,
      answers,
      score,
      passed,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return fail(attemptError?.message ?? "Could not save assessment", 400, "CREATE_FAILED");
  }

  const { data: assignment } = await supabase
    .from("module_assignments")
    .select("id")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  let assignmentId = assignment?.id ?? null;
  let remedialAssigned = false;
  let remedialDueDate: string | null = null;

  if (passed) {
    if (assignment) {
      const { error: updateAssignmentError } = await supabase
        .from("module_assignments")
        .update({
          status: "completed",
          score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", assignment.id)
        .eq("organization_id", user.organizationId)
        .eq("user_id", user.id);

      if (updateAssignmentError) {
        return fail(updateAssignmentError.message, 400, "UPDATE_FAILED");
      }
    } else {
      const { data: createdAssignment, error: createAssignmentError } = await supabase
        .from("module_assignments")
        .insert({
          organization_id: user.organizationId,
          user_id: user.id,
          module_id: moduleId,
          status: "completed",
          score,
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createAssignmentError || !createdAssignment) {
        return fail(createAssignmentError?.message ?? "Unable to create assignment", 400, "CREATE_FAILED");
      }

      assignmentId = createdAssignment.id;
    }
  } else {
    remedialAssigned = true;
    const remedialDeadline = new Date(Date.now() + 7 * 86400000);
    remedialDueDate = remedialDeadline.toISOString();

    if (assignment) {
      const { error: updateAssignmentError } = await supabase
        .from("module_assignments")
        .update({
          status: "assigned",
          score,
          due_date: remedialDueDate,
          completed_at: null,
        })
        .eq("id", assignment.id)
        .eq("organization_id", user.organizationId)
        .eq("user_id", user.id);

      if (updateAssignmentError) {
        return fail(updateAssignmentError.message, 400, "UPDATE_FAILED");
      }
    } else {
      const { data: createdAssignment, error: createAssignmentError } = await supabase
        .from("module_assignments")
        .insert({
          organization_id: user.organizationId,
          user_id: user.id,
          module_id: moduleId,
          status: "assigned",
          score,
          due_date: remedialDueDate,
        })
        .select("id")
        .single();

      if (createAssignmentError || !createdAssignment) {
        return fail(createAssignmentError?.message ?? "Unable to create assignment", 400, "CREATE_FAILED");
      }

      assignmentId = createdAssignment.id;
    }

    await supabase.from("notifications").insert({
      organization_id: user.organizationId,
      user_id: user.id,
      kind: "assignment",
      title: "Remedial Training Assigned",
      message: `You scored ${score}%. Review "${module.title}" and retake the quiz by ${remedialDeadline.toLocaleDateString("en-US")}.`,
    });

    await supabase.from("audit_logs").insert({
      organization_id: user.organizationId,
      actor_user_id: user.id,
      action: "remedial_training_assigned",
      entity_type: "module_assignments",
      entity_id: assignmentId ?? moduleId,
      metadata: { module_id: moduleId, score, remedial_due_date: remedialDueDate },
    });
  }

  let certificationId: string | null = null;
  if (passed) {
    const { data: existingCert } = await supabase
      .from("certifications")
      .select("id")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existingCert) {
      certificationId = existingCert.id;
    } else {
      const { data: cert } = await supabase
        .from("certifications")
        .insert({
          organization_id: user.organizationId,
          user_id: user.id,
          module_id: moduleId,
          certificate_no: generateCertNo(user.id, moduleId),
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
        })
        .select("id")
        .single();

      certificationId = cert?.id ?? null;
    }
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "assessment_submitted",
    entity_type: "assessment_attempts",
    entity_id: attempt.id,
    metadata: {
      module_id: moduleId,
      score,
      passed,
      certification_id: certificationId,
      remedial_assigned: remedialAssigned,
      remedial_due_date: remedialDueDate,
    },
  });

  return ok({
    score,
    passed,
    attemptId: attempt.id,
    certificationId,
    remedialAssigned,
    remedialDueDate,
  });
}
