import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const [assignmentsRes, certsRes, notificationsRes] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("status, time_spent_minutes", { count: "exact" })
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id),
    supabase
      .from("certifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const total = assignments.length;
  const completed = assignments.filter((item) => item.status === "completed").length;
  const overdue = assignments.filter((item) => item.status === "overdue").length;
  const inProgress = assignments.filter((item) => item.status === "in_progress").length;
  const totalTimeSpentMinutes = assignments.reduce(
    (sum, item) => sum + Number((item as { time_spent_minutes?: number }).time_spent_minutes ?? 0),
    0,
  );

  return ok({
    totalAssignments: total,
    completedAssignments: completed,
    inProgressAssignments: inProgress,
    overdueAssignments: overdue,
    completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
    certificateCount: certsRes.count ?? 0,
    unreadNotifications: notificationsRes.count ?? 0,
    totalTimeSpentMinutes,
  });
}
