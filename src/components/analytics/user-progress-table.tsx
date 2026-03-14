type UserProgressRow = {
  id: string;
  fullName: string;
  role: string;
  assigned: number;
  completed: number;
  completionPct: number;
  avgScore: number | null;
  timeSpentMinutes: number;
};

export function UserProgressTable({ rows }: { rows: UserProgressRow[] }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="responsive-table">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3">Avg Score</th>
              <th className="px-4 py-3">Time Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{row.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{row.role}</td>
                <td className="px-4 py-3 text-slate-600">{row.assigned}</td>
                <td className="px-4 py-3 text-slate-600">{row.completed}</td>
                <td className="px-4 py-3 text-slate-600">{row.completionPct}%</td>
                <td className="px-4 py-3 text-slate-600">{row.avgScore ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{row.timeSpentMinutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
