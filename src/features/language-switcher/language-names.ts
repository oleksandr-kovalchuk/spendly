import type { Locale } from "@/i18n/routing";

export const LANGUAGE_NAMES = {
  en: "English",
  uk: "Українська",
} as const satisfies Record<Locale, string>;

export const OTHER_LOCALE = {
  en: "uk",
  uk: "en",
} as const satisfies Record<Locale, Locale>;
