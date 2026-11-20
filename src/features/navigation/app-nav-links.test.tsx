// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { parseAsString, useQueryStates } from "nuqs";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import { AppNavLinks } from "./app-nav-links";

const navigation = vi.hoisted(() => ({ pathname: "/en", search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = "/en";
  navigation.search = "";
});

// Stands in for the period control: another nuqs hook writing the same keys
function StepToOctober() {
  const [, setPeriod] = useQueryStates({ period: parseAsString, date: parseAsString });
  return (
    <button type="button" onClick={() => void setPeriod({ date: "2026-10-01" })}>
      October
    </button>
  );
}

function renderLinks(locale: "en" | "uk" = "en") {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <NuqsTestingAdapter searchParams={navigation.search} hasMemory>
        <StepToOctober />
        <AppNavLinks layout="bar" />
      </NuqsTestingAdapter>
    </NextIntlClientProvider>,
  );
}

test("links every screen and marks the current one", () => {
  navigation.pathname = "/en/transactions";
  renderLinks();

  expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/en");
  expect(screen.getByRole("link", { name: "Categories" })).toHaveAttribute(
    "href",
    "/en/categories",
  );
  const current = screen.getByRole("link", { current: "page" });
  expect(current).toHaveAccessibleName("Transactions");
  expect(current).toHaveAttribute("href", "/en/transactions");
});

test("the Overview link is current on the home page", () => {
  renderLinks();

  expect(screen.getByRole("link", { current: "page" })).toHaveAccessibleName("Overview");
});

test("the period screens keep the shown period; edit and Categories don't", () => {
  navigation.search = "period=week&date=2026-10-05&edit=1";
  renderLinks();

  expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "/en?period=week&date=2026-10-05",
  );
  expect(screen.getByRole("link", { name: "Transactions" })).toHaveAttribute(
    "href",
    "/en/transactions?period=week&date=2026-10-05",
  );
  expect(screen.getByRole("link", { name: "Categories" })).toHaveAttribute(
    "href",
    "/en/categories",
  );
});

test("a month away from today keeps only its date", () => {
  navigation.pathname = "/uk";
  navigation.search = "date=2026-10-01";
  renderLinks("uk");

  expect(screen.getByRole("link", { name: "Транзакції" })).toHaveAttribute(
    "href",
    "/uk/transactions?date=2026-10-01",
  );
  expect(screen.getByRole("link", { name: "Огляд" })).toHaveAttribute("aria-current", "page");
});

test("a period change shows in the links at once, before the screen renders it", async () => {
  renderLinks();

  await userEvent.click(screen.getByRole("button", { name: "October" }));

  expect(screen.getByRole("link", { name: "Transactions" })).toHaveAttribute(
    "href",
    "/en/transactions?date=2026-10-01",
  );
});
