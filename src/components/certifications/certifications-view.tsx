"use client";
import { useI18n } from "@/lib/i18n/context";
import { CertificateCard } from "@/components/certifications/certificate-card";

type CertRow = {
  id: string;
  certificateNo: string;
  title: string;
  issuedAt: string;
  expiresAt: string;
};

type TimelineItem = {
  at: string;
  title: string;
  detail: string;
  kind: "certificate" | "training";
};

type Props = {
  certifications: CertRow[];
  timeline: TimelineItem[];
  expiringSoon: number;
  earnedBadges: number;
  verifiedSkills: number;
  totalHours: number;
  userName: string;
};

export function CertificationsView({
  certifications,
  timeline,
  expiringSoon,
  earnedBadges,
  verifiedSkills,
  totalHours,
  userName,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("certifications.pageLabel")}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("certifications.heading")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{t("certifications.description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge">{certifications.length} {t("certifications.total")}</span>
            <span className="badge">{expiringSoon} {t("certifications.expiringSoon").toLowerCase()}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="surface-card flex items-center gap-3 p-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined">award_star</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.earnedBadges")}</p>
            <p className="text-2xl font-black text-slate-900">{earnedBadges}</p>
          </div>
        </article>
        <article className="surface-card flex items-center gap-3 p-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.verifiedSkills")}</p>
            <p className="text-2xl font-black text-slate-900">{verifiedSkills}</p>
          </div>
        </article>
        <article className="surface-card flex items-center gap-3 p-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <span className="material-symbols-outlined">update</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.expiringSoon")}</p>
            <p className="text-2xl font-black text-slate-900">{expiringSoon}</p>
          </div>
        </article>
        <article className="surface-card flex items-center gap-3 p-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <span className="material-symbols-outlined">hourglass_top</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.trainingHours")}</p>
            <p className="text-2xl font-black text-slate-900">{totalHours}</p>
          </div>
        </article>
      </section>

      <section className="kpi-grid">
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.earnedCertificates")}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{certifications.length}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.expiringSoon")}</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{expiringSoon}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.holder")}</p>
          <p className="mt-1 text-base font-bold text-slate-900">{userName}</p>
        </article>
        <article className="kpi-tile">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("certifications.readiness")}</p>
          <p className="mt-1 text-2xl font-black text-primary">
            {certifications.length > 0 ? t("certifications.readinessActive") : t("certifications.readinessPending")}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {certifications.length === 0 ? (
            <p className="surface-card p-4 text-sm text-slate-600 md:col-span-2">
              {t("certifications.noCerts")}
            </p>
          ) : (
            certifications.map((cert) => (
              <CertificateCard
                key={cert.id}
                id={cert.id}
                certificateNo={cert.certificateNo}
                title={cert.title}
                issuedAt={cert.issuedAt}
                expiresAt={cert.expiresAt}
              />
            ))
          )}
        </div>

        <aside className="surface-card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("certifications.complianceHistory")}</h3>
          {timeline.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">{t("certifications.noTimeline")}</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {timeline.map((item, index) => (
                <li key={`${item.at}-${item.title}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1 size-2 rounded-full ${
                        item.kind === "certificate" ? "bg-emerald-500" : "bg-primary"
                      }`}
                    />
                    {index < timeline.length - 1 ? <span className="mt-1 h-full w-px bg-slate-200" /> : null}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(item.at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </section>
    </div>
  );
}
