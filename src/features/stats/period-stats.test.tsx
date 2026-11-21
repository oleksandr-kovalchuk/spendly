// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test } from "vitest";

import en from "@/i18n/messages/en.json";

import { PeriodStats } from "./period-stats";

test("shows an empty state with its action instead of the chart without expenses", () => {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <PeriodStats
        totals={{ incomeKopecks: 100_000, expenseKopecks: 0 }}
        spending={[]}
        emptyAction={<button type="button">Add transaction</button>}
      />
    </NextIntlClientProvider>,
  );

  const section = screen.getByRole("region", { name: en.Stats.byCategory });
  expect(section).toHaveTextContent(en.Stats.noExpenses);
  expect(screen.getByRole("button", { name: "Add transaction" })).toBeVisible();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
