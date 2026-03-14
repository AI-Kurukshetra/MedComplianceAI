"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ── Static imports — bundled immediately, always available ── */
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import de from "./de.json";
import hi from "./hi.json";

export type Locale = "en" | "es" | "fr" | "de" | "hi";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  hi: "हिन्दी",
};

export const SUPPORTED_LOCALES: Locale[] = ["en", "es", "fr", "de", "hi"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationTree = Record<string, any>;

/* Single lookup table — no async loading needed */
const TRANSLATIONS: Record<Locale, TranslationTree> = { en, es, fr, de, hi };

/* Dot-path accessor: "quiz.submitQuiz" → string */
function getNestedValue(obj: TranslationTree, path: string): string {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = current[part];
  }
  return typeof current === "string" ? current : path;
}

/* Replace {key} placeholders */
function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/* ── Context ──────────────────────────────────────────────── */
type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => undefined,
  t: (key) => key,
});

const STORAGE_KEY = "mc_locale";

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.split("-")[0] as Locale;
  return SUPPORTED_LOCALES.includes(lang) ? lang : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  /* Initialise from localStorage or browser language on mount */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    const initial =
      stored && SUPPORTED_LOCALES.includes(stored) ? stored : detectBrowserLocale();
    if (initial !== "en") setLocaleState(initial);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable in some contexts */
    }
  }, []);

  /* t() reads directly from the static lookup — zero async, zero delay */
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = getNestedValue(TRANSLATIONS[locale], key);
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
