import { redirect } from "next/navigation";
import { QuizEngine } from "@/components/training/quiz-engine";
import { QuizHeader } from "@/components/training/quiz-header";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { generateCertificateNumber } from "@/lib/utils/certificates";
import { canRoleAccessAudience } from "@/lib/training/role-access";

export default async function TrainingQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserContext();
  const supabase = await createClient();

  /* Fetch module title for display */
  const { data: moduleRow } = await supabase
    .from("training_modules")
    .select("id, title, regulation, audience_role")
    .eq("id", id)
    .eq("organization_id", user.organizationId)
    .eq("is_active", true)
    .maybeSingle();

  if (!moduleRow) redirect("/training");
  if (!canRoleAccessAudience(user.role, moduleRow.audience_role)) {
    redirect("/training?error=Quiz%20is%20not%20available%20for%20your%20role");
  }
  const moduleMeta = moduleRow;

  /* Fetch questions + all options (no is_correct — server-side only) */
  const { data: rows } = await supabase
    .from("questions")
    .select("id, body, points, question_options(id, body, position)")
    .eq("organization_id", user.organizationId)
    .eq("module_id", id)
    .order("position", { ascending: true });

  const questions = (rows ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    points: row.points ?? 1,
    options: (
      (row.question_options ?? []) as { id: string; body: string; position: number }[]
    )
      .sort((a, b) => a.position - b.position)
      .map((opt) => ({ id: opt.id, body: opt.body })),
  }));

  /* ── Server action: grade + persist ──────────────────────── */
  async function submitQuiz(
    payload: { questionId: string; optionId: string }[],
  ): Promise<{ score: number; passed: boolean; certIssued: boolean }> {
    "use server";

    if (!payload || payload.length === 0) {
      return { score: 0, passed: false, certIssued: false };
    }

    const actionUser = await requireUserContext();
    const db = await createClient();
    if (!canRoleAccessAudience(actionUser.role, moduleMeta.audience_role)) {
      return { score: 0, passed: false, certIssued: false };
    }

    /* Fetch correct options for all submitted questions */
    const questionIds = payload.map((e) => e.questionId);
    const { data: optionRows, error: optErr } = await db
      .from("question_options")
      .select("id, question_id, is_correct")
      .in("question_id", questionIds);

    if (optErr) {
      return { score: 0, passed: false, certIssued: false };
    }

    /* Build correct-answer map: questionId → Set of correct optionIds */
    const correct = new Map<string, Set<string>>();
    for (const opt of optionRows ?? []) {
      if (!opt.is_correct) continue;
      const set = correct.get(opt.question_id) ?? new Set<string>();
      set.add(opt.id);
      correct.set(opt.question_id, set);
    }

    /* Score */
    let hits = 0;
    for (const entry of payload) {
      if (correct.get(entry.questionId)?.has(entry.optionId)) hits++;
    }
    const total = payload.length;
    const score = total > 0 ? Number(((hits / total) * 100).toFixed(2)) : 0;
    const passed = score >= 80;

    /* Persist assessment attempt */
    await db.from("assessment_attempts").insert({
      organization_id: actionUser.organizationId,
      user_id: actionUser.userId,
      module_id: id,
      answers: payload,
      score,
      passed,
      completed_at: new Date().toISOString(),
    });

    /* Update assignment status */
    const { data: assignment } = await db
      .from("module_assignments")
      .select("id")
      .eq("organization_id", actionUser.organizationId)
      .eq("user_id", actionUser.userId)
      .eq("module_id", id)
      .maybeSingle();

    let assignmentId = assignment?.id ?? id;

    if (passed) {
      if (assignment) {
        await db
          .from("module_assignments")
          .update({
            status: "completed",
            score,
            completed_at: new Date().toISOString(),
          })
          .eq("id", assignment.id)
          .eq("organization_id", actionUser.organizationId)
          .eq("user_id", actionUser.userId);
      } else {
        const { data: createdAssignment } = await db
          .from("module_assignments")
          .insert({
            organization_id: actionUser.organizationId,
            user_id: actionUser.userId,
            module_id: id,
            status: "completed",
            score,
            completed_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        assignmentId = createdAssignment?.id ?? assignmentId;
      }
    } else {
      const remedialDeadline = new Date(Date.now() + 7 * 86400000);

      if (assignment) {
        await db
          .from("module_assignments")
          .update({
            status: "assigned",
            score,
            due_date: remedialDeadline.toISOString(),
            completed_at: null,
          })
          .eq("id", assignment.id)
          .eq("organization_id", actionUser.organizationId)
          .eq("user_id", actionUser.userId);
      } else {
        const { data: createdAssignment } = await db
          .from("module_assignments")
          .insert({
            organization_id: actionUser.organizationId,
            user_id: actionUser.userId,
            module_id: id,
            status: "assigned",
            score,
            due_date: remedialDeadline.toISOString(),
          })
          .select("id")
          .single();

        assignmentId = createdAssignment?.id ?? assignmentId;
      }

      await db.from("notifications").insert({
        organization_id: actionUser.organizationId,
        user_id: actionUser.userId,
        kind: "assignment",
        title: "Remedial Training Assigned",
        message: `You scored ${score}%. Review "${moduleMeta.title}" and retake the quiz by ${remedialDeadline.toLocaleDateString("en-US")}.`,
      });

      await db.from("audit_logs").insert({
        organization_id: actionUser.organizationId,
        actor_user_id: actionUser.userId,
        action: "remedial_training_assigned",
        entity_type: "module_assignments",
        entity_id: assignmentId,
        metadata: { module_id: id, score, remedial_due_date: remedialDeadline.toISOString() },
      });
    }

    /* Issue certification if passed */
    let certIssued = false;
    if (passed) {
      const { data: existingCert } = await db
        .from("certifications")
        .select("id")
        .eq("organization_id", actionUser.organizationId)
        .eq("user_id", actionUser.userId)
        .eq("module_id", id)
        .maybeSingle();

      if (!existingCert) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const { error: certErr } = await db.from("certifications").insert({
          organization_id: actionUser.organizationId,
          user_id: actionUser.userId,
          module_id: id,
          certificate_no: generateCertificateNumber(actionUser.userId, id),
          issued_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        });

        if (!certErr) certIssued = true;
      } else {
        certIssued = true; // cert already existed
      }

      /* Notification on pass */
      await db.from("notifications").insert({
        organization_id: actionUser.organizationId,
        user_id: actionUser.userId,
        kind: "achievement",
        title: "Assessment Passed!",
        message: `You scored ${score}% on the quiz and your compliance certificate has been issued.`,
      });
    }

    /* Audit log */
    await db.from("audit_logs").insert({
      organization_id: actionUser.organizationId,
      actor_user_id: actionUser.userId,
      action: passed ? "assessment_passed" : "assessment_failed",
      entity_type: "assessment_attempts",
      entity_id: id,
      metadata: { score, passed, hits, total, certIssued },
    });

    return { score, passed, certIssued };
  }

  return (
    <div className="space-y-4">
      <QuizHeader
        regulation={moduleMeta.regulation}
        title={moduleMeta.title}
        questionCount={questions.length}
      />
      <QuizEngine
        moduleId={id}
        moduleTitle={moduleMeta.title}
        questions={questions}
        onSubmit={submitQuiz}
      />
    </div>
  );
}
