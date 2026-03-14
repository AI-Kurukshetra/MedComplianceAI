import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isManagerRole } from "@/lib/constants/roles";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isManagerRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const [assignmentsRes, attemptsRes] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("status, training_modules(regulation)")
      .eq("organization_id", user.organizationId),
    supabase
      .from("assessment_attempts")
      .select("score")
      .eq("organization_id", user.organizationId),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];

  const byRegulation = ["HIPAA", "HITECH", "SOX", "FDA"].map((regulation) => {
    const scoped = assignments.filter((item) => item.training_modules?.[0]?.regulation === regulation);
    const total = scoped.length;
    const completed = scoped.filter((item) => item.status === "completed").length;
    return {
      regulation,
      total,
      completed,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const passCount = attempts.filter((item) => (item.score ?? 0) >= 80).length;

  return ok({
    assignments: {
      total: assignments.length,
      completed: assignments.filter((item) => item.status === "completed").length,
      overdue: assignments.filter((item) => item.status === "overdue").length,
    },
    assessments: {
      total: attempts.length,
      passRate: attempts.length > 0 ? Math.round((passCount / attempts.length) * 100) : 0,
    },
    byRegulation,
  });
}
