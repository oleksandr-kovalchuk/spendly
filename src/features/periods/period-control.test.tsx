// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import { PeriodControl } from "./period-control";

const TODAY = "2026-11-20";

function renderControl({ locale = "en", search = "" }: { locale?: "en" | "uk"; search?: string }) {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <NuqsTestingAdapter searchParams={search} onUrlUpdate={onUrlUpdate} hasMemory>
        <PeriodControl today={TODAY} />
      </NuqsTestingAdapter>
    </NextIntlClientProvider>,
  );

  const lastQuery = () => onUrlUpdate.mock.lastCall?.[0].queryString;
  return { user: userEvent.setup(), lastQuery };
}

function label() {
  return screen.getByText((_, element) => element?.getAttribute("aria-live") === "polite");
}

// The type buttons and the current-period button sit in the menu the period's name opens
async function openMenu(user: ReturnType<typeof userEvent.setup>, name = /^Choose period/) {
  await user.click(screen.getByRole("button", { name }));
}

test("shows today by default", async () => {
  const { user } = renderControl({});

  expect(label()).toHaveTextContent("Friday, November 20, 2026");
  await openMenu(user);
  expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-disabled", "true");
});

test("names the shown period on the menu button", () => {
  renderControl({});

  expect(
    screen.getByRole("button", { name: "Choose period: Friday, November 20, 2026" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("steps back and forward and returns to today", async () => {
  const { user, lastQuery } = renderControl({});

  await user.click(screen.getByRole("button", { name: "Previous day" }));
  expect(label()).toHaveTextContent("Thursday, November 19, 2026");
  expect(lastQuery()).toBe("?date=2026-11-19");

  await user.click(screen.getByRole("button", { name: "Previous day" }));
  await user.click(screen.getByRole("button", { name: "Next day" }));
  expect(label()).toHaveTextContent("Thursday, November 19, 2026");

  await openMenu(user);
  await user.click(screen.getByRole("button", { name: "Today" }));
  expect(label()).toHaveTextContent("Friday, November 20, 2026");
  expect(lastQuery()).toBe("");
});

test("keeps the month type in the URL", async () => {
  const { user, lastQuery } = renderControl({});

  await openMenu(user);
  await user.click(screen.getByRole("button", { name: "Month" }));
  expect(label()).toHaveTextContent("November 2026");
  expect(lastQuery()).toBe("?period=month");
});

test("closes the menu and returns focus to its button after a pick", async () => {
  const { user } = renderControl({});

  await openMenu(user);
  await user.click(screen.getByRole("button", { name: "Week" }));

  expect(screen.queryByRole("button", { name: "Week" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Choose period/ })).toHaveFocus();
});

test("picks the current week and steps it by a week", async () => {
  const { user, lastQuery } = renderControl({ search: "?date=2026-03-01" });

  await openMenu(user);
  await user.click(screen.getByRole("button", { name: "Week" }));
  expect(label()).toHaveTextContent(/November 16\s*–\s*22, 2026/);
  expect(lastQuery()).toBe("?period=week");

  await user.click(screen.getByRole("button", { name: "Next week" }));
  expect(label()).toHaveTextContent(/November 23\s*–\s*29, 2026/);
  expect(lastQuery()).toBe("?period=week&date=2026-11-23");
});

test("shows the period from the URL", async () => {
  const { user } = renderControl({ search: "?period=day&date=2026-11-16" });

  expect(label()).toHaveTextContent("Monday, November 16, 2026");
  await openMenu(user);
  expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-disabled", "false");
});

test("falls back to today for an invalid URL", () => {
  renderControl({ search: "?period=decade&date=2026-10-01" });

  expect(label()).toHaveTextContent("Friday, November 20, 2026");
});

test("labels the period in Ukrainian", async () => {
  const { user } = renderControl({ locale: "uk" });
  expect(label()).toHaveTextContent(/20 листопада 2026/);

  await openMenu(user, /^Вибрати період/);
  await user.click(screen.getByRole("button", { name: "Рік" }));
  await user.click(screen.getByRole("button", { name: "Попередній рік" }));
  expect(label()).toHaveTextContent(/^2025/);
  await openMenu(user, /^Вибрати період/);
  expect(screen.getByRole("button", { name: "Цей рік" })).toHaveAttribute("aria-disabled", "false");
});
