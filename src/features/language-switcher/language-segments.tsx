import { cn } from "cn";
import type { Route } from "next";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { routing } from "@/i18n/routing";

import { LANGUAGE_CODES, LANGUAGE_NAMES } from "./language-names";

const SEGMENT =
  "inline-flex h-full min-w-9 items-center justify-center rounded-full px-2 text-xs font-semibold";

// The short code is what shows; the name follows for screen readers, so voice control
// still finds the link by the code it sees
export function LanguageSegments<T extends string>({ targetHref }: { targetHref: Route<T> }) {
  const t = useTranslations("Header");
  const locale = useLocale();

  return (
    <fieldset className="inline-grid h-7 grid-cols-2 items-center rounded-full border border-border bg-muted p-px">
      <legend className="sr-only">{t("language")}</legend>
      {routing.locales.map((value) => {
        const label = (
          <>
            {LANGUAGE_CODES[value]}
            <span className="sr-only">{` ${LANGUAGE_NAMES[value]}`}</span>
          </>
        );

        return value === locale ? (
          <span
            key={value}
            lang={value}
            aria-current="true"
            className={cn(SEGMENT, "bg-primary text-primary-foreground")}
          >
            {label}
          </span>
        ) : (
          <Link
            key={value}
            href={targetHref}
            lang={value}
            hrefLang={value}
            className={cn(
              SEGMENT,
              "text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring",
            )}
          >
            {label}
          </Link>
        );
      })}
    </fieldset>
  );
}
