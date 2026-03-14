import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

export async function PATCH() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return fail(error.message, 400, "UPDATE_FAILED");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "notifications_marked_all_read",
    entity_type: "notifications",
    entity_id: user.id,
    metadata: {},
  });

  return ok({ readAll: true });
}
