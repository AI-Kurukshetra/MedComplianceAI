import { formatDateTime } from "@/lib/utils/date";

type ActivityRow = {
  id: number;
  action: string;
  entityType: string;
  createdAt: string;
};

export function RecentActivity({ rows }: { rows: ActivityRow[] }) {
  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
        <span className="badge">{rows.length} events</span>
      </div>

      <ul className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">No audit events yet.</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{row.action}</p>
              <p className="mt-1 text-xs text-slate-500">{row.entityType}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateTime(row.createdAt)}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
