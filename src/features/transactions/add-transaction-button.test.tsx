// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { Toaster } from "@/shared/ui/toast";

import { AddTransactionButton } from "./add-transaction-button";
import { AddTransactionProvider } from "./add-transaction-provider";
import { AddTransactionSheetHost } from "./add-transaction-sheet-host";
import type { CategoryOption } from "./category-option";

const { addTransaction } = vi.hoisted(() => ({ addTransaction: vi.fn() }));
vi.mock("./add-transaction.action", () => ({ addTransaction }));
vi.mock("./update-transaction.action", () => ({ updateTransaction: vi.fn() }));

const CATEGORIES: CategoryOption[] = [
  {
    id: "0198a8c0-0000-7000-8000-000000000001",
    type: "expense",
    defaultKey: "food",
    icon: null,
    label: "Food",
  },
  {
    id: "0198a8c0-0000-7000-8000-000000000002",
    type: "income",
    defaultKey: "salary",
    icon: null,
    label: "Salary",
  },
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

function Screen({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <AddTransactionProvider>
        <main tabIndex={-1}>
          {hasButton ? (
            <>
              <AddTransactionButton type="expense" />
              <AddTransactionButton type="income" />
            </>
          ) : null}
        </main>
        <AddTransactionSheetHost today="2026-03-10" categories={CATEGORIES} />
      </AddTransactionProvider>
      <Toaster regionLabel="Notifications" closeLabel="Close notification" />
    </NextIntlClientProvider>
  );
}

function notifications() {
  return within(screen.getByRole("region", { name: "Notifications" }));
}

function renderButton() {
  const { rerender } = render(<Screen />);

  return { user: userEvent.setup(), rerender };
}

describe.each([
  ["a phone", false],
  ["a desktop", true],
] as const)("on %s", (_screen, isDesktop) => {
  beforeEach(() => {
    stubScreen(isDesktop);
  });

  // A focused amount shows its error on blur and opens the phone's keyboard
  test("the form opens with focus inside it, not on the amount", async () => {
    const { user } = renderButton();
    await user.click(screen.getByRole("button", { name: "Add expense" }));

    const sheet = await screen.findByRole("dialog", { name: "New expense" });
    await vi.waitFor(() => {
      expect(sheet.contains(document.activeElement)).toBe(true);
    });
    expect(screen.getByLabelText(/^Amount/)).not.toHaveFocus();
  });

  test("Add income opens the income form and saves an income", async () => {
    addTransaction.mockResolvedValue({});
    const { user } = renderButton();
    const add = screen.getByRole("button", { name: "Add income" });
    await user.click(add);

    const sheet = await screen.findByRole("dialog", { name: "New income" });
    expect(within(sheet).getByRole("radio", { name: "Salary" })).toBeChecked();
    await user.type(within(sheet).getByLabelText(/^Amount/), "5");
    await user.click(within(sheet).getByRole("button", { name: "Add" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "New income" })).not.toBeInTheDocument();
    });
    expect(addTransaction).toHaveBeenCalledWith(expect.objectContaining({ type: "income" }));
    expect(add).toHaveFocus();
  });

  test("Escape closes the form without saving and focus returns to Add", async () => {
    const { user } = renderButton();
    const add = screen.getByRole("button", { name: "Add expense" });
    await user.click(add);

    const sheet = await screen.findByRole("dialog", { name: "New expense" });
    expect(sheet).toBeVisible();
    await user.type(screen.getByLabelText(/^Amount/), "5");
    await user.keyboard("{Escape}");

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(add).toHaveFocus();
    expect(addTransaction).not.toHaveBeenCalled();
    expect(notifications().queryByText("Transaction added.")).not.toBeInTheDocument();
  });

  test("the close button closes the form", async () => {
    const { user } = renderButton();
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Add expense" })).toHaveFocus();
  });

  test("saving closes the form with a toast, and it opens empty again", async () => {
    addTransaction.mockResolvedValue({});
    const { user } = renderButton();
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    await user.type(await screen.findByLabelText(/^Amount/), "5");
    await user.click(screen.getByRole("button", { name: "Add" }));

    // A toast is a dialog too
    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "New expense" })).not.toBeInTheDocument();
    });
    expect(addTransaction).toHaveBeenCalledOnce();
    expect(await notifications().findByText("Transaction added.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(await screen.findByLabelText(/^Amount/)).toHaveValue("");
  });
});

test("closing moves focus to the screen when the button that opened the form is gone", async () => {
  stubScreen(false);
  const { user, rerender } = renderButton();
  await user.click(screen.getByRole("button", { name: "Add expense" }));
  await screen.findByRole("dialog", { name: "New expense" });

  // An empty list's button goes away once the list has an item; the form stays open
  rerender(<Screen hasButton={false} />);
  expect(screen.getByRole("dialog", { name: "New expense" })).toBeVisible();
  await user.keyboard("{Escape}");

  await vi.waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  expect(screen.getByRole("main")).toHaveFocus();
});

test("focus moves to the screen when the focused button goes away", async () => {
  stubScreen(false);
  const { user, rerender } = renderButton();
  await user.click(screen.getByRole("button", { name: "Add expense" }));
  await user.keyboard("{Escape}");
  await vi.waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Add expense" })).toHaveFocus();

  rerender(<Screen hasButton={false} />);
  expect(screen.getByRole("main")).toHaveFocus();
});
