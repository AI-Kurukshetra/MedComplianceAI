import { StartModuleSchema } from "@/lib/validators/training";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { canRoleAccessAudience } from "@/lib/training/role-access";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = StartModuleSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const { data: module, error: moduleError } = await supabase
    .from("training_modules")
    .select("id, audience_role")
    .eq("organization_id", user.organizationId)
    .eq("id", id)
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

  const { data: existing } = await supabase
    .from("module_assignments")
    .select("id")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .eq("module_id", id)
    .maybeSingle();

  let assignmentId = existing?.id ?? null;

  if (existing) {
    const { error } = await supabase
      .from("module_assignments")
      .update({
        status: "in_progress",
        due_date: parsed.data.dueDate ?? null,
      })
      .eq("id", existing.id)
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id);

    if (error) {
      return fail(error.message, 400, "UPDATE_FAILED");
    }
  } else {
    const { data, error } = await supabase
      .from("module_assignments")
      .insert({
        organization_id: user.organizationId,
        user_id: user.id,
        module_id: id,
        status: "in_progress",
        due_date: parsed.data.dueDate ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return fail(error?.message ?? "Unable to create assignment", 400, "CREATE_FAILED");
    }

    assignmentId = data.id;
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "module_started",
    entity_type: "module_assignments",
    entity_id: assignmentId ?? id,
    metadata: { module_id: id },
  });

  return ok({ moduleId: id, assignmentId, status: "in_progress" });
}
