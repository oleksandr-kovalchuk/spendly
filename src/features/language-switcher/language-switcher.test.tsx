// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test, vi } from "vitest";

import { LanguageSwitcher } from "./language-switcher";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/en" } }));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

function renderSwitcher(locale: "en" | "uk") {
  render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

test("English links to the same page in Ukrainian", () => {
  pathname.current = "/en/categories";
  renderSwitcher("en");

  expect(screen.getByRole("link", { name: "Українська" })).toHaveAttribute(
    "href",
    "/uk/categories",
  );
});

test("Ukrainian links to the same page in English", () => {
  pathname.current = "/uk";
  renderSwitcher("uk");

  expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en");
});
