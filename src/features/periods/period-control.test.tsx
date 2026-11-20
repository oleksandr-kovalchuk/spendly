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

test("shows the current month by default", () => {
  renderControl({});

  expect(label()).toHaveTextContent("November 2026");
  expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "This month" })).toBeDisabled();
});

test("steps back and forward and returns to the current month", async () => {
  const { user, lastQuery } = renderControl({});

  await user.click(screen.getByRole("button", { name: "Previous month" }));
  expect(label()).toHaveTextContent("October 2026");
  expect(lastQuery()).toBe("?date=2026-10-01");

  await user.click(screen.getByRole("button", { name: "Previous month" }));
  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(label()).toHaveTextContent("October 2026");

  await user.click(screen.getByRole("button", { name: "This month" }));
  expect(label()).toHaveTextContent("November 2026");
  expect(lastQuery()).toBe("");
});

test("picks the current week and steps it by a week", async () => {
  const { user, lastQuery } = renderControl({ search: "?date=2026-03-01" });

  await user.click(screen.getByRole("button", { name: "Week" }));
  expect(label()).toHaveTextContent(/November 16\s*–\s*22, 2026/);
  expect(lastQuery()).toBe("?period=week");

  await user.click(screen.getByRole("button", { name: "Next week" }));
  expect(label()).toHaveTextContent(/November 23\s*–\s*29, 2026/);
  expect(lastQuery()).toBe("?period=week&date=2026-11-23");
});

test("shows the period from the URL", () => {
  renderControl({ search: "?period=day&date=2026-11-16" });

  expect(label()).toHaveTextContent("Monday, November 16, 2026");
  expect(screen.getByRole("button", { name: "Today" })).toBeEnabled();
});

test("falls back to the current month for an invalid URL", () => {
  renderControl({ search: "?period=decade&date=2026-10-01" });

  expect(label()).toHaveTextContent("November 2026");
});

test("labels the period in Ukrainian", async () => {
  const { user } = renderControl({ locale: "uk" });
  expect(label()).toHaveTextContent("листопад 2026 р.");

  await user.click(screen.getByRole("button", { name: "Рік" }));
  await user.click(screen.getByRole("button", { name: "Попередній рік" }));
  expect(label()).toHaveTextContent(/^2025/);
  expect(screen.getByRole("button", { name: "Цей рік" })).toBeEnabled();
});
