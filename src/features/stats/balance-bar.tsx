import { useFormatter, useTranslations } from "next-intl";

import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

import { MoodLayer } from "./mood-layer";
import { RollingText } from "./rolling-text";

type BalanceBarProps = { balanceKopecks: number; mood: number };

// Hidden from screen readers and lets taps through: the balance card has the same data
export function BalanceBar({ balanceKopecks, mood }: BalanceBarProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none balance-bar fixed inset-x-3 top-2 isolate z-40 flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-aurora px-4 py-2.5 text-aurora-foreground shadow-aurora-sm lg:hidden standalone:top-6"
    >
      <MoodLayer mood={mood} />
      <span className="text-sm font-medium">{t("balance")}</span>
      <span className="font-display text-xl font-semibold tracking-tight tabular-nums">
        <RollingText text={format.number(hryvniasOf(balanceKopecks), MONEY_FORMAT)} />
      </span>
    </div>
  );
}
