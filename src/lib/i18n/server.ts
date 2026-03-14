import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  type AppLocale,
} from "@/lib/i18n/config";
import { getDictionary, type TranslationDict } from "@/lib/i18n/dictionaries";

export type Translator = (key: string, fallback?: string) => string;

export function createTranslator(dict: TranslationDict): Translator {
  return (key: string, fallback?: string) => dict[key] ?? fallback ?? key;
}

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  if (acceptLanguage) {
    return normalizeLocale(acceptLanguage.split(",")[0]);
  }

  return DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);
  const t = createTranslator(dict);

  return {
    locale,
    dict,
    t,
  };
}
