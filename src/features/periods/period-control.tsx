"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";

import { Button } from "@/shared/ui/button";

import {
  isCurrentPeriod,
  parsePeriod,
  PERIOD_TYPES,
  periodOf,
  stepPeriod,
  toPeriodSearch,
  type Period,
  type PeriodType,
} from "./period";
import { periodSearchParsers } from "./period-search";

// Days have no time zone: they are formatted on the UTC calendar they are written on
const FORMAT_TIME_ZONE = "UTC";

function toDate(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

function usePeriodLabel(period: Period) {
  const format = useFormatter();
  const from = toDate(period.from);

  switch (period.type) {
    case "day":
      return format.dateTime(from, {
        timeZone: FORMAT_TIME_ZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "week":
      return format.dateTimeRange(from, toDate(period.to), {
        timeZone: FORMAT_TIME_ZONE,
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "month":
      return format.dateTime(from, { timeZone: FORMAT_TIME_ZONE, month: "long", year: "numeric" });
    case "year":
      return format.dateTime(from, { timeZone: FORMAT_TIME_ZONE, year: "numeric" });
    default:
      throw new Error("Unhandled period type", { cause: period.type satisfies never });
  }
}

// The URL holds the period, so the server renders the list for it and a shared link shows it too
export function PeriodControl({ today }: { today: string }) {
  const t = useTranslations("Periods");
  const [search, setSearch] = useQueryStates(periodSearchParsers, {
    history: "push",
    shallow: false,
  });
  const period = parsePeriod(search, today);
  const label = usePeriodLabel(period);
  const previous = stepPeriod(period, -1);
  const next = stepPeriod(period, 1);

  function handleShow(target: Period) {
    void setSearch(toPeriodSearch(target, today));
  }

  function handlePickType(type: PeriodType) {
    handleShow(periodOf(type, today));
  }

  return (
    <div className="grid gap-3">
      <fieldset className="grid grid-cols-4 gap-1">
        <legend className="sr-only">{t("type")}</legend>
        {PERIOD_TYPES.map((type) => {
          const isPressed = type === period.type;
          return (
            <Button
              key={type}
              variant={isPressed ? "default" : "outline"}
              size="lg"
              aria-pressed={isPressed}
              onClick={() => handlePickType(type)}
            >
              {t(`types.${type}`)}
            </Button>
          );
        })}
      </fieldset>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={t("previous", { type: period.type })}
          disabled={!previous}
          onClick={() => previous && handleShow(previous)}
        >
          <ChevronLeft aria-hidden className="rtl:rotate-180" />
        </Button>
        <p aria-live="polite" className="min-w-0 flex-1 text-center font-medium text-balance">
          {label}
        </p>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={t("next", { type: period.type })}
          disabled={!next}
          onClick={() => next && handleShow(next)}
        >
          <ChevronRight aria-hidden className="rtl:rotate-180" />
        </Button>
      </div>
      <Button
        variant="ghost"
        className="justify-self-center"
        disabled={isCurrentPeriod(period, today)}
        onClick={() => handlePickType(period.type)}
      >
        {t("current", { type: period.type })}
      </Button>
    </div>
  );
}
