import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole } from "@/lib/constants/roles";
import { CompletionChart } from "@/components/analytics/completion-chart";
import { PassRateChart } from "@/components/analytics/pass-rate-chart";
import { UserProgressTable } from "@/components/analytics/user-progress-table";

export default async function DashboardCompliancePage() {
  const user = await requireUserContext();

  if (!isManagerRole(user.role)) {
    redirect("/dashboard?error=Only%20managers%20can%20view%20compliance%20analytics");
  }

  const supabase = await createClient();

  const [assignmentsRes, attemptsRes, usersRes] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("status, score, time_spent_minutes, training_modules(regulation), user_id")
      .eq("organization_id", user.organizationId),
    supabase
      .from("assessment_attempts")
      .select("score, completed_at")
      .eq("organization_id", user.organizationId)
      .order("completed_at", { ascending: true })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];

  const regulations = ["HIPAA", "HITECH", "SOX", "FDA"] as const;
  const completionData = regulations.map((regulation) => {
    const scoped = assignments.filter((item) => item.training_modules?.[0]?.regulation === regulation);
    const complete = scoped.filter((item) => item.status === "completed").length;
    const completionPct = scoped.length > 0 ? Math.round((complete / scoped.length) * 100) : 0;
    return { regulation, completionPct };
  });

  const passBuckets = new Map<string, { total: number; passed: number }>();
  for (const attempt of attempts) {
    if (!attempt.completed_at) continue;
    const label = new Date(attempt.completed_at).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const prev = passBuckets.get(label) ?? { total: 0, passed: 0 };
    prev.total += 1;
    if ((attempt.score ?? 0) >= 80) prev.passed += 1;
    passBuckets.set(label, prev);
  }

  const passRateData = Array.from(passBuckets.entries()).map(([label, value]) => ({
    label,
    passRate: value.total > 0 ? Math.round((value.passed / value.total) * 100) : 0,
  }));

  const users = usersRes.data ?? [];
  const userRows = users.map((profile) => {
    const scoped = assignments.filter((item) => item.user_id === profile.id);
    const completed = scoped.filter((item) => item.status === "completed").length;
    const assigned = scoped.length;
    const scored = scoped.filter((item) => typeof item.score === "number");
    const avgScore = scored.length > 0
      ? Number((scored.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / scored.length).toFixed(2))
      : null;
    const timeSpentMinutes = scoped.reduce((sum, item) => sum + (item.time_spent_minutes ?? 0), 0);

    return {
      id: profile.id,
      fullName: profile.full_name || "Unknown User",
      role: profile.role,
      assigned,
      completed,
      completionPct: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
      avgScore,
      timeSpentMinutes,
    };
  });

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Compliance Dashboard</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Organization Analytics</h1>
        <p className="mt-2 text-sm text-slate-600">Track completion by regulation, pass rates over time, and user-level progress.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <CompletionChart data={completionData} />
        <PassRateChart data={passRateData} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">User Progress Table</h2>
        <UserProgressTable rows={userRows} />
      </section>
    </div>
  );
}
