import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ViewTransition } from "react";

import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";
import { NO_PERIOD_ANIMATION } from "@/shared/lib/period-transition";
import { totalTarget } from "@/shared/lib/total-target";

import { MoodLayer } from "./mood-layer";
import { RollingText } from "./rolling-text";
import { spendingMoodOf } from "./spending-mood";
import { TiltCard } from "./tilt-card";

type PeriodTotalsProps = { incomeKopecks: number; expenseKopecks: number; balanceKopecks: number };

const TOTAL_ICONS = { income: ArrowUpIcon, expenses: ArrowDownIcon } as const;
const MAX_SHARE = 1;
const MONEY_TAIL = new Set<Intl.NumberFormatPartTypes>(["decimal", "fraction"]);

function BalanceValue({ kopecks }: { kopecks: number }) {
  const locale = useLocale();
  const parts = new Intl.NumberFormat(locale, MONEY_FORMAT).formatToParts(hryvniasOf(kopecks));
  const tailStart = parts.findIndex((part) => MONEY_TAIL.has(part.type));
  const head = tailStart === -1 ? parts : parts.slice(0, tailStart);
  const tail = tailStart === -1 ? [] : parts.slice(tailStart);

  return (
    <span className="block">
      <span className="sr-only">{parts.map((part) => part.value).join("")}</span>
      <RollingText text={head.map((part) => part.value).join("")} />
      <span className="text-2xl font-medium tracking-tight @sm:text-3xl @3xl:text-4xl">
        <RollingText text={tail.map((part) => part.value).join("")} />
      </span>
    </span>
  );
}

export function PeriodTotals({ incomeKopecks, expenseKopecks, balanceKopecks }: PeriodTotalsProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const share = incomeKopecks > 0 ? expenseKopecks / incomeKopecks : undefined;
  const totals = [
    { key: "income", type: "income", kopecks: incomeKopecks },
    { key: "expenses", type: "expense", kopecks: expenseKopecks },
  ] as const;

  return (
    <TiltCard className="sheen grid h-full balance-card-exit content-between gap-5 rounded-3xl bg-aurora p-5 text-aurora-foreground shadow-aurora lg:p-7">
      <MoodLayer mood={spendingMoodOf(incomeKopecks, expenseKopecks)} />
      <dl className="grid grid-cols-2 gap-x-2 gap-y-5">
        <div className="col-span-2 grid gap-1">
          <dt className="text-sm font-medium">{t("balance")}</dt>
          <dd className="font-display text-4xl font-semibold tracking-tight break-all tabular-nums @sm:text-5xl @3xl:text-6xl">
            <BalanceValue kopecks={balanceKopecks} />
          </dd>
        </div>
        {totals.map(({ key, type, kopecks }) => {
          const Icon = TOTAL_ICONS[key];
          return (
            <div key={key} className="grid gap-0.5 rounded-2xl glass-on-aurora px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-sm">
                <span className="flex size-5 items-center justify-center rounded-full bg-aurora-foreground/25">
                  <Icon aria-hidden className="size-3" />
                </span>
                {t(key)}
              </dt>
              <dd
                {...totalTarget(type)}
                className="text-lg font-semibold tracking-tight break-all tabular-nums"
              >
                <ViewTransition
                  key={kopecks}
                  enter={{ ...NO_PERIOD_ANIMATION, default: "total-enter" }}
                  exit={{ ...NO_PERIOD_ANIMATION, default: "total-exit" }}
                  default="none"
                >
                  <span className="block">{format.number(hryvniasOf(kopecks), MONEY_FORMAT)}</span>
                </ViewTransition>
              </dd>
            </div>
          );
        })}
      </dl>
      {share === undefined ? null : (
        <div className="grid gap-1.5">
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-aurora-foreground/25"
          >
            <div
              className="h-full animate-grow rounded-full bg-aurora-foreground"
              style={{ width: `${Math.min(share, MAX_SHARE) * 100}%` }}
            />
          </div>
          <p className="text-sm">
            {t("spentShare", {
              share: format.number(share, { style: "percent", maximumFractionDigits: 0 }),
            })}
          </p>
        </div>
      )}
    </TiltCard>
  );
}
