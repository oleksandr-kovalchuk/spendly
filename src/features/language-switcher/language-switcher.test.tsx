// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import { LanguageSwitcher } from "./language-switcher";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/en" } }));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

function renderSwitcher(locale: "en" | "uk") {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

test("English links to the same page in Ukrainian", () => {
  pathname.current = "/en/categories";
  renderSwitcher("en");

  const link = screen.getByRole("link", { name: /Українська/ });
  expect(link).toHaveAttribute("href", "/uk/categories");
  expect(link).toHaveTextContent(/^UA/);
});

test("Ukrainian links to the same page in English", () => {
  pathname.current = "/uk";
  renderSwitcher("uk");

  expect(screen.getByRole("link", { name: /English/ })).toHaveAttribute("href", "/en");
});

test("both languages show, and the current one is marked, not linked", () => {
  pathname.current = "/uk/transactions";
  renderSwitcher("uk");

  const group = screen.getByRole("group", { name: "Мова" });
  expect(group).toHaveTextContent(/EN.*UA/);
  expect(within(group).getAllByRole("link")).toHaveLength(1);
  expect(within(group).getByText("UA", { exact: false })).toHaveAttribute("aria-current", "true");
});
