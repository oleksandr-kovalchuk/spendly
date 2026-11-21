import { routing } from "@/i18n/routing";

// Without a base, the paths resolve against `metadataBase`
export function languageLinks(path: `/${string}`, base = "") {
  return Object.fromEntries(routing.locales.map((locale) => [locale, `${base}/${locale}${path}`]));
}

export function localizedAlternates(locale: string, path: `/${string}`) {
  return { canonical: `/${locale}${path}`, languages: languageLinks(path) };
}
