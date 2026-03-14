"use client";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  regulation: string;
  title: string;
  questionCount: number;
};

export function QuizHeader({ regulation, title, questionCount }: Props) {
  const { t } = useI18n();
  return (
    <section className="hero-card rounded-2xl p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {regulation} · {t("quiz.assessment")}
      </p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <p className="muted mt-1 text-sm">
        Answer all {questionCount} question{questionCount !== 1 ? "s" : ""} to submit your attempt.
        You need <strong>80%</strong> or higher to pass and earn your certificate.
      </p>
    </section>
  );
}
