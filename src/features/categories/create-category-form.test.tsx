// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { CreateCategoryForm } from "./create-category-form";

const { createCategory } = vi.hoisted(() => ({ createCategory: vi.fn() }));
vi.mock("./create-category.action", () => ({ createCategory }));

const LABEL = "New expense category";

beforeEach(() => {
  createCategory.mockReset();
});

function renderForm() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CreateCategoryForm type="expense" />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("an empty name shows its error and sends nothing", async () => {
  const user = renderForm();
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByLabelText(LABEL)).toHaveAccessibleDescription("Enter a name.");
  expect(screen.getByLabelText(LABEL)).toHaveAttribute("aria-invalid", "true");
  expect(createCategory).not.toHaveBeenCalled();
});

test("a valid name is sent with the form's type, then the field clears", async () => {
  createCategory.mockResolvedValue({});
  const user = renderForm();
  await user.type(screen.getByLabelText(LABEL), "Coffee");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(createCategory).toHaveBeenCalledWith({ type: "expense", name: "Coffee" });
  expect(await screen.findByText("Category added.")).toBeVisible();
  expect(screen.getByLabelText(LABEL)).toHaveValue("");
});

test("a duplicate shows next to the field and keeps the name", async () => {
  createCategory.mockResolvedValue({ validationErrors: { name: { _errors: ["nameTaken"] } } });
  const user = renderForm();
  await user.type(screen.getByLabelText(LABEL), "coffee");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByLabelText(LABEL)).toHaveAccessibleDescription(
    en.Categories.errors.nameTaken,
  );
  expect(screen.getByLabelText(LABEL)).toHaveValue("coffee");
  expect(screen.getByLabelText(LABEL)).toHaveFocus();
  expect(screen.queryByText("Category added.")).not.toBeInTheDocument();
});

test("a server error shows the unknown error", async () => {
  createCategory.mockResolvedValue({ serverError: "unauthorized" });
  const user = renderForm();
  await user.type(screen.getByLabelText(LABEL), "Coffee");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByText(en.Categories.errors.unknown)).toBeVisible();
});

test("a failed request shows the unknown error", async () => {
  createCategory.mockRejectedValue(new Error("offline"));
  const user = renderForm();
  await user.type(screen.getByLabelText(LABEL), "Coffee");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByText(en.Categories.errors.unknown)).toBeVisible();
});
