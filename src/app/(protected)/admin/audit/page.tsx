import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole } from "@/lib/constants/roles";
import { formatDateTime } from "@/lib/utils/date";

export default async function AdminAuditPage() {
  const user = await requireUserContext();

  if (!isManagerRole(user.role)) {
    redirect("/dashboard?error=Only%20managers%20can%20view%20audit%20logs");
  }

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, actor_user_id, created_at")
    .eq("organization_id", user.organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Reporting & Audit Trail</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Activity Logs</h1>
        <p className="mt-2 text-sm text-slate-600">Monitor security-sensitive events, training actions, and record changes with timestamps.</p>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="responsive-table">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(logs ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.entity_type}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{log.entity_id}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{log.actor_user_id ?? "system"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
