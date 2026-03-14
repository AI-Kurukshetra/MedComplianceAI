import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const { data, error } = await supabase
    .from("certifications")
    .select("id, certificate_no, issued_at, expires_at, training_modules(title, regulation)")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  if (!data) {
    return fail("Certification not found", 404, "NOT_FOUND");
  }

  return ok(data);
}
