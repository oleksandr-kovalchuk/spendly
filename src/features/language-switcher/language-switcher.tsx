"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

import { LanguageSegments } from "./language-segments";
import { OTHER_LOCALE } from "./language-names";
import { stripLocale } from "./strip-locale";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return <LanguageSegments targetHref={`/${OTHER_LOCALE[locale]}${stripLocale(pathname)}`} />;
}
