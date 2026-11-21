// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { Toaster } from "@/shared/ui/toast";

import { AddCategoryButton } from "./add-category-button";

const { createCategory } = vi.hoisted(() => ({ createCategory: vi.fn() }));
vi.mock("./create-category.action", () => ({ createCategory }));

const ADD = "Add expense category";
const SHEET = "New expense category";

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
  await import("./add-category-sheet");
});

beforeEach(() => {
  createCategory.mockReset();
});

function notifications() {
  return within(screen.getByRole("region", { name: "Notifications" }));
}

async function openSheet() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AddCategoryButton type="expense" />
      <Toaster regionLabel="Notifications" closeLabel="Close notification" />
    </NextIntlClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: ADD }));
  const sheet = await screen.findByRole("dialog", { name: SHEET });

  return { user, sheet, field: within(sheet).getByLabelText("Name") };
}

async function sheetClosed() {
  // A toast is a dialog too
  await vi.waitFor(() => {
    expect(screen.queryByRole("dialog", { name: SHEET })).not.toBeInTheDocument();
  });
}

describe.each([
  ["a phone", false],
  ["a desktop", true],
] as const)("on %s", (_screen, isDesktop) => {
  beforeEach(() => {
    stubScreen(isDesktop);
  });

  test("Add opens the form with the name field focused", async () => {
    const { field } = await openSheet();

    await vi.waitFor(() => {
      expect(field).toHaveFocus();
    });
    expect(field).toHaveValue("");
  });

  test("Escape closes the form without saving and focus returns to Add", async () => {
    const { user, field } = await openSheet();
    await user.type(field, "Coffee");
    await user.keyboard("{Escape}");

    await sheetClosed();
    expect(screen.getByRole("button", { name: ADD })).toHaveFocus();
    expect(createCategory).not.toHaveBeenCalled();
  });

  test("the name and the chosen icon are sent with the type, then the form closes with a toast", async () => {
    createCategory.mockResolvedValue({});
    const { user, sheet, field } = await openSheet();
    await user.type(field, "Coffee");
    await user.click(within(sheet).getByRole("radio", { name: "Coffee" }));
    await user.click(within(sheet).getByRole("button", { name: "Add" }));

    expect(createCategory).toHaveBeenCalledWith({
      type: "expense",
      name: "Coffee",
      icon: "coffee",
    });
    await sheetClosed();
    expect(await notifications().findByText("Category added.")).toBeVisible();
    expect(screen.getByRole("button", { name: ADD })).toHaveFocus();
  });
});

describe("errors keep the form open", () => {
  beforeEach(() => {
    stubScreen(true);
  });

  test("an empty name shows its error and sends nothing", async () => {
    const { user, sheet, field } = await openSheet();
    await user.click(within(sheet).getByRole("button", { name: "Add" }));

    await vi.waitFor(() => {
      expect(field).toHaveAccessibleDescription("Enter a name.");
    });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(createCategory).not.toHaveBeenCalled();
  });

  test("a duplicate shows next to the field and keeps the name", async () => {
    createCategory.mockResolvedValue({ validationErrors: { name: { _errors: ["nameTaken"] } } });
    const { user, sheet, field } = await openSheet();
    await user.type(field, "coffee");
    await user.click(within(sheet).getByRole("button", { name: "Add" }));

    await vi.waitFor(() => {
      expect(field).toHaveAccessibleDescription(en.Categories.errors.nameTaken);
    });
    expect(field).toHaveValue("coffee");
    expect(field).toHaveFocus();
    expect(screen.getByRole("dialog", { name: SHEET })).toBeVisible();
    expect(notifications().queryByText("Category added.")).not.toBeInTheDocument();
  });

  test("a server error shows the unknown error", async () => {
    createCategory.mockResolvedValue({ serverError: "unauthorized" });
    const { user, sheet, field } = await openSheet();
    await user.type(field, "Coffee");
    await user.click(within(sheet).getByRole("button", { name: "Add" }));

    expect(await within(sheet).findByText(en.Categories.errors.unknown)).toBeVisible();
  });

  test("a failed request shows the unknown error", async () => {
    createCategory.mockRejectedValue(new Error("offline"));
    const { user, sheet, field } = await openSheet();
    await user.type(field, "Coffee");
    await user.click(within(sheet).getByRole("button", { name: "Add" }));

    expect(await within(sheet).findByText(en.Categories.errors.unknown)).toBeVisible();
  });
});
