import { CreateAdminModuleSchema } from "@/lib/validators/admin";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isAdminRole } from "@/lib/constants/roles";

function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function GET() {
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
    .order("updated_at", { ascending: false });

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  return ok(data ?? []);
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isAdminRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CreateAdminModuleSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const payload = parsed.data;

  const { data: moduleRow, error } = await supabase
    .from("training_modules")
    .insert({
      organization_id: user.organizationId,
      title: payload.title,
      description: payload.description,
      content_markdown: payload.contentMarkdown ?? "",
      regulation: payload.regulation,
      audience_role: payload.audienceRole,
      estimated_minutes: payload.estimatedMinutes,
      content_url: normalizeUrl(payload.contentUrl) ?? null,
      is_active: payload.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, title, description, content_markdown, regulation, audience_role, estimated_minutes, content_url, is_active, created_at, updated_at",
    )
    .single();

  if (error || !moduleRow) {
    return fail(error?.message ?? "Could not create module", 400, "CREATE_FAILED");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "admin_module_created",
    entity_type: "training_modules",
    entity_id: moduleRow.id,
    metadata: {
      title: moduleRow.title,
      regulation: moduleRow.regulation,
      audience_role: moduleRow.audience_role,
    },
  });

  return ok(moduleRow, 201);
}
