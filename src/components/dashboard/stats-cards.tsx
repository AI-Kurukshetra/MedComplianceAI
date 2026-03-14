"use client";
import { useI18n } from "@/lib/i18n/context";

type StatsCardsProps = {
  assigned: number;
  completed: number;
  overdue: number;
  certificates: number;
};

export function StatsCards({ assigned, completed, overdue, certificates }: StatsCardsProps) {
  const { t } = useI18n();
  return (
    <section className="kpi-grid">
      <article className="kpi-tile">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("stats.assigned")}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{assigned}</p>
      </article>
      <article className="kpi-tile">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("stats.completed")}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{completed}</p>
      </article>
      <article className="kpi-tile">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("stats.overdue")}</p>
        <p className="mt-1 text-2xl font-black text-rose-600">{overdue}</p>
      </article>
      <article className="kpi-tile">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("stats.certificates")}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{certificates}</p>
      </article>
    </section>
  );
}
