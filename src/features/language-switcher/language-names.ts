import type { Locale } from "@/i18n/routing";

export const LANGUAGE_NAMES = {
  en: "English",
  uk: "Українська",
} as const satisfies Record<Locale, string>;

export const OTHER_LOCALE = {
  en: "uk",
  uk: "en",
} as const satisfies Record<Locale, Locale>;

// "UA", not "UK": the language code reads as the United Kingdom
export const LANGUAGE_CODES = {
  en: "EN",
  uk: "UA",
} as const satisfies Record<Locale, string>;
