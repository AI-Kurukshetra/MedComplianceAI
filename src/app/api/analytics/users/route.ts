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

  const [usersRes, assignmentsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("module_assignments")
      .select("user_id, status, score, time_spent_minutes")
      .eq("organization_id", user.organizationId),
  ]);

  const users = usersRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  const rows = users.map((profile) => {
    const scoped = assignments.filter((item) => item.user_id === profile.id);
    const assigned = scoped.length;
    const completed = scoped.filter((item) => item.status === "completed").length;
    const scored = scoped.filter((item) => typeof item.score === "number");
    const avgScore = scored.length > 0
      ? Number((scored.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / scored.length).toFixed(2))
      : null;
    const timeSpentMinutes = scoped.reduce((sum, item) => sum + (item.time_spent_minutes ?? 0), 0);

    return {
      id: profile.id,
      fullName: profile.full_name || "Unknown User",
      email: profile.email || "-",
      role: profile.role,
      assigned,
      completed,
      completionPct: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
      avgScore,
      timeSpentMinutes,
    };
  });

  return ok(rows);
}
