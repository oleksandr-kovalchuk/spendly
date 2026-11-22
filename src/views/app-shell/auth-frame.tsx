import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { CategoryIcon } from "@/shared/categories/category-icon";
import { hryvniasOf, MONEY_FORMAT, SIGNED_MONEY_FORMAT } from "@/shared/lib/money";

const SAMPLE_BALANCE_KOPECKS = 3_668_000;
const SAMPLE_SALARY_KOPECKS = 4_200_000;
const SAMPLE_SPENT_SHARE = 0.13;

async function BrandPanel() {
  const [t, tCategories, format] = await Promise.all([
    getTranslations("Auth.brand"),
    getTranslations("Categories"),
    getFormatter(),
  ]);

  return (
    <div className="sheen relative flex min-h-44 flex-col justify-end overflow-hidden rounded-3xl bg-aurora p-6 pb-16 text-aurora-foreground shadow-aurora lg:min-h-140 lg:p-10">
      <div
        aria-hidden="true"
        className="absolute -end-16 -top-20 size-64 animate-drift rounded-full bg-aurora-pink/50 blur-3xl lg:size-96"
      />
      <div
        aria-hidden="true"
        className="absolute -start-20 -bottom-24 size-56 animate-drift rounded-full bg-aurora-cyan/50 blur-3xl lg:size-80"
      />
      <div aria-hidden="true" className="absolute inset-x-10 top-12 hidden lg:block">
        <div className="ms-auto grid w-72 -rotate-6 animate-drift gap-3 rounded-3xl glass-on-aurora p-5 shadow-aurora">
          <span className="text-sm font-medium">{t("balance")}</span>
          <span className="font-display text-3xl font-semibold tracking-tight tabular-nums">
            {format.number(hryvniasOf(SAMPLE_BALANCE_KOPECKS), MONEY_FORMAT)}
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-aurora-foreground/25">
            <span
              className="block h-full animate-grow rounded-full bg-aurora-foreground"
              style={{ width: `${SAMPLE_SPENT_SHARE * 100}%` }}
            />
          </span>
        </div>
        <div className="ms-24 mt-10 flex w-fit rotate-3 animate-drift items-center gap-3 rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-soft">
          <CategoryIcon category={{ id: "salary", defaultKey: "salary", icon: null }} size="sm" />
          <span className="grid text-sm">
            {tCategories("defaults.salary")}
            <span className="font-semibold text-income tabular-nums">
              {format.number(hryvniasOf(SAMPLE_SALARY_KOPECKS), SIGNED_MONEY_FORMAT)}
            </span>
          </span>
        </div>
      </div>
      <div className="relative grid gap-3">
        <p className="text-3xl font-semibold tracking-tight text-balance lg:text-5xl">
          {t("tagline")}
        </p>
        <p className="hidden text-lg lg:block">{t("text")}</p>
      </div>
    </div>
  );
}

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 content-start lg:grid-cols-2 lg:content-stretch lg:gap-12">
      <BrandPanel />
      <div className="relative -mt-10 flex justify-center px-3 lg:mt-0 lg:items-center lg:px-0">
        <div className="grid w-full max-w-sm stagger">{children}</div>
      </div>
    </div>
  );
}
