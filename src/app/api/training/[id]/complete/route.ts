import { CompleteModuleSchema } from "@/lib/validators/training";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { generateCertNo } from "@/lib/utils/certificate";
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
  const parsed = CompleteModuleSchema.safeParse(body);
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

  const score = parsed.data.score;
  const { data: assignment } = await supabase
    .from("module_assignments")
    .select("id")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .eq("module_id", id)
    .maybeSingle();

  if (!assignment) {
    return fail("Assignment not found", 404, "NOT_FOUND");
  }

  const { error: updateError } = await supabase
    .from("module_assignments")
    .update({
      status: "completed",
      score,
      completed_at: new Date().toISOString(),
    })
    .eq("id", assignment.id)
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id);

  if (updateError) {
    return fail(updateError.message, 400, "UPDATE_FAILED");
  }

  let certificationId: string | null = null;

  if (score >= 80) {
    const { data: existingCert } = await supabase
      .from("certifications")
      .select("id")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id)
      .eq("module_id", id)
      .maybeSingle();

    if (!existingCert) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data: cert, error: certError } = await supabase
        .from("certifications")
        .insert({
          organization_id: user.organizationId,
          user_id: user.id,
          module_id: id,
          certificate_no: generateCertNo(user.id, id),
          issued_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (certError) {
        return fail(certError.message, 400, "CERT_CREATE_FAILED");
      }

      certificationId = cert?.id ?? null;
    } else {
      certificationId = existingCert.id;
    }
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "module_completed",
    entity_type: "module_assignments",
    entity_id: assignment.id,
    metadata: { module_id: id, score, certification_id: certificationId },
  });

  return ok({ moduleId: id, score, certificationId });
}
