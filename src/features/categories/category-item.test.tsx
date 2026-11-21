// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { Toaster } from "@/shared/ui/toast";

import { CategoryItem } from "./category-item";

const { updateCategory, deleteCategory } = vi.hoisted(() => ({
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));
vi.mock("./update-category.action", () => ({ updateCategory }));
vi.mock("./delete-category.action", () => ({ deleteCategory }));

const ID = "0198a8c0-0000-7000-8000-000000000001";
const FOOD = {
  id: ID,
  label: "Food",
  defaultKey: "food",
  icon: null,
  transactionCount: 0,
  otherLabel: "Other",
} as const;
const COFFEE = { ...FOOD, label: "Coffee", defaultKey: null, icon: "coffee" } as const;

// The sheet loads lazily: a first import here keeps the first test from waiting on the transform
beforeAll(async () => {
  await import("./edit-category-sheet");
});

beforeEach(() => {
  updateCategory.mockReset();
  deleteCategory.mockReset();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: true,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

// The edit form opens in a sheet named by the button that opened it
async function openSheet(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name }));
  const sheet = await screen.findByRole("dialog", { name });

  return { sheet, field: within(sheet).getByLabelText("Name") };
}

async function sheetClosed() {
  // A toast is a dialog too
  await vi.waitFor(() => {
    expect(screen.queryByRole("dialog", { name: /^(Rename|Edit) / })).not.toBeInTheDocument();
  });
}

function notifications() {
  return within(screen.getByRole("region", { name: "Notifications" }));
}

function renderItem(props: ComponentProps<typeof CategoryItem> = FOOD) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ul>
        <CategoryItem {...props} />
      </ul>
      <Toaster regionLabel="Notifications" closeLabel="Close notification" />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

describe("a default category", () => {
  test("Rename opens the form with the current name selected and no icons", async () => {
    const user = renderItem();
    const { sheet, field } = await openSheet(user, "Rename Food");

    expect(field).toHaveValue("Food");
    await vi.waitFor(() => {
      expect(field).toHaveFocus();
    });
    const input = field as HTMLInputElement;
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, "Food".length]);
    expect(within(sheet).queryByRole("group", { name: "Icon" })).not.toBeInTheDocument();
  });

  test("a new name is sent, then the form closes, focus returns to Rename and a toast confirms", async () => {
    updateCategory.mockResolvedValue({});
    const user = renderItem();
    const { sheet, field } = await openSheet(user, "Rename Food");
    await user.clear(field);
    await user.type(field, "Groceries");
    await user.click(within(sheet).getByRole("button", { name: "Save" }));

    expect(updateCategory).toHaveBeenCalledWith({ id: ID, name: "Groceries" });
    await sheetClosed();
    expect(screen.getByRole("button", { name: "Rename Food" })).toHaveFocus();
    expect(await notifications().findByText("Category renamed.")).toBeVisible();
  });

  test("saving the unchanged name sends nothing, so a default keeps its translation", async () => {
    const user = renderItem();
    const { sheet } = await openSheet(user, "Rename Food");
    await user.click(within(sheet).getByRole("button", { name: "Save" }));

    await sheetClosed();
    expect(updateCategory).not.toHaveBeenCalled();
    expect(notifications().queryByText("Category renamed.")).not.toBeInTheDocument();
  });

  test("a duplicate shows next to the field and keeps the form open", async () => {
    updateCategory.mockResolvedValue({ validationErrors: { name: { _errors: ["nameTaken"] } } });
    const user = renderItem();
    const { sheet, field } = await openSheet(user, "Rename Food");
    await user.clear(field);
    await user.type(field, "Transport");
    await user.click(within(sheet).getByRole("button", { name: "Save" }));

    await vi.waitFor(() => {
      expect(field).toHaveAccessibleDescription(en.Categories.errors.nameTaken);
    });
    expect(sheet).toBeVisible();
  });

  test("another user's or a deleted category shows a reload message", async () => {
    updateCategory.mockResolvedValue({ serverError: "categoryNotFound" });
    const user = renderItem();
    const { sheet, field } = await openSheet(user, "Rename Food");
    await user.type(field, "s");
    await user.click(within(sheet).getByRole("button", { name: "Save" }));

    expect(await within(sheet).findByText(en.Categories.errors.categoryNotFound)).toBeVisible();
  });

  test("the close button closes the form without sending and returns focus to Rename", async () => {
    const user = renderItem();
    const { sheet, field } = await openSheet(user, "Rename Food");
    await user.type(field, "x");
    await user.click(within(sheet).getByRole("button", { name: "Close" }));

    await sheetClosed();
    expect(updateCategory).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Rename Food" })).toHaveFocus();
  });
});

describe("an own category", () => {
  test("Edit shows its icon checked, and a new icon is sent with the name", async () => {
    updateCategory.mockResolvedValue({});
    const user = renderItem(COFFEE);
    const { sheet } = await openSheet(user, "Edit Coffee");

    expect(within(sheet).getByRole("radio", { name: "Coffee" })).toBeChecked();
    await user.click(within(sheet).getByRole("radio", { name: "Books" }));
    await user.click(within(sheet).getByRole("button", { name: "Save" }));

    expect(updateCategory).toHaveBeenCalledWith({ id: ID, name: "Coffee", icon: "bookOpen" });
    expect(await notifications().findByText("Category saved.")).toBeVisible();
  });

  test("saving with nothing changed sends nothing", async () => {
    const user = renderItem(COFFEE);
    const { sheet } = await openSheet(user, "Edit Coffee");
    await user.click(within(sheet).getByRole("button", { name: "Save" }));

    await sheetClosed();
    expect(updateCategory).not.toHaveBeenCalled();
  });
});

describe("deleting", () => {
  test("an empty category is deleted after the confirmation", async () => {
    deleteCategory.mockResolvedValue({});
    const user = renderItem();
    await user.click(screen.getByRole("button", { name: "Delete Food" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete “Food”?" });

    expect(dialog).toHaveAccessibleDescription(en.Categories.delete.emptyDescription);
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(deleteCategory).toHaveBeenCalledWith({ id: ID });
  });

  test("the pressed Delete stays disabled, and focusable, until the request ends", async () => {
    const { promise, resolve } = Promise.withResolvers<object>();
    deleteCategory.mockReturnValue(promise);
    const user = renderItem();
    await user.click(screen.getByRole("button", { name: "Delete Food" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await vi.waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Delete" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
    resolve({ serverError: "otherHasTransactions" });
    expect(
      await within(dialog).findByText(en.Categories.errors.otherHasTransactions),
    ).toBeVisible();
  });

  test("the confirmation says where the transactions move", async () => {
    const user = renderItem({ ...FOOD, transactionCount: 3, otherLabel: "Misc" });
    await user.click(screen.getByRole("button", { name: "Delete Food" }));

    expect(
      await screen.findByRole("alertdialog", { name: "Delete “Food”?" }),
    ).toHaveAccessibleDescription("Its 3 transactions move to “Misc”. This can't be undone.");
  });

  test("Other with transactions can't be deleted and offers no Delete button", async () => {
    const user = renderItem({ ...FOOD, label: "Other", defaultKey: "other", transactionCount: 1 });
    await user.click(screen.getByRole("button", { name: "Delete Other" }));
    const dialog = await screen.findByRole("alertdialog", { name: "“Other” can't be deleted" });

    expect(dialog).toHaveAccessibleDescription(
      "It has 1 transaction. Move them to other categories or delete them first.",
    );
    expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeVisible();
  });

  test("a refusal from the server shows in the dialog", async () => {
    deleteCategory.mockResolvedValue({ serverError: "otherHasTransactions" });
    const user = renderItem({ ...FOOD, label: "Other", defaultKey: "other" });
    await user.click(screen.getByRole("button", { name: "Delete Other" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await within(dialog).findByText(en.Categories.errors.otherHasTransactions),
    ).toBeVisible();
  });
});
