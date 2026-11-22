// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import type { SpendingItem } from "./spending-item";
import { SpendingLegend } from "./spending-legend";

const ITEMS: SpendingItem[] = [
  {
    id: "food",
    label: "Food",
    amountKopecks: 30_000,
    color: "cat3",
    transactionsQuery: { category: "food" },
  },
  {
    id: "transport",
    label: "Transport",
    amountKopecks: 20_000,
    color: "cat2",
    transactionsQuery: { category: "transport" },
  },
];

function renderLegend(locale: "en" | "uk", items: SpendingItem[]) {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <h3 id="legend-heading">Spending</h3>
      <SpendingLegend items={items} labelledBy="legend-heading" />
    </NextIntlClientProvider>,
  );
  const [, ...rows] = within(screen.getByRole("table", { name: "Spending" })).getAllByRole("row");
  return rows;
}

test("shows each category's name, amount and share in the given order", () => {
  const rows = renderLegend("en", ITEMS);

  expect(
    rows.map((row) => [
      within(row).getByRole("rowheader").textContent,
      ...within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ]),
  ).toEqual([
    ["Food", "₴300.00", "60%"],
    ["Transport", "₴200.00", "40%"],
  ]);
});

test("each category's name opens its transactions in the shown period", () => {
  renderLegend("en", [
    {
      id: "food",
      label: "Food",
      amountKopecks: 100,
      color: "cat3",
      transactionsQuery: { period: "month", category: "food" },
    },
  ]);

  expect(screen.getByRole("link", { name: "Food" })).toHaveAttribute(
    "href",
    "/en/transactions?period=month&category=food",
  );
});

test("names the columns for screen readers", () => {
  renderLegend("en", ITEMS);

  expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    en.Stats.legend.category,
    en.Stats.legend.amount,
    en.Stats.legend.share,
  ]);
});

test("formats amounts and shares in Ukrainian", () => {
  const [food] = renderLegend("uk", [
    {
      id: "food",
      label: "Їжа",
      amountKopecks: 100_000,
      color: "cat3",
      transactionsQuery: { category: "food" },
    },
    {
      id: "transport",
      label: "Транспорт",
      amountKopecks: 200_000,
      color: "cat2",
      transactionsQuery: { category: "transport" },
    },
  ]);

  expect(food).toHaveTextContent(/^Їжа1\s000,00\s₴33,3\s?%$/);
});

test("rounds shares to one decimal", () => {
  const items = renderLegend("en", [
    { id: "a", label: "A", amountKopecks: 1, color: "cat1", transactionsQuery: { category: "a" } },
    { id: "b", label: "B", amountKopecks: 2, color: "cat2", transactionsQuery: { category: "b" } },
  ]);

  expect(items.map((item) => within(item).getByText(/%$/).textContent)).toEqual(["33.3%", "66.7%"]);
});
