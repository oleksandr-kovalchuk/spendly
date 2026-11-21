// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test } from "vitest";

import en from "@/i18n/messages/en.json";

import { PeriodTotals } from "./period-totals";

function renderTotals(incomeKopecks: number, expenseKopecks: number, balanceKopecks = 0) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <PeriodTotals
        incomeKopecks={incomeKopecks}
        expenseKopecks={expenseKopecks}
        balanceKopecks={balanceKopecks}
      />
    </NextIntlClientProvider>,
  );
}

function valueOf(term: string) {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
}

test("shows income, expenses and the carried-over balance", () => {
  renderTotals(100_000, 50_000, 320_000);

  expect(valueOf(en.Stats.income)).toBe("₴1,000.00");
  expect(valueOf(en.Stats.expenses)).toBe("₴500.00");
  expect(valueOf(en.Stats.balance)).toBe("₴3,200.00");
});

test("shows a negative balance with a minus sign", () => {
  renderTotals(10_000, 25_050, -15_050);

  expect(valueOf(en.Stats.balance)).toBe("-₴150.50");
});

test("shows the share of income spent", () => {
  renderTotals(100_000, 50_000);

  expect(screen.getByText("50% of income spent")).toBeVisible();
});

test("shows a share over 100% when expenses exceed income", () => {
  renderTotals(10_000, 25_050);

  expect(screen.getByText("251% of income spent")).toBeVisible();
});

test("shows no share without income", () => {
  renderTotals(0, 25_050);

  expect(screen.queryByText(/of income spent/)).not.toBeInTheDocument();
});
