// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { AddTransactionButton } from "./add-transaction-button";
import type { CategoryOption } from "./transaction-form";

const { addTransaction } = vi.hoisted(() => ({ addTransaction: vi.fn() }));
vi.mock("./add-transaction.action", () => ({ addTransaction }));
vi.mock("./update-transaction.action", () => ({ updateTransaction: vi.fn() }));

const CATEGORIES: CategoryOption[] = [
  { id: "0198a8c0-0000-7000-8000-000000000001", type: "expense", label: "Food" },
];

function stubScreen(isDesktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: isDesktop,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

// The sheet loads lazily: a first import here keeps the first test from waiting on the transform
beforeAll(async () => {
  await import("./add-transaction-sheet");
});

beforeEach(() => {
  addTransaction.mockReset();
});

function renderButton(placement: "bar" | "sidebar") {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AddTransactionButton placement={placement} today="2026-03-10" categories={CATEGORIES} />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

describe.each([
  ["a phone", false, "bar"],
  ["a desktop", true, "sidebar"],
] as const)("on %s", (_screen, isDesktop, placement) => {
  beforeEach(() => {
    stubScreen(isDesktop);
  });

  test("Escape closes the form without saving and focus returns to Add", async () => {
    const user = renderButton(placement);
    const add = screen.getByRole("button", { name: "Add transaction" });
    await user.click(add);

    const sheet = await screen.findByRole("dialog", { name: "Add transaction" });
    expect(sheet).toBeVisible();
    await user.type(screen.getByLabelText(/^Amount/), "5");
    await user.keyboard("{Escape}");

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(add).toHaveFocus();
    expect(addTransaction).not.toHaveBeenCalled();
  });

  test("the close button closes the form", async () => {
    const user = renderButton(placement);
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Add transaction" })).toHaveFocus();
  });

  test("saving closes the form, and it opens empty again", async () => {
    addTransaction.mockResolvedValue({});
    const user = renderButton(placement);
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await user.type(await screen.findByLabelText(/^Amount/), "5");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(addTransaction).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    expect(await screen.findByLabelText(/^Amount/)).toHaveValue("");
  });
});
