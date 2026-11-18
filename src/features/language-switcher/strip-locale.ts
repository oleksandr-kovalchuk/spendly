import { routing } from "@/i18n/routing";

export function stripLocale(pathname: string) {
  const [, first = "", ...rest] = pathname.split("/");
  if (!routing.locales.some((locale) => locale === first)) return pathname;
  return rest.length > 0 ? `/${rest.join("/")}` : "";
}
