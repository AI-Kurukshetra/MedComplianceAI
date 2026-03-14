"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { assignModuleToSelfAction } from "@/app/(protected)/dashboard/actions";
import { formatDate } from "@/lib/utils/date";

type Props = {
  module: {
    id: string;
    title: string;
    description: string;
    regulation: string;
    audience_role: string;
    estimated_minutes: number;
    created_at: string;
  };
  assignment: {
    id: string;
    status: string;
    score: number | null;
    due_date: string | null;
    completed_at: string | null;
  } | null;
};

export function ModuleDetailView({ module, assignment }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("training.trainingModule")}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{module.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{module.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="badge">{module.regulation}</span>
            <span className="badge">{module.estimated_minutes} {t("common.minutes")}</span>
            <span className="badge">{module.audience_role}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <article className="surface-card p-5">
          <h2 className="text-lg font-bold text-slate-900">{t("training.lessonOverview")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("training.lessonDesc")}</p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("training.created")}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(module.created_at)}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("training.estimatedDuration")}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{module.estimated_minutes} {t("common.minutes")}</dd>
            </div>
          </dl>
        </article>

        <aside className="space-y-4">
          <section className="surface-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("training.currentStatus")}</h3>
            {assignment ? (
              <div className="mt-3 space-y-1">
                <span className="status-badge status-in_progress">{assignment.status}</span>
                <p className="text-xs text-slate-600">{t("training.due")}: {formatDate(assignment.due_date)}</p>
                {assignment.score !== null ? (
                  <p className="text-xs text-slate-600">{t("training.score")}: {assignment.score}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">{t("training.notAssignedYet")}</p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <Link href={`/training/${module.id}/learn`} className="btn-primary rounded-md px-3 py-2 text-sm font-semibold text-center">
                {t("training.startLearning")}
              </Link>

              {!assignment ? (
                <form action={assignModuleToSelfAction}>
                  <input type="hidden" name="return_to" value={`/training/${module.id}`} />
                  <input type="hidden" name="module_id" value={module.id} />
                  <button type="submit" className="btn-secondary w-full rounded-md px-3 py-2 text-sm font-semibold">
                    {t("common.assignToMe")}
                  </button>
                </form>
              ) : null}
            </div>
          </section>

          <section className="surface-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("training.resources")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>{t("training.resourceItems.0")}</li>
              <li>{t("training.resourceItems.1")}</li>
              <li>{t("training.resourceItems.2")}</li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}
