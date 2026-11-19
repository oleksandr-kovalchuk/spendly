// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import { groupByDay } from "./group-by-day";
import { TransactionList } from "./transaction-list";
import type { TransactionDto } from "./transactions.dal";

const TRANSACTIONS: TransactionDto[] = [
  {
    id: "1",
    type: "expense",
    amountKopecks: 12_550,
    occurredOn: "2026-03-10",
    note: "lunch",
    category: { defaultKey: "food", name: null },
  },
  {
    id: "2",
    type: "income",
    amountKopecks: 5_000_000,
    occurredOn: "2026-03-05",
    note: null,
    category: { defaultKey: "salary", name: null },
  },
  {
    id: "3",
    type: "expense",
    amountKopecks: 100,
    occurredOn: "2026-03-05",
    note: null,
    category: { defaultKey: null, name: "Pets" },
  },
];

function renderList(locale: "en" | "uk", transactions: TransactionDto[]) {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <TransactionList groups={groupByDay(transactions)} />
    </NextIntlClientProvider>,
  );
}

test("shows the days newest first with signed amounts and category names", () => {
  renderList("en", TRANSACTIONS);

  const days = screen.getAllByRole("heading", { level: 3 });
  expect(days.map((day) => day.textContent)).toEqual(["Tuesday, March 10", "Thursday, March 5"]);

  const [first, second] = screen.getAllByRole("list");
  expect(first && within(first).getByText("Food")).toBeVisible();
  expect(first && within(first).getByText("lunch")).toBeVisible();
  expect(first && within(first).getByText("-₴125.50")).toBeVisible();
  expect(second && within(second).getByText("Salary")).toBeVisible();
  expect(second && within(second).getByText("+₴50,000.00")).toBeVisible();
  expect(second && within(second).getByText("Pets")).toBeVisible();
});

test("translates the dates, amounts and default categories to Ukrainian", () => {
  renderList("uk", TRANSACTIONS);

  const days = screen.getAllByRole("heading", { level: 3 });
  expect(days.map((day) => day.textContent)).toEqual(["вівторок, 10 березня", "четвер, 5 березня"]);
  expect(screen.getByText(uk.Categories.defaults.food)).toBeVisible();
  expect(screen.getByText(uk.Categories.defaults.salary)).toBeVisible();
  expect(screen.getByText(/125,50/)).toHaveTextContent(/^−|^-/);
  expect(screen.getByText(/50\s?000,00/)).toHaveTextContent(/^\+/);
});

test("a day heading carries its date", () => {
  renderList("en", TRANSACTIONS);

  expect(screen.getByText("Tuesday, March 10")).toHaveAttribute("datetime", "2026-03-10");
});

test("shows the empty state without transactions", () => {
  renderList("en", []);

  expect(screen.getByText(en.Transactions.list.empty)).toBeVisible();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});
