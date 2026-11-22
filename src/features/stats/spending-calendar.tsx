import { cva } from "class-variance-authority";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";
import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";

import { CalendarDisclosure } from "./calendar-disclosure";
import { spendingLevelOf, weekColumnOf, weekOfDays, type SpendingLevel } from "./calendar-days";

export type CalendarDay = {
  day: string;
  amountKopecks: number;
  query: Record<string, string>;
  isSelected: boolean;
};

const LEGEND: SpendingLevel[] = ["none", "low", "medium", "high", "top"];
// Written out, so Tailwind finds them
const FIRST_COLUMNS = [
  "col-start-1",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
] as const;
const COMPACT_MONEY = { ...MONEY_FORMAT, notation: "compact", maximumFractionDigits: 1 } as const;
const WEEK_LENGTH = 7;
const WAVE_STEP_MS = 25;

type DayFormat = Pick<Intl.DateTimeFormatOptions, "weekday" | "day" | "month" | "year">;

const dayVariants = cva(
  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm tabular-nums outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring @xl:aspect-auto @xl:h-16 @xl:items-start @xl:justify-between @xl:p-2",
  {
    variants: {
      level: {
        none: "hover:bg-muted",
        low: "bg-expense/15",
        medium: "bg-expense/30",
        high: "bg-expense/55",
        top: "bg-expense font-medium text-background",
      },
      isSelected: {
        true: "font-semibold ring-2 ring-foreground ring-offset-2 ring-offset-card",
        false: "",
      },
    },
  },
);

const swatchVariants = cva("size-3 rounded-sm", {
  variants: {
    level: {
      none: "border border-border",
      low: "bg-expense/15",
      medium: "bg-expense/30",
      high: "bg-expense/55",
      top: "bg-expense",
    },
  },
});

export function SpendingCalendar({ days }: { days: CalendarDay[] }) {
  const t = useTranslations("Stats.calendar");
  const format = useFormatter();
  const locale = useLocale();
  const [first] = days;
  if (first === undefined) return null;

  const maxKopecks = Math.max(...days.map((day) => day.amountKopecks));
  const firstColumn = weekColumnOf(first.day) - 1;
  const dateOf = (day: string, options: DayFormat) =>
    format.dateTime(utcDateOf(day), { timeZone: DAY_TIME_ZONE, ...options });

  return (
    <CalendarDisclosure
      heading={t("heading")}
      month={dateOf(first.day, { month: "long", year: "numeric" })}
    >
      <div className="@container grid gap-2">
        <div
          aria-hidden="true"
          className="grid grid-cols-7 gap-1 text-center text-xs @xl:px-2 @xl:text-start"
        >
          {weekOfDays().map((day) => (
            <span key={day}>{dateOf(day, { weekday: "short" })}</span>
          ))}
        </div>
        <ol className="grid calendar-wave grid-cols-7 gap-1">
          {days.map(({ day, amountKopecks, query, isSelected }, index) => {
            const date = dateOf(day, { weekday: "long", day: "numeric", month: "long" });
            const hryvnias = hryvniasOf(amountKopecks);
            const cell = firstColumn + index;
            const diagonal = Math.floor(cell / WEEK_LENGTH) + (cell % WEEK_LENGTH);

            return (
              <li
                key={day}
                className={index === 0 ? FIRST_COLUMNS[firstColumn] : undefined}
                style={{ animationDelay: `${diagonal * WAVE_STEP_MS}ms` }}
              >
                <Link
                  href={{ pathname: `/${locale}`, query }}
                  scroll={false}
                  aria-current={isSelected ? "date" : undefined}
                  className={dayVariants({
                    level: spendingLevelOf(amountKopecks, maxKopecks),
                    isSelected,
                  })}
                >
                  <span className="sr-only">
                    {amountKopecks > 0
                      ? t("day", { date, amount: format.number(hryvnias, MONEY_FORMAT) })
                      : t("noSpending", { date })}
                  </span>
                  <span aria-hidden="true">{dateOf(day, { day: "numeric" })}</span>
                  {amountKopecks > 0 ? (
                    <span aria-hidden="true" className="hidden text-xs @xl:block">
                      {format.number(hryvnias, COMPACT_MONEY)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-end gap-1.5 text-xs">
          {t("less")}
          {LEGEND.map((level) => (
            <span key={level} aria-hidden="true" className={swatchVariants({ level })} />
          ))}
          {t("more")}
        </div>
      </div>
    </CalendarDisclosure>
  );
}
