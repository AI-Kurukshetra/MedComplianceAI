"use client";
import type { CSSProperties } from "react";
import { useI18n } from "@/lib/i18n/context";

export function ComplianceMeter({ score }: { score: number }) {
  const { t } = useI18n();
  const bounded = Math.max(0, Math.min(100, score));
  return (
    <div className="surface-card flex flex-col items-center gap-4 p-4 text-center sm:flex-row sm:text-left">
      <div
        className="radial-meter flex size-24 items-center justify-center rounded-full"
        style={{ "--meter-score": bounded.toString() } as CSSProperties}
      >
        <div className="flex size-[4.5rem] items-center justify-center rounded-full bg-white text-center">
          <span className="text-xl font-black text-slate-900">{bounded}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("dashboard.complianceScore")}</p>
        <p className="mt-1 text-sm text-slate-600">Organization readiness based on completion and assessment outcomes.</p>
      </div>
    </div>
  );
}
