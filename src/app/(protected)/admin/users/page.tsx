import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole } from "@/lib/constants/roles";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export default async function AdminUsersPage() {
  const user = await requireUserContext();

  if (!isManagerRole(user.role)) {
    redirect("/dashboard?error=Only%20managers%20can%20view%20staff%20records");
  }

  const supabase = await createClient();

  const [profilesRes, assignmentsRes, modulesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("module_assignments")
      .select("user_id, status")
      .eq("organization_id", user.organizationId),
    supabase
      .from("training_modules")
      .select("id, title, audience_role, estimated_minutes")
      .eq("organization_id", user.organizationId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const users = (profilesRes.data ?? []).map((profile) => {
    const userAssignments = assignments.filter((item) => item.user_id === profile.id);
    const assigned = userAssignments.length;
    const completed = userAssignments.filter((item) => item.status === "completed").length;
    const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

    return {
      id: profile.id,
      fullName: profile.full_name || "Unknown User",
      email: profile.email || "-",
      role: profile.role,
      assignmentCount: assigned,
      completionRate,
    };
  });

  const activeTrainingCount = users.filter((item) => item.completionRate > 0 && item.completionRate < 100).length;
  const overdueStaffCount = users.filter((item) => item.completionRate < 40 && item.assignmentCount > 0).length;
  const avgCompletion = users.length > 0
    ? Math.round(users.reduce((acc, item) => acc + item.completionRate, 0) / users.length)
    : 0;

  const modules = modulesRes.data ?? [];
  const pathByRoleMap = new Map<string, { count: number; minutes: number }>();
  for (const trainingModule of modules) {
    const key = trainingModule.audience_role || "all";
    const prev = pathByRoleMap.get(key) ?? { count: 0, minutes: 0 };
    pathByRoleMap.set(key, {
      count: prev.count + 1,
      minutes: prev.minutes + (trainingModule.estimated_minutes ?? 0),
    });
  }

  return (
    <AdminUsersView
      users={users}
      activeTrainingCount={activeTrainingCount}
      overdueStaffCount={overdueStaffCount}
      avgCompletion={avgCompletion}
      pathByRole={Array.from(pathByRoleMap.entries()).map(([role, data]) => ({ role, count: data.count, minutes: data.minutes }))}
    />
  );
}
