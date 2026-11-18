// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

function renderToggle(locale: "en" | "uk" = "en") {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeToggle />
      </ThemeProvider>
    </NextIntlClientProvider>,
  );
}

test("follows the system theme until a choice is made", () => {
  renderToggle();

  expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "false");
});

test("picking dark applies it, remembers it and marks it pressed", async () => {
  renderToggle();

  await userEvent.click(screen.getByRole("button", { name: "Dark" }));

  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
  expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "false");
});

test("picking light after dark removes the dark class", async () => {
  renderToggle();

  await userEvent.click(screen.getByRole("button", { name: "Dark" }));
  await userEvent.click(screen.getByRole("button", { name: "Light" }));

  expect(document.documentElement).not.toHaveClass("dark");
});

test("labels are translated", () => {
  renderToggle("uk");

  expect(screen.getByRole("group", { name: "Тема" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Темна" })).toBeInTheDocument();
});
