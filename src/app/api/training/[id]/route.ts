import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { canRoleAccessAudience } from "@/lib/training/role-access";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const [{ data: module, error: moduleError }, { data: assignment }] = await Promise.all([
    supabase
      .from("training_modules")
      .select("id, title, description, content_markdown, regulation, audience_role, estimated_minutes, content_url")
      .eq("organization_id", user.organizationId)
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("module_assignments")
      .select("id, status, score, due_date, completed_at")
      .eq("organization_id", user.organizationId)
      .eq("module_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (moduleError) {
    return fail(moduleError.message, 400, "FETCH_FAILED");
  }

  if (!module) {
    return fail("Module not found", 404, "NOT_FOUND");
  }

  if (!canRoleAccessAudience(user.role, module.audience_role)) {
    return fail("Forbidden for your role", 403, "FORBIDDEN_ROLE");
  }

  return ok({
    ...module,
    assignment,
  });
}
