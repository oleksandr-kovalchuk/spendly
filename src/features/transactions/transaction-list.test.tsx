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
    categoryId: "0198a8c0-0000-7000-8000-000000000001",
    category: { defaultKey: "food", name: null, icon: null },
  },
  {
    id: "2",
    type: "income",
    amountKopecks: 5_000_000,
    occurredOn: "2026-03-05",
    note: null,
    categoryId: "0198a8c0-0000-7000-8000-000000000001",
    category: { defaultKey: "salary", name: null, icon: null },
  },
  {
    id: "3",
    type: "expense",
    amountKopecks: 100,
    occurredOn: "2026-03-05",
    note: null,
    categoryId: "0198a8c0-0000-7000-8000-000000000001",
    category: { defaultKey: null, name: "Pets", icon: null },
  },
];

function renderList(
  locale: "en" | "uk",
  transactions: TransactionDto[],
  periodQuery?: Record<string, string>,
) {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <TransactionList
        groups={groupByDay(transactions)}
        periodQuery={periodQuery}
        emptyAction={<button type="button">Add transaction</button>}
      />
    </NextIntlClientProvider>,
  );
}

test("shows the days newest first with signed amounts and category names", () => {
  renderList("en", TRANSACTIONS);

  const days = screen.getAllByRole("heading", { level: 2 });
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

  const days = screen.getAllByRole("heading", { level: 2 });
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

test("shows the empty state with its action without transactions", () => {
  renderList("en", []);

  expect(screen.getByText(en.Transactions.list.empty)).toBeVisible();
  expect(screen.getByRole("button", { name: "Add transaction" })).toBeVisible();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

test("each whole item links to its edit form", () => {
  renderList("en", TRANSACTIONS);

  expect(screen.getByRole("link", { name: /^Food\s?lunch/ })).toHaveAttribute(
    "href",
    "/en/transactions?edit=1",
  );
  expect(screen.getByRole("link", { name: /^Pets/ })).toHaveAttribute(
    "href",
    "/en/transactions?edit=3",
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByText(en.Transactions.list.empty)).not.toBeInTheDocument();
});

test("edit links keep the shown period", () => {
  renderList("en", TRANSACTIONS, { period: "week", date: "2026-03-02" });

  expect(screen.getByRole("link", { name: /^Food/ })).toHaveAttribute(
    "href",
    "/en/transactions?period=week&date=2026-03-02&edit=1",
  );
});
