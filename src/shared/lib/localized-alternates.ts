import { routing } from "@/i18n/routing";

// A public page's URL in every language; without a base the paths resolve against `metadataBase`
export function languageLinks(path: `/${string}`, base = "") {
  return Object.fromEntries(routing.locales.map((locale) => [locale, `${base}/${locale}${path}`]));
}

// The canonical link of a public page in its language, with its translations for hreflang
export function localizedAlternates(locale: string, path: `/${string}`) {
  return { canonical: `/${locale}${path}`, languages: languageLinks(path) };
}
