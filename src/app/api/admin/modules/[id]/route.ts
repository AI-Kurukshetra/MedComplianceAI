import { UpdateAdminModuleSchema } from "@/lib/validators/admin";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isAdminRole } from "@/lib/constants/roles";

function normalizeUrl(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isAdminRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const { data, error } = await supabase
    .from("training_modules")
    .select(
      "id, title, description, content_markdown, regulation, audience_role, estimated_minutes, content_url, is_active, created_at, updated_at",
    )
    .eq("organization_id", user.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  if (!data) {
    return fail("Module not found", 404, "NOT_FOUND");
  }

  return ok(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isAdminRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateAdminModuleSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const payload = parsed.data;

  const { data: moduleRow, error } = await supabase
    .from("training_modules")
    .update({
      title: payload.title,
      description: payload.description,
      content_markdown: payload.contentMarkdown ?? "",
      regulation: payload.regulation,
      audience_role: payload.audienceRole,
      estimated_minutes: payload.estimatedMinutes,
      content_url: normalizeUrl(payload.contentUrl),
      is_active: payload.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", user.organizationId)
    .eq("id", id)
    .select(
      "id, title, description, content_markdown, regulation, audience_role, estimated_minutes, content_url, is_active, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    return fail(error.message, 400, "UPDATE_FAILED");
  }

  if (!moduleRow) {
    return fail("Module not found", 404, "NOT_FOUND");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "admin_module_updated",
    entity_type: "training_modules",
    entity_id: moduleRow.id,
    metadata: {
      title: moduleRow.title,
      regulation: moduleRow.regulation,
      audience_role: moduleRow.audience_role,
      is_active: moduleRow.is_active,
    },
  });

  return ok(moduleRow);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isAdminRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const { data: moduleRow, error } = await supabase
    .from("training_modules")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", user.organizationId)
    .eq("id", id)
    .select("id, title, is_active")
    .maybeSingle();

  if (error) {
    return fail(error.message, 400, "DELETE_FAILED");
  }

  if (!moduleRow) {
    return fail("Module not found", 404, "NOT_FOUND");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "admin_module_archived",
    entity_type: "training_modules",
    entity_id: moduleRow.id,
    metadata: { title: moduleRow.title },
  });

  return ok({ id: moduleRow.id, archived: true });
}
