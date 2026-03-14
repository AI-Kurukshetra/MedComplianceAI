import { TrackLearningTimeSchema } from "@/lib/validators/progress";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { canRoleAccessAudience } from "@/lib/training/role-access";

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = TrackLearningTimeSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const { moduleId, minutes } = parsed.data;
  const { data: module, error: moduleError } = await supabase
    .from("training_modules")
    .select("id, audience_role")
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

  const { data: assignment, error: assignmentError } = await supabase
    .from("module_assignments")
    .select("id, status, time_spent_minutes")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (assignmentError) {
    return fail(assignmentError.message, 400, "FETCH_FAILED");
  }

  let assignmentId = assignment?.id ?? null;
  let totalTimeSpentMinutes = assignment?.time_spent_minutes ?? 0;

  if (assignment) {
    totalTimeSpentMinutes += minutes;

    const { error: updateError } = await supabase
      .from("module_assignments")
      .update({
        status: assignment.status === "assigned" ? "in_progress" : assignment.status,
        time_spent_minutes: totalTimeSpentMinutes,
      })
      .eq("id", assignment.id)
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id);

    if (updateError) {
      return fail(updateError.message, 400, "UPDATE_FAILED");
    }
  } else {
    totalTimeSpentMinutes = minutes;

    const { data: created, error: createError } = await supabase
      .from("module_assignments")
      .insert({
        organization_id: user.organizationId,
        user_id: user.id,
        module_id: moduleId,
        status: "in_progress",
        time_spent_minutes: totalTimeSpentMinutes,
      })
      .select("id")
      .single();

    if (createError || !created) {
      return fail(createError?.message ?? "Unable to create assignment", 400, "CREATE_FAILED");
    }

    assignmentId = created.id;
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "learning_time_tracked",
    entity_type: "module_assignments",
    entity_id: assignmentId ?? moduleId,
    metadata: { module_id: moduleId, minutes_added: minutes, total_time_spent_minutes: totalTimeSpentMinutes },
  });

  return ok({
    moduleId,
    assignmentId,
    minutesAdded: minutes,
    totalTimeSpentMinutes,
  });
}
