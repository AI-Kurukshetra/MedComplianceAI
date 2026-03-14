import { ThreatTrainingQuerySchema } from "@/lib/validators/ai";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { buildThreatTrainingInsights } from "@/features/ai/insights";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const parsed = ThreatTrainingQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const threats = await buildThreatTrainingInsights(supabase, user, parsed.data.limit);
  return ok({
    generatedAt: new Date().toISOString(),
    threats,
  });
}
