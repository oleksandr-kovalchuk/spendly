// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test } from "vitest";

import en from "@/i18n/messages/en.json";

import { PeriodTotals } from "./period-totals";

function renderTotals(incomeKopecks: number, expenseKopecks: number) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <PeriodTotals incomeKopecks={incomeKopecks} expenseKopecks={expenseKopecks} />
    </NextIntlClientProvider>,
  );
}

function valueOf(term: string) {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
}

test("shows income, expenses and the balance", () => {
  renderTotals(100_000, 50_000);

  expect(valueOf(en.Stats.income)).toBe("₴1,000.00");
  expect(valueOf(en.Stats.expenses)).toBe("₴500.00");
  expect(valueOf(en.Stats.balance)).toBe("₴500.00");
});

test("shows a negative balance with a minus sign", () => {
  renderTotals(10_000, 25_050);

  expect(valueOf(en.Stats.balance)).toBe("-₴150.50");
});
