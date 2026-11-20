// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { TransactionForm, type CategoryOption } from "./transaction-form";
import type { TransactionDto } from "./transactions.dal";

const { addTransaction, updateTransaction } = vi.hoisted(() => ({
  addTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));
vi.mock("./add-transaction.action", () => ({ addTransaction }));
vi.mock("./update-transaction.action", () => ({ updateTransaction }));

const CATEGORIES: CategoryOption[] = [
  { id: "0198a8c0-0000-7000-8000-000000000001", type: "expense", label: "Food" },
  { id: "0198a8c0-0000-7000-8000-000000000002", type: "expense", label: "Transport" },
  { id: "0198a8c0-0000-7000-8000-000000000003", type: "income", label: "Salary" },
];

beforeEach(() => {
  addTransaction.mockReset();
  updateTransaction.mockReset();
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

const STORED: TransactionDto = {
  id: "0198a8c0-0000-7000-8000-0000000000aa",
  type: "income",
  amountKopecks: 300_050,
  occurredOn: "2026-03-05",
  note: "march",
  categoryId: CATEGORIES[2]?.id ?? "",
  category: { defaultKey: "salary", name: null },
};

function renderEditForm(callbacks: { onSaved?: () => void; onCancel?: () => void } = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <TransactionForm
        categories={CATEGORIES}
        today="2026-03-10"
        transaction={STORED}
        {...callbacks}
      />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

describe("editing a transaction", () => {
  test("opens with the values of the transaction", () => {
    renderEditForm();

    expect(screen.getByRole("heading", { name: "Edit transaction" })).toBeVisible();
    expect(screen.getByLabelText("Income")).toBeChecked();
    expect(screen.getByLabelText(/^Amount/)).toHaveValue("3000.50");
    expect(screen.getByLabelText("Date")).toHaveValue("2026-03-05");
    expect(screen.getByLabelText("Category")).toHaveValue(CATEGORIES[2]?.id);
    expect(screen.getByLabelText(/^Note/)).toHaveValue("march");
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });

  test("saves the changes with the id and closes", async () => {
    updateTransaction.mockResolvedValue({});
    const onSaved = vi.fn();
    const user = renderEditForm({ onSaved });
    await user.clear(screen.getByLabelText(/^Amount/));
    await user.type(screen.getByLabelText(/^Amount/), "10,5");
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2026-03-07");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateTransaction).toHaveBeenCalledWith({
      id: STORED.id,
      type: "income",
      amount: "10,5",
      categoryId: CATEGORIES[2]?.id,
      date: "2026-03-07",
      note: "march",
    });
    await vi.waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
    expect(addTransaction).not.toHaveBeenCalled();
  });

  test("a missing transaction shows its error and stays open", async () => {
    updateTransaction.mockResolvedValue({ serverError: "transactionNotFound" });
    const onSaved = vi.fn();
    const user = renderEditForm({ onSaved });
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(en.Transactions.errors.transactionNotFound)).toBeVisible();
    expect(onSaved).not.toHaveBeenCalled();
  });

  test("cancel closes without saving", async () => {
    const onCancel = vi.fn();
    const user = renderEditForm({ onCancel });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(updateTransaction).not.toHaveBeenCalled();
  });
});
