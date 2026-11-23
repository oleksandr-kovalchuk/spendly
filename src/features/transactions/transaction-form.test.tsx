// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import type { CategoryType } from "@/shared/db/app-constants";

import type { CategoryOption } from "./category-option";
import { TransactionForm } from "./transaction-form";
import type { TransactionDto } from "./transactions.dal";

const { addTransaction, updateTransaction } = vi.hoisted(() => ({
  addTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));
vi.mock("./add-transaction.action", () => ({ addTransaction }));
vi.mock("./update-transaction.action", () => ({ updateTransaction }));

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
    type: "expense",
    defaultKey: "transport",
    icon: null,
    label: "Transport",
  },
  {
    id: "0198a8c0-0000-7000-8000-000000000003",
    type: "income",
    defaultKey: "salary",
    icon: null,
    label: "Salary",
  },
];

beforeEach(() => {
  addTransaction.mockReset();
  updateTransaction.mockReset();
});

function dateButton() {
  return screen.getByRole("button", { name: /^Date: / });
}

function categoryGroup() {
  return within(screen.getByRole("radiogroup", { name: "Category" }));
}

function categoryNames() {
  return categoryGroup()
    .getAllByRole("radio")
    .map((radio) => radio.closest("label")?.textContent);
}

function renderForm(onSaved = vi.fn(), type: CategoryType = "expense") {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <TransactionForm categories={CATEGORIES} type={type} today="2026-03-10" onSaved={onSaved} />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("a new expense is dated today, with the expense categories and no type switch", () => {
  renderForm();

  expect(screen.queryByRole("radio", { name: "Expense" })).not.toBeInTheDocument();
  expect(screen.queryByRole("radio", { name: "Income" })).not.toBeInTheDocument();
  expect(dateButton()).toHaveAccessibleName("Date: March 10, 2026");
  expect(categoryNames()).toEqual(["Food", "Transport"]);
  expect(categoryGroup().getByRole("radio", { name: "Food" })).toBeChecked();
});

test("a new income shows the income categories and is sent as income", async () => {
  addTransaction.mockResolvedValue({});
  const user = renderForm(vi.fn(), "income");

  expect(categoryNames()).toEqual(["Salary"]);
  expect(categoryGroup().getByRole("radio", { name: "Salary" })).toBeChecked();
  await user.type(screen.getByLabelText(/^Amount/), "5");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(addTransaction).toHaveBeenCalledWith(
    expect.objectContaining({ type: "income", categoryId: CATEGORIES[2]?.id }),
  );
});

test("the amount shows the currency after the number", () => {
  renderForm();

  expect(screen.getByLabelText(/^Amount/).closest("div")).toHaveTextContent(/0\s*₴$/);
});

test("a type without categories links to the Categories page and sends nothing", async () => {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <TransactionForm
        categories={CATEGORIES.filter((category) => category.type === "expense")}
        type="income"
        today="2026-03-10"
        onSaved={vi.fn()}
      />
    </NextIntlClientProvider>,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/^Amount/), "5");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(screen.getByText("You have no categories of this type.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Add a category" })).toHaveAttribute(
    "href",
    "/en/categories",
  );
  expect(addTransaction).not.toHaveBeenCalled();
});

test("a tap on a tile picks its category", async () => {
  addTransaction.mockResolvedValue({});
  const user = renderForm();
  await user.type(screen.getByLabelText(/^Amount/), "5");
  await user.click(screen.getByText("Transport"));
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(addTransaction).toHaveBeenCalledWith(
    expect.objectContaining({ categoryId: CATEGORIES[1]?.id }),
  );
});

test("an empty amount shows its error and sends nothing", async () => {
  const user = renderForm();
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByText("Enter an amount.")).toBeVisible();
  expect(screen.getByLabelText(/^Amount/)).toHaveAccessibleDescription("Enter an amount.");
  expect(addTransaction).not.toHaveBeenCalled();
});

test("a valid form sends the values and closes", async () => {
  addTransaction.mockResolvedValue({});
  const onSaved = vi.fn();
  const user = renderForm(onSaved);
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
  await vi.waitFor(() => {
    expect(onSaved).toHaveBeenCalledOnce();
  });
});

test("submit stays disabled, and focusable, until the request ends", async () => {
  const { promise, resolve } = Promise.withResolvers<object>();
  addTransaction.mockReturnValue(promise);
  const onSaved = vi.fn();
  const user = renderForm(onSaved);
  await user.type(screen.getByLabelText(/^Amount/), "1");
  await user.click(screen.getByRole("button", { name: "Add" }));

  await vi.waitFor(() => {
    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute("aria-disabled", "true");
  });
  expect(onSaved).not.toHaveBeenCalled();

  resolve({});
  await vi.waitFor(() => {
    expect(onSaved).toHaveBeenCalledOnce();
  });
});

test("a field error from the server is shown next to its field", async () => {
  addTransaction.mockResolvedValue({
    validationErrors: { amount: { _errors: ["amountTooLarge"] } },
  });
  const onSaved = vi.fn();
  const user = renderForm(onSaved);
  await user.type(screen.getByLabelText(/^Amount/), "1");
  await user.click(screen.getByRole("button", { name: "Add" }));

  expect(await screen.findByLabelText(/^Amount/)).toHaveAccessibleDescription(
    en.Transactions.errors.amountTooLarge,
  );
  expect(onSaved).not.toHaveBeenCalled();
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
      <TransactionForm categories={CATEGORIES} type="expense" today={today} onSaved={vi.fn()} />
    </NextIntlClientProvider>
  );
  const { rerender } = render(ui("2026-03-10"));

  rerender(ui("2026-03-11"));

  expect(dateButton()).toHaveAccessibleName("Date: March 11, 2026");
});

const STORED: TransactionDto = {
  id: "0198a8c0-0000-7000-8000-0000000000aa",
  type: "income",
  amountKopecks: 300_050,
  occurredOn: "2026-03-05",
  note: "march",
  categoryId: CATEGORIES[2]?.id ?? "",
  category: { defaultKey: "salary", name: null, icon: null },
};

function renderEditForm(onSaved = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <TransactionForm categories={CATEGORIES} transaction={STORED} onSaved={onSaved} />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

describe("editing a transaction", () => {
  test("opens with the values of the transaction", () => {
    renderEditForm();

    expect(screen.getByLabelText("Income")).toBeChecked();
    expect(screen.getByLabelText(/^Amount/)).toHaveValue("3000.50");
    expect(dateButton()).toHaveAccessibleName("Date: March 5, 2026");
    expect(categoryGroup().getByRole("radio", { name: "Salary" })).toBeChecked();
    expect(screen.getByLabelText(/^Note/)).toHaveValue("march");
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });

  test("switching the type shows its categories and selects the first", async () => {
    const user = renderEditForm();
    await user.click(screen.getByLabelText("Expense"));

    expect(categoryNames()).toEqual(["Food", "Transport"]);
    expect(categoryGroup().getByRole("radio", { name: "Food" })).toBeChecked();
  });

  test("saves the changes with the id and closes", async () => {
    updateTransaction.mockResolvedValue({});
    const onSaved = vi.fn();
    const user = renderEditForm(onSaved);
    await user.clear(screen.getByLabelText(/^Amount/));
    await user.type(screen.getByLabelText(/^Amount/), "10,5");
    // The calendar's code loads on the first open, which can exceed findBy's 1 s default on a cold run
    await user.click(dateButton());
    await user.click(
      await screen.findByRole("button", { name: "Saturday, March 7, 2026" }, { timeout: 5000 }),
    );
    expect(dateButton()).toHaveAccessibleName("Date: March 7, 2026");
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
    const user = renderEditForm(onSaved);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(en.Transactions.errors.transactionNotFound)).toBeVisible();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
