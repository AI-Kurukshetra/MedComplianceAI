export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE_NAME = "app_locale";

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.toLowerCase().trim();
  if (isSupportedLocale(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("es")) {
    return "es";
  }

  return DEFAULT_LOCALE;
}
