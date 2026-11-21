"use client";

import { ChevronDownIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useState } from "react";

import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

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
function usePeriodLabel(period: Period) {
  const format = useFormatter();
  const from = utcDateOf(period.from);

  switch (period.type) {
    case "day":
      return format.dateTime(from, {
        timeZone: DAY_TIME_ZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "week":
      return format.dateTimeRange(from, utcDateOf(period.to), {
        timeZone: DAY_TIME_ZONE,
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "month":
      return format.dateTime(from, { timeZone: DAY_TIME_ZONE, month: "long", year: "numeric" });
    case "year":
      return format.dateTime(from, { timeZone: DAY_TIME_ZONE, year: "numeric" });
    default:
      throw new Error("Unhandled period type", { cause: period.type satisfies never });
  }
}

export function PeriodControl({ today }: { today: string }) {
  const t = useTranslations("Periods");
  const [search, setSearch] = useQueryStates(periodSearchParsers, {
    history: "push",
    shallow: false,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const period = parsePeriod(search, today);
  const label = usePeriodLabel(period);
  const previous = stepPeriod(period, -1);
  const next = stepPeriod(period, 1);
  const isCurrent = isCurrentPeriod(period, today);

  function handleShow(target: Period) {
    void setSearch(toPeriodSearch(target, today));
  }

  function handlePickType(type: PeriodType) {
    handleShow(periodOf(type, today));
    setIsMenuOpen(false);
  }

  return (
    <div className="flex w-full items-center gap-1 rounded-full bg-muted p-1 lg:w-auto lg:min-w-80">
      {/* Buttons that disable themselves when pressed stay focusable: a native `disabled` drops focus to the body */}
      <Button
        variant="outline"
        size="icon-lg"
        className="rounded-full border-transparent bg-card shadow-soft"
        aria-label={t("previous", { type: period.type })}
        disabled={!previous}
        focusableWhenDisabled
        onClick={() => previous && handleShow(previous)}
      >
        <ChevronLeft aria-hidden className="rtl:rotate-180" />
      </Button>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="lg"
              className="min-w-0 flex-1 rounded-full font-medium hover:bg-card aria-expanded:bg-card"
            />
          }
          aria-label={t("menu", { period: label })}
        >
          <span className="truncate">{label}</span>
          <ChevronDownIcon aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <fieldset className="grid grid-cols-2 gap-1">
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
          <Button
            variant="ghost"
            size="lg"
            disabled={isCurrent}
            focusableWhenDisabled
            onClick={() => handlePickType(period.type)}
          >
            {t("current", { type: period.type })}
          </Button>
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon-lg"
        className="rounded-full border-transparent bg-card shadow-soft"
        aria-label={t("next", { type: period.type })}
        disabled={!next}
        focusableWhenDisabled
        onClick={() => next && handleShow(next)}
      >
        <ChevronRight aria-hidden className="rtl:rotate-180" />
      </Button>
      <p aria-live="polite" className="sr-only">
        {label}
      </p>
    </div>
  );
}
