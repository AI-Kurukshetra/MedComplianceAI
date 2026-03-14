import type { PredictiveUserRisk } from "@/features/ai/insights";

type PredictiveRiskTableProps = {
  rows: PredictiveUserRisk[];
};

function tierClass(tier: PredictiveUserRisk["riskTier"]): string {
  if (tier === "critical") return "bg-rose-100 text-rose-700";
  if (tier === "high") return "bg-amber-100 text-amber-700";
  if (tier === "medium") return "bg-sky-100 text-sky-700";
  return "bg-emerald-100 text-emerald-700";
}

export function PredictiveRiskTable({ rows }: PredictiveRiskTableProps) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="responsive-table">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3">Overdue</th>
              <th className="px-4 py-3">Due Soon</th>
              <th className="px-4 py-3">Avg Score</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.userId}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{row.fullName}</p>
                  <p className="text-xs text-slate-500 break-all">{row.email ?? "-"}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.role}</td>
                <td className="px-4 py-3 text-slate-600">{row.completionPct}%</td>
                <td className="px-4 py-3 text-slate-600">{row.overdue}</td>
                <td className="px-4 py-3 text-slate-600">{row.dueSoon}</td>
                <td className="px-4 py-3 text-slate-600">{row.avgScore ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${tierClass(row.riskTier)}`}>
                    {row.riskTier} · {row.riskScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
