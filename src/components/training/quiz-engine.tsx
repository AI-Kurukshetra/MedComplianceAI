"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  saveQuizProgress,
  loadQuizProgress,
  clearQuizProgress,
  addPendingSubmission,
} from "@/lib/offline/indexed-db";

type QuizOption = {
  id: string;
  body: string;
};

type QuizQuestion = {
  id: string;
  body: string;
  points: number;
  options: QuizOption[];
};

type QuizResult = {
  score: number;
  passed: boolean;
  certIssued: boolean;
};

type QuizEngineProps = {
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
  onSubmit: (payload: { questionId: string; optionId: string }[]) => Promise<QuizResult>;
};

export function QuizEngine({ moduleId, moduleTitle, questions, onSubmit }: QuizEngineProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);
  const saveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Restore saved progress from IndexedDB on mount */
  useEffect(() => {
    loadQuizProgress(moduleId).then((saved) => {
      if (saved && Object.keys(saved).length > 0) {
        setAnswers(saved);
      }
    }).catch(() => { /* IndexedDB unavailable */ });

    setIsOffline(!navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [moduleId]);

  const total = questions.length;
  const current = questions[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const canSubmit = answeredCount === total && total > 0;

  /* Progress through questions (0–100 based on answered, not current index) */
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center">
        <p className="text-3xl">📭</p>
        <p className="mt-3 text-base font-semibold text-slate-800">
          {t("quiz.noQuestions")}
        </p>
        <p className="muted mt-1 text-sm">
          {t("quiz.noQuestionsDesc")}
        </p>
        <Link
          href={`/training/${moduleId}`}
          className="btn-secondary mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"
        >
          {t("quiz.backToModule")}
        </Link>
      </div>
    );
  }

  /* ── Result Screen ─────────────────────────────────────── */
  if (result) {
    const passed = result.passed;
    return (
      <div className="surface-card reveal rounded-2xl p-6 md:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
            style={{
              background: passed ? "var(--success-bg)" : "#fff1f2",
              border: `3px solid ${passed ? "#059669" : "#b4233d"}`,
            }}
          >
            {passed ? "🏆" : "📝"}
          </div>

          <div>
            <h2
              className="text-3xl font-extrabold"
              style={{ color: passed ? "#059669" : "#b4233d" }}
            >
              {passed ? t("quiz.youPassed") : t("quiz.notQuite")}
            </h2>
            <p className="muted mt-1 text-sm">
              {moduleTitle}
            </p>
          </div>

          {/* Score ring */}
          <div
            className="flex flex-col items-center gap-1 rounded-2xl px-10 py-5"
            style={{
              background: passed ? "var(--success-bg)" : "#fff1f2",
              border: `1px solid ${passed ? "#bbf7d0" : "#fecdd3"}`,
            }}
          >
            <p
              className="text-5xl font-black"
              style={{ color: passed ? "#059669" : "#b4233d" }}
            >
              {result.score}%
            </p>
            <p className="text-sm font-semibold text-slate-600">
              {passed
                ? `Passing score · ${answeredCount}/${total} answered`
                : `Need 80% to pass · You scored ${result.score}%`}
            </p>
          </div>

          {passed && result.certIssued && (
            <div
              className="w-full max-w-sm rounded-xl px-5 py-4 text-center"
              style={{
                background: "linear-gradient(135deg, #eef3ff 0%, #e8f8f0 100%)",
                border: "1px solid #bbd4ed",
              }}
            >
              <p className="text-sm font-bold text-slate-800">🎓 {t("quiz.certIssued")}</p>
              <p className="muted mt-0.5 text-xs">
                {t("quiz.certIssuedDesc")}
              </p>
            </div>
          )}

          {!passed && (
            <p className="max-w-sm text-sm text-slate-600">
              {t("quiz.reviewAndRetry")}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {passed ? (
              <>
                <Link
                  href="/certifications"
                  className="btn-primary rounded-lg px-5 py-2.5 text-sm font-bold"
                >
                  {t("quiz.viewCertificate")}
                </Link>
                <Link
                  href="/training"
                  className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-semibold"
                >
                  {t("quiz.browseMore")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/training/${moduleId}/learn`}
                  className="btn-primary rounded-lg px-5 py-2.5 text-sm font-bold"
                >
                  {t("quiz.reviewModule")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                    setCurrentIndex(0);
                    setSubmitError(null);
                    setOfflineQueued(false);
                    clearQuizProgress(moduleId).catch(() => {});
                  }}
                  className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-semibold"
                >
                  {t("quiz.retryQuiz")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Quiz Interface ────────────────────────────────────── */
  const handleSelect = (optionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [current.id]: optionId };

      /* Debounced save to IndexedDB */
      if (saveDebounce.current) clearTimeout(saveDebounce.current);
      saveDebounce.current = setTimeout(() => {
        saveQuizProgress(moduleId, next).catch(() => {});
      }, 800);

      return next;
    });
  };

  const next = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = () => {
    if (!canSubmit || isPending) return;
    setSubmitError(null);

    const payload = questions.map((q) => ({
      questionId: q.id,
      optionId: answers[q.id],
    }));

    /* If offline — queue submission and show message */
    if (isOffline) {
      addPendingSubmission(moduleId, payload)
        .then(() => setOfflineQueued(true))
        .catch(() => setSubmitError("Failed to save offline. Please reconnect and retry."));
      return;
    }

    startTransition(async () => {
      try {
        const res = await onSubmit(payload);
        /* Clear persisted progress after successful submit */
        clearQuizProgress(moduleId).catch(() => {});
        setResult(res);
      } catch {
        setSubmitError("Submission failed. Please try again.");
      }
    });
  };

  /* ── Offline queued screen ──────────────────────────────── */
  if (offlineQueued) {
    return (
      <div className="surface-card reveal rounded-2xl p-6 md:p-8 text-center">
        <p className="text-5xl">📶</p>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">{t("quiz.submissionQueued")}</h2>
        <p className="muted mt-2 text-sm">{t("quiz.offlineSubmit")}</p>
        <Link
          href="/dashboard"
          className="btn-primary mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-bold"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="surface-card reveal rounded-2xl p-4" style={{ animationDelay: "40ms" }}>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t("quiz.quizProgress")}
        </p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{answeredCount} {t("quiz.answeredOf")} {total} {t("quiz.answered")}</span>
            <span style={{ color: progressPct === 100 ? "#059669" : undefined, fontWeight: progressPct === 100 ? 700 : undefined }}>
              {progressPct}%
            </span>
          </div>
          <div className="progress-track mt-1.5">
            <div
              className="progress-value"
              style={{
                width: `${progressPct}%`,
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
        </div>

        {/* Question grid */}
        <div className="mt-4 grid grid-cols-5 gap-1.5 sm:grid-cols-6 lg:grid-cols-5">
          {questions.map((q, i) => {
            const isActive = i === currentIndex;
            const isAnswered = Boolean(answers[q.id]);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className="aspect-square rounded-md text-xs font-bold transition"
                style={{
                  background: isAnswered
                    ? "var(--brand)"
                    : isActive
                    ? "var(--brand-soft)"
                    : "#f1f5f9",
                  color: isAnswered
                    ? "#ffffff"
                    : isActive
                    ? "var(--brand)"
                    : "#64748b",
                  border: isActive
                    ? "2px solid var(--brand)"
                    : "1px solid transparent",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded" style={{ background: "var(--brand)" }} />
            {t("common.answered") !== "common.answered" ? t("common.answered") : "Answered"}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded" style={{ background: "var(--brand-soft)", border: "2px solid var(--brand)" }} />
            Current
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded bg-slate-200" />
            Not answered
          </div>
        </div>

        {/* Offline progress saved indicator */}
        {isOffline && answeredCount > 0 && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t("quiz.offlineSaved")}
          </p>
        )}
      </aside>

      {/* ── Question Panel ──────────────────────────────── */}
      <section className="space-y-4">
        <div
          className="reveal surface-card rounded-2xl p-5 md:p-6"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Question {currentIndex + 1} <span className="font-normal">of {total}</span>
            </p>
            <span className="badge">{current.points} pt{current.points !== 1 ? "s" : ""}</span>
          </div>

          <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900">
            {current.body}
          </h2>

          <div className="mt-4 space-y-2.5">
            {current.options.map((option, optIdx) => {
              const selected = answers[current.id] === option.id;
              const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D
              return (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all hover:-translate-y-px"
                  style={{
                    borderColor: selected ? "var(--brand)" : "var(--border)",
                    background: selected ? "var(--brand-soft)" : "white",
                    boxShadow: selected
                      ? "0 0 0 2px rgba(15, 79, 169, 0.15)"
                      : undefined,
                  }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: selected ? "var(--brand)" : "#f1f5f9",
                      color: selected ? "white" : "#64748b",
                    }}
                  >
                    {optLabel}
                  </span>
                  <input
                    type="radio"
                    name={current.id}
                    value={option.id}
                    checked={selected}
                    onChange={() => handleSelect(option.id)}
                    className="sr-only"
                  />
                  <span className="text-sm leading-relaxed text-slate-700">
                    {option.body}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {submitError && (
          <p className="rounded-xl border border-red-200 bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-fg)]">
            {submitError}
          </p>
        )}

        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={currentIndex === 0}
            className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            {t("quiz.previousBtn")}
          </button>

          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            {currentIndex < total - 1 && (
              <button
                type="button"
                onClick={next}
                className="btn-primary rounded-lg px-4 py-2.5 text-sm font-semibold"
              >
                {t("quiz.nextBtn")}
              </button>
            )}

            {canSubmit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="btn-primary rounded-lg px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isPending
                    ? undefined
                    : isOffline
                    ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
                    : "linear-gradient(135deg, #059669 0%, #0f4fa9 100%)",
                }}
              >
                {isPending
                  ? t("quiz.submitting")
                  : isOffline
                  ? "Save for Later 📶"
                  : t("quiz.submitQuiz")}
              </button>
            )}
          </div>
        </div>

        {!canSubmit && (
          <p className="text-center text-xs text-slate-500">
            {t("quiz.answerAllToSubmit", { total, remaining: total - answeredCount })}
          </p>
        )}
      </section>
    </div>
  );
}
