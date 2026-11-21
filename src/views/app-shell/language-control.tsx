import { getLocale } from "next-intl/server";
import { Suspense } from "react";

import { OTHER_LOCALE } from "@/features/language-switcher/language-names";
import { LanguageSegments } from "@/features/language-switcher/language-segments";
import { LanguageSwitcher } from "@/features/language-switcher/language-switcher";

// Until the current path is known, the link opens the other language's home page
export async function LanguageControl() {
  const target = OTHER_LOCALE[await getLocale()];

  return (
    <Suspense fallback={<LanguageSegments targetHref={`/${target}`} />}>
      <LanguageSwitcher />
    </Suspense>
  );
}
