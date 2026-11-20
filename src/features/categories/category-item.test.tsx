// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { CategoryItem } from "./category-item";

const { renameCategory } = vi.hoisted(() => ({ renameCategory: vi.fn() }));
vi.mock("./rename-category.action", () => ({ renameCategory }));

const ID = "0198a8c0-0000-7000-8000-000000000001";
const FIELD = "New name for Food";

beforeEach(() => {
  renameCategory.mockReset();
});

function renderItem() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ul>
        <CategoryItem id={ID} label="Food" />
      </ul>
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("Rename opens the form with the current name selected", async () => {
  const user = renderItem();
  await user.click(screen.getByRole("button", { name: "Rename Food" }));

  const field = screen.getByLabelText(FIELD);
  expect(field).toHaveValue("Food");
  expect(field).toHaveFocus();
});

test("a new name is sent, then the form closes and focus returns to Rename", async () => {
  renameCategory.mockResolvedValue({});
  const user = renderItem();
  await user.click(screen.getByRole("button", { name: "Rename Food" }));
  await user.clear(screen.getByLabelText(FIELD));
  await user.type(screen.getByLabelText(FIELD), "Groceries");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(renameCategory).toHaveBeenCalledWith({ id: ID, name: "Groceries" });
  expect(await screen.findByRole("button", { name: "Rename Food" })).toHaveFocus();
  expect(screen.queryByLabelText(FIELD)).not.toBeInTheDocument();
});

test("saving the unchanged name sends nothing, so a default keeps its translation", async () => {
  const user = renderItem();
  await user.click(screen.getByRole("button", { name: "Rename Food" }));
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(renameCategory).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Rename Food" })).toBeVisible();
});

test("a duplicate shows next to the field and keeps the form open", async () => {
  renameCategory.mockResolvedValue({ validationErrors: { name: { _errors: ["nameTaken"] } } });
  const user = renderItem();
  await user.click(screen.getByRole("button", { name: "Rename Food" }));
  await user.clear(screen.getByLabelText(FIELD));
  await user.type(screen.getByLabelText(FIELD), "Transport");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByLabelText(FIELD)).toHaveAccessibleDescription(
    en.Categories.errors.nameTaken,
  );
});

test("another user's or a deleted category shows a reload message", async () => {
  renameCategory.mockResolvedValue({ serverError: "categoryNotFound" });
  const user = renderItem();
  await user.click(screen.getByRole("button", { name: "Rename Food" }));
  await user.type(screen.getByLabelText(FIELD), "s");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByText(en.Categories.errors.categoryNotFound)).toBeVisible();
});

test("Cancel closes the form without sending and returns focus to Rename", async () => {
  const user = renderItem();
  await user.click(screen.getByRole("button", { name: "Rename Food" }));
  await user.type(screen.getByLabelText(FIELD), "x");
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(renameCategory).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Rename Food" })).toHaveFocus();
});
