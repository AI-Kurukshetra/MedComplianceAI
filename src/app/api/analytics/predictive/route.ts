import { PredictiveQuerySchema } from "@/lib/validators/ai";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isManagerRole } from "@/lib/constants/roles";
import { buildPredictiveAnalytics } from "@/features/ai/insights";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isManagerRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const url = new URL(request.url);
  const parsed = PredictiveQuerySchema.safeParse({
    horizonDays: url.searchParams.get("horizonDays") ?? undefined,
  });

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const analytics = await buildPredictiveAnalytics(
    supabase,
    user.organizationId,
    parsed.data.horizonDays,
  );

  return ok(analytics);
}
