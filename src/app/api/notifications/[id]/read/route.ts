import { NotificationReadSchema } from "@/lib/validators/notifications";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const parsed = NotificationReadSchema.safeParse({ id });
  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id);

  if (error) {
    return fail(error.message, 400, "UPDATE_FAILED");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "notification_marked_read",
    entity_type: "notifications",
    entity_id: id,
    metadata: {},
  });

  return ok({ id, read: true });
}
