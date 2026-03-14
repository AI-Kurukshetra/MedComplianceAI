import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirect("/dashboard?error=Admin%20access%20is%20restricted%20to%20organization%20admins");
  }

  const supabase = await createClient();

  const [
    modulesResult,
    assignmentResult,
    notificationsResult,
    certsResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from("training_modules")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId),
    supabase
      .from("module_assignments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId)
      .is("read_at", null),
    supabase
      .from("certifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId),
    supabase
      .from("audit_logs")
      .select("id, action, created_at")
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Console</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Compliance Overview</h1>
            <p className="mt-2 text-sm text-slate-600">
              Real-time operations summary across training, certification, policy, and audit workflows.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Link href="/admin/audit" className="btn-secondary rounded-md px-4 py-2 text-sm font-semibold">
              Audit Trail
            </Link>
            <Link href="/dashboard/compliance" className="btn-primary rounded-md px-4 py-2 text-sm font-semibold">
              Compliance Report
            </Link>
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Modules</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{modulesResult.count ?? 0}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assignments</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{assignmentResult.count ?? 0}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Unread Alerts</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{notificationsResult.count ?? 0}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Certificates</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{certsResult.count ?? 0}</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Audit Events</h2>
            <Link href="/admin/audit" className="text-xs font-bold text-primary hover:underline">
              View all
            </Link>
          </div>

          <ul className="mt-3 space-y-2">
            {(auditResult.data ?? []).map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg font-bold text-slate-900">Quick Links</h2>
          <div className="mt-3 space-y-2">
            <Link href="/admin/modules" className="btn-secondary block rounded-md px-3 py-2 text-sm font-semibold">
              Module Studio
            </Link>
            <Link href="/admin/users" className="btn-secondary block rounded-md px-3 py-2 text-sm font-semibold">
              Staff & Training Paths
            </Link>
            <Link href="/admin/policies" className="btn-secondary block rounded-md px-3 py-2 text-sm font-semibold">
              Policy Library
            </Link>
            <Link href="/notifications" className="btn-secondary block rounded-md px-3 py-2 text-sm font-semibold">
              Notification Center
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
