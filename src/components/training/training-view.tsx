"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { assignModuleToSelfAction, createModuleAction } from "@/app/(protected)/dashboard/actions";
import { ModuleCard } from "@/components/training/module-card";
import type { Regulation } from "@/lib/constants/regulations";

type ModuleRow = {
  id: string;
  title: string;
  description: string;
  regulation: string;
  audience_role: string;
  estimated_minutes: number;
};

type AssignmentRow = {
  module_id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
};

type Props = {
  modules: ModuleRow[];
  assignments: AssignmentRow[];
  inProgressCount: number;
  currentRegulation: string | null;
  canCreateModule: boolean;
  error: string | null;
  success: string | null;
  regulations: string[];
};

export function TrainingView({
  modules,
  assignments,
  inProgressCount,
  currentRegulation,
  canCreateModule,
  error,
  success,
  regulations,
}: Props) {
  const { t } = useI18n();
  const statusByModuleId = new Map(assignments.map((a) => [a.module_id, a.status]));

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {decodeURIComponent(success)}
        </p>
      ) : null}

      <section className="hero-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("training.myCourses")}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("training.title")}</h1>
            <p className="mt-2 text-sm text-slate-600">{t("training.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge">{modules.length} {t("common.modules")}</span>
            <span className="badge">{inProgressCount} {t("common.inProgress")}</span>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="scrollbar-hide flex w-full items-center gap-2 overflow-x-auto sm:w-auto sm:flex-wrap">
            <Link
              href="/training"
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                !currentRegulation ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-600"
              }`}
            >
              {t("training.filterAll")}
            </Link>
            {regulations.map((item) => (
              <Link
                key={item}
                href={`/training?regulation=${item}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  currentRegulation === item
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>

          {canCreateModule ? (
            <details className="rounded-lg border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-xs font-bold text-slate-700">{t("training.createModule")}</summary>
              <form action={createModuleAction} className="mt-3 grid gap-2 md:grid-cols-2">
                <input type="hidden" name="return_to" value="/training" />
                <input className="field rounded-md p-2 text-sm" name="title" placeholder={t("training.moduleTitle")} required />
                <input className="field rounded-md p-2 text-sm" name="audience_role" placeholder={t("training.audienceRole")} required />
                <select className="field rounded-md p-2 text-sm" name="regulation" defaultValue="HIPAA">
                  {regulations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button className="btn-primary rounded-md px-3 py-2 text-sm font-semibold" type="submit">
                  {t("common.save")}
                </button>
              </form>
            </details>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {modules.length === 0 ? (
          <p className="surface-card p-4 text-sm text-slate-600 sm:col-span-2">{t("training.noModules")}</p>
        ) : (
          modules.map((module) => (
            <div key={module.id} className="space-y-2">
              <ModuleCard
                id={module.id}
                title={module.title}
                description={module.description}
                regulation={module.regulation as Regulation}
                audienceRole={module.audience_role}
                estimatedMinutes={module.estimated_minutes}
                status={statusByModuleId.get(module.id)}
              />

              {!statusByModuleId.has(module.id) ? (
                <form action={assignModuleToSelfAction} className="surface-card p-3">
                  <input type="hidden" name="return_to" value="/training" />
                  <input type="hidden" name="module_id" value={module.id} />
                  <button type="submit" className="btn-secondary w-full rounded-md px-3 py-2 text-sm font-semibold">
                    {t("common.assignToMe")}
                  </button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
