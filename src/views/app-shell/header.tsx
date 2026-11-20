import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { LANGUAGE_NAMES, OTHER_LOCALE } from "@/features/language-switcher/language-names";
import { LanguageSwitcher } from "@/features/language-switcher/language-switcher";
import { SignOutButton } from "@/features/sign-out/sign-out-button";
import { ThemeToggle } from "@/features/theme-toggle/theme-toggle";
import { getCurrentUser } from "@/shared/auth/session";
import { buttonVariants } from "@/shared/ui/button";

async function PrivateLinks() {
  const [user, locale, t] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getTranslations("Header"),
  ]);
  if (!user) return null;

  return (
    <Link
      href={`/${locale}/categories`}
      className={buttonVariants({ variant: "ghost", size: "lg" })}
    >
      {t("categories")}
    </Link>
  );
}

async function SessionControls() {
  const user = await getCurrentUser();

  return user ? <SignOutButton /> : null;
}

export async function Header() {
  const [currentLocale, t] = await Promise.all([getLocale(), getTranslations("Header")]);
  const target = OTHER_LOCALE[currentLocale];

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <nav aria-label={t("nav")} className="flex items-center gap-1">
          <Link
            href={`/${currentLocale}`}
            className={buttonVariants({ variant: "ghost", size: "lg", className: "text-base" })}
          >
            Spendly
          </Link>
          <Suspense fallback={null}>
            <PrivateLinks />
          </Suspense>
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <Suspense fallback={null}>
            <SessionControls />
          </Suspense>
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
