"use client";
import Link from "next/link";
import { daysUntil, formatDate } from "@/lib/utils/date";
import { useI18n } from "@/lib/i18n/context";

type CertificateCardProps = {
  id: string;
  certificateNo: string;
  title: string;
  issuedAt: string;
  expiresAt: string;
};

export function CertificateCard({ id, certificateNo, title, issuedAt, expiresAt }: CertificateCardProps) {
  const { t } = useI18n();
  const remainingDays = daysUntil(expiresAt);
  const expiringSoon = remainingDays !== null && remainingDays <= 45;

  return (
    <article className="surface-card overflow-hidden">
      <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/5 to-white px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("certifications.certNo")}</p>
        <p className="mt-1 text-sm font-bold text-slate-900">{certificateNo}</p>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <span className={expiringSoon ? "status-badge status-overdue" : "status-badge status-completed"}>
            {expiringSoon ? t("certifications.renewSoon") : t("certifications.active")}
          </span>
        </div>
        <dl className="mt-3 space-y-1 text-xs text-slate-600">
          <div className="flex items-center justify-between gap-2">
            <dt className="font-semibold">{t("certifications.issued")}</dt>
            <dd>{formatDate(issuedAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="font-semibold">{t("certifications.expires")}</dt>
            <dd>{formatDate(expiresAt)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href={`/certifications/${id}`} className="btn-secondary w-full rounded-md px-3 py-1.5 text-center text-xs font-semibold sm:w-auto">
            {t("certifications.view")}
          </Link>
          <Link href={`/api/certifications/${id}/download`} className="btn-primary w-full rounded-md px-3 py-1.5 text-center text-xs font-semibold sm:w-auto">
            {t("certifications.download")}
          </Link>
        </div>
      </div>
    </article>
  );
}
