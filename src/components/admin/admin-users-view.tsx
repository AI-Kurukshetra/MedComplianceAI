"use client";
import { useI18n } from "@/lib/i18n/context";
import { UserTable } from "@/components/admin/user-table";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  assignmentCount: number;
  completionRate: number;
};

type PathData = { role: string; count: number; minutes: number };

type Props = {
  users: UserRow[];
  activeTrainingCount: number;
  overdueStaffCount: number;
  avgCompletion: number;
  pathByRole: PathData[];
};

export function AdminUsersView({
  users,
  activeTrainingCount,
  overdueStaffCount,
  avgCompletion,
  pathByRole,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("admin.pageLabel")}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("admin.heading")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("admin.description")}</p>
      </section>

      <section className="kpi-grid">
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("admin.totalStaff")}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{users.length}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("admin.trainingActive")}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{activeTrainingCount}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("admin.complianceRate")}</p>
          <p className="mt-1 text-2xl font-black text-primary">{avgCompletion}%</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("admin.needsAttention")}</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{overdueStaffCount}</p>
        </article>
      </section>

      <UserTable users={users} />

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="surface-card p-5">
          <h2 className="text-lg font-bold text-slate-900">{t("admin.availableTrainingPaths")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {pathByRole.map(({ role, count, minutes }) => (
              <article key={role} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-slate-900">{role}</p>
                <p className="mt-1 text-xs text-slate-500">{count} {t("admin.modules")}</p>
                <p className="text-xs text-slate-500">{Math.round(minutes / 60)}{t("admin.totalHours")}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="surface-card p-5">
          <h2 className="text-lg font-bold text-slate-900">{t("admin.complianceAlerts")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-rose-700">
              {t("admin.alertBelow40", { count: overdueStaffCount })}
            </li>
            <li className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-amber-700">
              {t("admin.alertRenewals")}
            </li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
