import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { LANGUAGE_NAMES, OTHER_LOCALE } from "@/features/language-switcher/language-names";
import { LanguageSwitcher } from "@/features/language-switcher/language-switcher";
import { ThemeToggle } from "@/features/theme-toggle/theme-toggle";
import { buttonVariants } from "@/shared/ui/button";

export async function Header() {
  const currentLocale = await getLocale();
  const target = OTHER_LOCALE[currentLocale];

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <Link
          href={`/${currentLocale}`}
          className={buttonVariants({ variant: "ghost", size: "lg", className: "text-base" })}
        >
          Spendly
        </Link>
        <div className="flex items-center gap-1">
          <Suspense
            fallback={
              <Link
                href={`/${target}`}
                lang={target}
                hrefLang={target}
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                {LANGUAGE_NAMES[target]}
              </Link>
            }
          >
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
