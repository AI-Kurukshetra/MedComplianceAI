import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

export async function POST() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.id,
    action: "auth_sign_out",
    entity_type: "auth",
    entity_id: user.id,
    metadata: {},
  });

  const { error } = await supabase.auth.signOut();
  if (error) {
    return fail(error.message, 400, "SIGN_OUT_FAILED");
  }

  return ok({ signedOut: true });
}
