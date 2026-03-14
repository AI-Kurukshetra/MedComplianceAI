import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole } from "@/lib/constants/roles";
import { buildPredictiveAnalytics } from "@/features/ai/insights";
import { PredictiveRiskTable } from "@/components/analytics/predictive-risk-table";

function riskColor(score: number): string {
  if (score >= 75) return "text-rose-600";
  if (score >= 55) return "text-amber-600";
  return "text-emerald-600";
}

export default async function DashboardPredictivePage() {
  const user = await requireUserContext();
  if (!isManagerRole(user.role)) {
    redirect("/dashboard?error=Only%20managers%20can%20view%20predictive%20analytics");
  }

  const supabase = await createClient();
  const analytics = await buildPredictiveAnalytics(supabase, user.organizationId, 30);

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Predictive Analytics Dashboard</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Forecasted Compliance Risk</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          AI risk modeling forecasts user-level and regulation-level compliance slippage over the next {analytics.horizonDays} days.
        </p>
      </section>

      <section className="kpi-grid">
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Org Risk Score</p>
          <p className={`mt-1 text-2xl font-black ${riskColor(analytics.organizationRiskScore)}`}>
            {analytics.organizationRiskScore}
          </p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">At-Risk Users</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{analytics.atRiskUsers}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical Users</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{analytics.criticalUsers}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Predicted Overdue</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{analytics.predictedOverdueCount}</p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">User Risk Table</h2>
          <PredictiveRiskTable rows={analytics.userRisks.slice(0, 100)} />
        </section>

        <section className="space-y-4">
          <article className="surface-card p-5">
            <h2 className="text-lg font-bold text-slate-900">Recommended Interventions</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {analytics.interventions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>

          <article className="surface-card p-5">
            <h2 className="text-lg font-bold text-slate-900">Regulation Risk Forecast</h2>
            <div className="mt-3 space-y-2">
              {analytics.regulationRisks.map((item) => (
                <div key={item.regulation} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{item.regulation}</p>
                    <span className={`text-sm font-black ${riskColor(item.riskScore)}`}>{item.riskScore}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Completion {item.completionPct}% · Overdue {item.overdue} · Avg Score {item.avgScore ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
