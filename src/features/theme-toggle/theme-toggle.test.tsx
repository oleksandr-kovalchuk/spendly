// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import { ThemeToggle } from "./theme-toggle";

function stubDeviceTheme(isDark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: isDark && query === "(prefers-color-scheme: dark)",
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  stubDeviceTheme(false);
});

function renderToggle(locale: "en" | "uk" = "en") {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeToggle />
      </ThemeProvider>
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

function option(name: string) {
  return screen.getByRole("radio", { name });
}

test("System is picked by default and follows a light device", () => {
  renderToggle();

  expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
  expect(option("System")).toBeChecked();
  expect(document.documentElement).not.toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBeNull();
});

test("System follows a dark device", () => {
  stubDeviceTheme(true);
  renderToggle();

  expect(option("System")).toBeChecked();
  expect(document.documentElement).toHaveClass("dark");
});

test("picking Dark applies it and remembers it", async () => {
  const user = renderToggle();

  await user.click(option("Dark"));

  expect(option("Dark")).toBeChecked();
  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
});

test("picking Light on a dark device applies light", async () => {
  stubDeviceTheme(true);
  const user = renderToggle();

  await user.click(option("Light"));

  expect(document.documentElement).not.toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("light");
});

test("picking System again follows the device", async () => {
  stubDeviceTheme(true);
  const user = renderToggle();
  await user.click(option("Light"));

  await user.click(option("System"));

  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("system");
});

test("the labels are translated", () => {
  renderToggle("uk");

  expect(screen.getByRole("group", { name: "Тема" })).toBeInTheDocument();
  expect(option("Темна")).toBeInTheDocument();
  expect(option("Як у системі")).toBeChecked();
});
