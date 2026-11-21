// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { expect, test } from "vitest";

import en from "@/i18n/messages/en.json";

import { SpendingBreakdown } from "./spending-breakdown";
import type { SpendingItem } from "./spending-item";

const ITEMS: SpendingItem[] = [
  { id: "food", label: "Food", amountKopecks: 30_000, color: "cat3" },
  { id: "transport", label: "Transport", amountKopecks: 20_000, color: "cat2" },
];

function renderBreakdown() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <h2 id="spending">Spending</h2>
      <SpendingBreakdown items={ITEMS} labelledBy="spending" />
    </NextIntlClientProvider>,
  );
  return userEvent.setup();
}

// The chart is hidden from screen readers; its middle is the text outside the table
function chartMiddle() {
  const table = screen.getByRole("table", { name: "Spending" });
  return [...document.querySelectorAll('[aria-hidden="true"] span')]
    .filter((span) => !table.contains(span))
    .map((span) => span.textContent);
}

test("the chart's middle shows the total spent", () => {
  renderBreakdown();

  expect(chartMiddle()).toEqual([en.Stats.expenses, "₴500.00"]);
});

test("hovering a category in the legend shows it in the chart's middle until the pointer leaves", async () => {
  const user = renderBreakdown();

  await user.hover(screen.getByRole("row", { name: /Transport/ }));
  expect(chartMiddle()).toEqual(["Transport", "₴200.00"]);

  await user.unhover(screen.getByRole("row", { name: /Transport/ }));
  expect(chartMiddle()).toEqual([en.Stats.expenses, "₴500.00"]);
});
