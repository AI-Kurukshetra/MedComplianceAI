import { TrainingFilterSchema } from "@/lib/validators/training";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { audienceFilterForRole, canRoleAccessAudience } from "@/lib/training/role-access";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const parsed = TrainingFilterSchema.safeParse({
    regulation: url.searchParams.get("regulation") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    audience_role: url.searchParams.get("audience_role") ?? undefined,
  });

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  let query = supabase
    .from("training_modules")
    .select("id, title, description, regulation, audience_role, estimated_minutes, created_at")
    .eq("organization_id", user.organizationId)
    .eq("is_active", true)
    .or(audienceFilterForRole(user.role))
    .order("created_at", { ascending: false });

  if (parsed.data.regulation) {
    query = query.eq("regulation", parsed.data.regulation);
  }

  if (parsed.data.audience_role) {
    if (!canRoleAccessAudience(user.role, parsed.data.audience_role)) {
      return ok([]);
    }
    query = query.eq("audience_role", parsed.data.audience_role);
  }

  const { data: modules, error: moduleError } = await query;
  if (moduleError) {
    return fail(moduleError.message, 400, "FETCH_FAILED");
  }

  const moduleIds = (modules ?? []).map((module) => module.id);
  const { data: assignments } = moduleIds.length
    ? await supabase
        .from("module_assignments")
        .select("module_id, status")
        .eq("organization_id", user.organizationId)
        .eq("user_id", user.id)
        .in("module_id", moduleIds)
    : { data: [] };

  const assignmentById = new Map((assignments ?? []).map((item) => [item.module_id, item.status]));

  const result = (modules ?? []).map((module) => ({
    ...module,
    status: assignmentById.get(module.id) ?? null,
  }));

  const filtered = parsed.data.status
    ? result.filter((item) => item.status === parsed.data.status)
    : result;

  return ok(filtered);
}
