"use client";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ComplianceMeter } from "@/components/dashboard/compliance-meter";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { formatDate, relativeTime } from "@/lib/utils/date";

type Props = {
  userName: string;
  completionPct: number;
  totalTimeSpentMinutes: number;
  assigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  certificates: number;
  orgScore: number;
  assignments: Array<{
    id: string;
    moduleId: string;
    moduleTitle: string;
    moduleRegulation: string;
    status: string;
    dueDate: string | null;
    completedAt: string | null;
    score: number | null;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    regulation: string;
    estimatedMinutes: number;
  }>;
  activities: Array<{
    id: number;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
};

function statusClass(status: string): string {
  if (status === "completed") return "status-badge status-completed";
  if (status === "in_progress") return "status-badge status-in_progress";
  if (status === "overdue") return "status-badge status-overdue";
  return "status-badge status-assigned";
}

export function DashboardView({
  userName,
  completionPct,
  totalTimeSpentMinutes,
  assigned,
  completed,
  inProgress,
  overdue,
  certificates,
  orgScore,
  assignments,
  recommendations,
  activities,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("dashboard.portalLabel")}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {t("dashboard.welcomeBack")}, {userName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {t("dashboard.completionMessage", { pct: completionPct })}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("dashboard.learningTime", { minutes: totalTimeSpentMinutes })}
            </p>
          </div>
          <div className="w-full max-w-xs rounded-xl bg-primary p-4 text-white shadow-lg shadow-primary/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">{t("dashboard.annualProgress")}</p>
            <p className="mt-1 text-3xl font-black">{completionPct}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/30">
              <div
                className="progress-width h-full bg-white"
                style={{ "--progress-width": `${completionPct}%` } as CSSProperties}
              />
            </div>
          </div>
        </div>
      </section>

      <StatsCards
        assigned={assigned}
        completed={completed}
        overdue={overdue}
        certificates={certificates}
      />

      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">{t("dashboard.myTrainingStatus")}</h2>
            <Link href="/training" className="text-xs font-bold text-primary hover:underline">
              {t("dashboard.viewAllModules")}
            </Link>
          </div>

          <div className="responsive-table">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">{t("dashboard.courseModule")}</th>
                  <th className="px-5 py-3">{t("dashboard.category")}</th>
                  <th className="px-5 py-3">{t("dashboard.status")}</th>
                  <th className="px-5 py-3">{t("dashboard.dueDate")}</th>
                  <th className="px-5 py-3 text-right">{t("dashboard.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-sm text-slate-600">
                      {t("dashboard.noAssignments")}
                    </td>
                  </tr>
                ) : (
                  assignments.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{item.moduleTitle}</p>
                        <p className="text-xs text-slate-500">
                          {t("dashboard.updated")} {item.completedAt ? relativeTime(item.completedAt) : t("dashboard.updatedRecently").toLowerCase()}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{item.moduleRegulation}</td>
                      <td className="px-5 py-3">
                        <span className={statusClass(item.status)}>{item.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(item.dueDate)}</td>
                      <td className="px-5 py-3 text-right">
                        {item.status === "completed" ? (
                          <Link href="/certifications" className="text-xs font-bold text-primary hover:underline">
                            {t("dashboard.viewCertificate")}
                          </Link>
                        ) : (
                          <Link href={`/training/${item.moduleId}/learn`} className="btn-primary rounded-md px-3 py-1.5 text-xs font-semibold">
                            {t("common.continue")}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <ComplianceMeter score={orgScore} />

          <section className="surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t("dashboard.recommendedNext")}</h2>
              <span className="badge">{t("dashboard.inProgressCount", { count: inProgress })}</span>
            </div>

            <ul className="mt-3 space-y-2">
              {recommendations.map((module) => (
                <li key={module.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {module.regulation} · {module.estimatedMinutes} {t("common.minutes")}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <RecentActivity rows={activities} />
        </div>
      </div>
    </div>
  );
}
