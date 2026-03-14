"use client";
import Link from "next/link";
import type { Regulation } from "@/lib/constants/regulations";
import { REGULATION_COLORS } from "@/lib/constants/regulations";
import { useI18n } from "@/lib/i18n/context";

type ModuleCardProps = {
  id: string;
  title: string;
  description: string;
  regulation: Regulation;
  audienceRole: string;
  estimatedMinutes: number;
  status?: "assigned" | "in_progress" | "completed" | "overdue";
};

function statusClass(status?: ModuleCardProps["status"]): string {
  if (!status) return "status-badge status-assigned";
  if (status === "in_progress") return "status-badge status-in_progress";
  if (status === "completed") return "status-badge status-completed";
  if (status === "overdue") return "status-badge status-overdue";
  return "status-badge status-assigned";
}

export function ModuleCard({
  id,
  title,
  description,
  regulation,
  audienceRole,
  estimatedMinutes,
  status,
}: ModuleCardProps) {
  const { t } = useI18n();
  const color = REGULATION_COLORS[regulation];

  function statusLabel(s?: ModuleCardProps["status"]): string {
    if (!s) return t("common.notAssigned");
    if (s === "in_progress") return t("common.inProgress");
    if (s === "completed") return t("common.completed");
    if (s === "overdue") return t("common.overdue");
    return t("common.assigned");
  }

  return (
    <article className="surface-card p-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${color.bg} ${color.fg}`}>
            {regulation}
          </span>
          <h3 className="mt-2 text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{description}</p>
        </div>

        <span className={statusClass(status)}>{statusLabel(status)}</span>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {audienceRole} · {estimatedMinutes} {t("common.minutes")}
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Link href={`/training/${id}`} className="btn-secondary w-full rounded-md px-3 py-1.5 text-center text-xs font-semibold sm:w-auto">
            {t("common.viewDetails")}
          </Link>
          <Link href={`/training/${id}/learn`} className="btn-primary w-full rounded-md px-3 py-1.5 text-center text-xs font-semibold sm:w-auto">
            {t("common.start")}
          </Link>
        </div>
      </div>
    </article>
  );
}
