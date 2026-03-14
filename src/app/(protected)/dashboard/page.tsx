import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole } from "@/lib/constants/roles";
import { audienceFilterForRole } from "@/lib/training/role-access";
import { DashboardView } from "@/components/dashboard/dashboard-view";

type AssignmentRow = {
  id: string;
  module_id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  due_date: string | null;
  completed_at: string | null;
  score: number | null;
  time_spent_minutes: number;
  training_modules: {
    title: string;
    regulation: string;
  }[] | null;
};

type ActivityRow = {
  id: number;
  action: string;
  entity_type: string;
  created_at: string;
};

export default async function DashboardPage() {
  const user = await requireUserContext();
  const supabase = await createClient();
  const manager = isManagerRole(user.role);

  const [
    assignmentsRes,
    certCountRes,
    auditRes,
    recommendationsRes,
    orgAssignmentsRes,
  ] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("id, module_id, status, due_date, completed_at, score, time_spent_minutes, training_modules(title, regulation)")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.userId)
      .order("assigned_at", { ascending: false })
      .limit(15),
    supabase
      .from("certifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.userId),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("training_modules")
      .select("id, title, regulation, estimated_minutes")
      .eq("organization_id", user.organizationId)
      .eq("is_active", true)
      .or(audienceFilterForRole(user.role))
      .order("created_at", { ascending: false })
      .limit(4),
    manager
      ? supabase
          .from("module_assignments")
          .select("id, status")
          .eq("organization_id", user.organizationId)
      : Promise.resolve({ data: [] }),
  ]);

  const assignments = (assignmentsRes.data ?? []) as unknown as AssignmentRow[];
  const completed = assignments.filter((item) => item.status === "completed").length;
  const inProgress = assignments.filter((item) => item.status === "in_progress").length;
  const overdue = assignments.filter((item) => item.status === "overdue").length;
  const assigned = assignments.length;
  const certificates = certCountRes.count ?? 0;
  const completionPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  const totalTimeSpentMinutes = assignments.reduce((sum, item) => sum + (item.time_spent_minutes ?? 0), 0);

  const orgAssignments = (orgAssignmentsRes.data ?? []) as Array<{ id: string; status: string }>;
  const orgCompleted = orgAssignments.filter((item) => item.status === "completed").length;
  const orgScore = orgAssignments.length > 0
    ? Math.round((orgCompleted / orgAssignments.length) * 100)
    : completionPct;

  const activities = ((auditRes.data ?? []) as ActivityRow[]).map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    createdAt: row.created_at,
  }));

  const recommendations = (recommendationsRes.data ?? []) as Array<{
    id: string;
    title: string;
    regulation: string;
    estimated_minutes: number;
  }>;

  return (
    <DashboardView
      userName={user.fullName?.split(" ")[0] ?? "Learner"}
      completionPct={completionPct}
      totalTimeSpentMinutes={totalTimeSpentMinutes}
      assigned={assigned}
      completed={completed}
      inProgress={inProgress}
      overdue={overdue}
      certificates={certificates}
      orgScore={orgScore}
      assignments={assignments.map((item) => ({
        id: item.id,
        moduleId: item.module_id,
        moduleTitle: item.training_modules?.[0]?.title ?? "Untitled module",
        moduleRegulation: item.training_modules?.[0]?.regulation ?? "HIPAA",
        status: item.status,
        dueDate: item.due_date,
        completedAt: item.completed_at,
        score: item.score,
      }))}
      recommendations={recommendations.map((r) => ({
        id: r.id,
        title: r.title,
        regulation: r.regulation,
        estimatedMinutes: r.estimated_minutes,
      }))}
      activities={activities}
    />
  );
}
