"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n, SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/context";

const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  hi: "🇮🇳",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Close on click-outside */
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-base text-slate-600 hover:bg-slate-200 sm:size-10"
        aria-label="Change language"
        title="Change language"
      >
        <span>{FLAG[locale]}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label="Select language"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              role="option"
              aria-selected={loc === locale}
              onClick={() => {
                setLocale(loc);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                loc === locale ? "font-bold text-primary" : "text-slate-700"
              }`}
            >
              <span className="text-base">{FLAG[loc]}</span>
              <span>{LOCALE_LABELS[loc]}</span>
              {loc === locale && (
                <span className="ml-auto text-primary">
                  <span className="material-symbols-outlined text-sm">check</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
