"use client";

import { CalendarIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";
import { enUS, uk, type Locale as CalendarLocale } from "react-day-picker/locale";

import type { Locale } from "@/i18n/routing";

import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Skeleton } from "@/shared/ui/skeleton";

import { dayOf, localDateOf } from "./calendar-day";

const CALENDAR_LOCALES: Record<Locale, CalendarLocale> = { en: enUS, uk };

// The calendar and its date library load on the first open, so the shell's JS stays the same
const Calendar = dynamic(() => import("@/shared/ui/calendar").then((mod) => mod.Calendar), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-72" />,
});

type ControlProps = { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined };
type TransactionDatePickerProps = {
  value: string;
  onChange: (day: string) => void;
  onBlur: () => void;
  controlProps: ControlProps;
};

export function TransactionDatePicker({
  value,
  onChange,
  onBlur,
  controlProps,
}: TransactionDatePickerProps) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const format = useFormatter();
  const [isOpen, setIsOpen] = useState(false);
  const selected = localDateOf(value);

  // The calendar hands over local-midnight dates: their local day, read back as UTC, is the day
  function fullDateOf(date: Date) {
    return format.dateTime(utcDateOf(dayOf(date)), { timeZone: DAY_TIME_ZONE, dateStyle: "full" });
  }

  function handlePick(day: string) {
    onChange(day);
    setIsOpen(false);
  }

  const shown = format.dateTime(utcDateOf(value), {
    timeZone: DAY_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-10 w-full justify-between rounded-lg bg-card px-3 text-base font-normal md:text-sm"
          />
        }
        {...controlProps}
        aria-label={t("form.dateValue", { date: shown })}
        onBlur={onBlur}
      >
        {shown}
        <CalendarIcon aria-hidden className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1">
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => handlePick(dayOf(date))}
          weekStartsOn={1}
          locale={CALENDAR_LOCALES[locale]}
          labels={{ labelDayButton: fullDateOf }}
          className="[--cell-size:--spacing(10)]"
        />
      </PopoverContent>
    </Popover>
  );
}
