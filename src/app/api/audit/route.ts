import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isManagerRole } from "@/lib/constants/roles";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  actorUserId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isManagerRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get("page") ?? "1",
    pageSize: url.searchParams.get("pageSize") ?? "20",
    action: url.searchParams.get("action") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    actorUserId: url.searchParams.get("actorUserId") ?? undefined,
  });

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const { page, pageSize, action, entityType, actorUserId } = parsed.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, actor_user_id, metadata, created_at", {
      count: "exact",
    })
    .eq("organization_id", user.organizationId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (action) {
    query = query.eq("action", action);
  }

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  if (actorUserId) {
    query = query.eq("actor_user_id", actorUserId);
  }

  const { data, error, count } = await query;
  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  return ok({
    items: data ?? [],
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
    },
  });
}
