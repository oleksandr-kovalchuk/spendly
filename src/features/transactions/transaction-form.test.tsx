// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { TransactionForm, type CategoryOption } from "./transaction-form";

const { addTransaction } = vi.hoisted(() => ({ addTransaction: vi.fn() }));
vi.mock("./add-transaction.action", () => ({ addTransaction }));

const CATEGORIES: CategoryOption[] = [
  { id: "0198a8c0-0000-7000-8000-000000000001", type: "expense", label: "Food" },
  { id: "0198a8c0-0000-7000-8000-000000000002", type: "expense", label: "Transport" },
  { id: "0198a8c0-0000-7000-8000-000000000003", type: "income", label: "Salary" },
];

beforeEach(() => {
  addTransaction.mockReset();
});

function renderForm() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <TransactionForm categories={CATEGORIES} today="2026-03-10" />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("starts as an expense dated today, with the expense categories", () => {
  renderForm();

  expect(screen.getByLabelText("Expense")).toBeChecked();
  expect(screen.getByLabelText("Date")).toHaveValue("2026-03-10");
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Food",
    "Transport",
  ]);
});

test("switching to income shows the income categories and selects the first", async () => {
  const user = renderForm();
  await user.selectOptions(screen.getByLabelText("Category"), "Transport");
  await user.click(screen.getByLabelText("Income"));

  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Salary"]);
  expect(screen.getByLabelText("Category")).toHaveValue(CATEGORIES[2]?.id);
});

test("an empty amount shows its error and sends nothing", async () => {
  const user = renderForm();
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByText("Enter an amount.")).toBeVisible();
  expect(screen.getByLabelText(/^Amount/)).toHaveAccessibleDescription("Enter an amount.");
  expect(addTransaction).not.toHaveBeenCalled();
});

test("a valid form sends the values and clears the amount and the note", async () => {
  addTransaction.mockResolvedValue({});
  const user = renderForm();
  await user.type(screen.getByLabelText(/^Amount/), "125,50");
  await user.type(screen.getByLabelText(/^Note/), "lunch");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(addTransaction).toHaveBeenCalledWith({
    type: "expense",
    amount: "125,50",
    categoryId: CATEGORIES[0]?.id,
    date: "2026-03-10",
    note: "lunch",
  });
  expect(await screen.findByText("Transaction added.")).toBeVisible();
  expect(screen.getByLabelText(/^Amount/)).toHaveValue("");
  expect(screen.getByLabelText(/^Note/)).toHaveValue("");
  expect(screen.getByLabelText("Date")).toHaveValue("2026-03-10");
});

test("a field error from the server is shown next to its field", async () => {
  addTransaction.mockResolvedValue({
    validationErrors: { amount: { _errors: ["amountTooLarge"] } },
  });
  const user = renderForm();
  await user.type(screen.getByLabelText(/^Amount/), "1");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByLabelText(/^Amount/)).toHaveAccessibleDescription(
    en.Transactions.errors.amountTooLarge,
  );
  expect(screen.queryByText("Transaction added.")).not.toBeInTheDocument();
});

test.each([
  [{ serverError: "categoryNotFound" }, en.Transactions.errors.categoryNotFound],
  [{ serverError: "unauthorized" }, en.Transactions.errors.unknown],
])("the server error %j shows one message", async (result, message) => {
  addTransaction.mockResolvedValue(result);
  const user = renderForm();
  await user.type(screen.getByLabelText(/^Amount/), "1");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByText(message)).toBeVisible();
});

test("a failed request shows the unknown error", async () => {
  addTransaction.mockRejectedValue(new Error("offline"));
  const user = renderForm();
  await user.type(screen.getByLabelText(/^Amount/), "1");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByText(en.Transactions.errors.unknown)).toBeVisible();
});

test("a new today from the server replaces the date default", () => {
  const ui = (today: string) => (
    <NextIntlClientProvider locale="en" messages={en}>
      <TransactionForm categories={CATEGORIES} today={today} />
    </NextIntlClientProvider>
  );
  const { rerender } = render(ui("2026-03-10"));

  rerender(ui("2026-03-11"));

  expect(screen.getByLabelText("Date")).toHaveValue("2026-03-11");
});
