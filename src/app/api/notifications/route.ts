import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, message, read_at, created_at")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  return ok(data ?? []);
}
