"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/shared/ui/button";

import { LANGUAGE_NAMES, OTHER_LOCALE } from "./language-names";
import { stripLocale } from "./strip-locale";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const target = OTHER_LOCALE[locale];

  return (
    <Link
      href={`/${target}${stripLocale(pathname)}`}
      lang={target}
      hrefLang={target}
      className={buttonVariants({ variant: "ghost", size: "lg" })}
    >
      {LANGUAGE_NAMES[target]}
    </Link>
  );
}
