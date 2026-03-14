import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const { data, error } = await supabase
    .from("certifications")
    .select("id, certificate_no, issued_at, expires_at, training_modules(title, regulation)")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  return ok(data ?? []);
}
