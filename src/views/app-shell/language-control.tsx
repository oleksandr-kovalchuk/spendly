import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { LANGUAGE_NAMES, OTHER_LOCALE } from "@/features/language-switcher/language-names";
import { LanguageSwitcher } from "@/features/language-switcher/language-switcher";
import { buttonVariants } from "@/shared/ui/button";

// Until the current path is known, the link opens the other language's home page
export async function LanguageControl() {
  const target = OTHER_LOCALE[await getLocale()];

  return (
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
  );
}
