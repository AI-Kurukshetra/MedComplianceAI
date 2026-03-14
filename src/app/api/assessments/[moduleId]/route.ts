import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { canRoleAccessAudience } from "@/lib/training/role-access";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const { moduleId } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

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

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, body, explanation, points, position, question_options(id, body, position)")
    .eq("organization_id", user.organizationId)
    .eq("module_id", moduleId)
    .order("position", { ascending: true });

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  return ok(questions ?? []);
}
