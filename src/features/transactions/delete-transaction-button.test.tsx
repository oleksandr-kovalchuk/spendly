// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { DeleteTransactionButton } from "./delete-transaction-button";

const { deleteTransaction } = vi.hoisted(() => ({ deleteTransaction: vi.fn() }));
vi.mock("./delete-transaction.action", () => ({ deleteTransaction }));

const ID = "0198a8c0-0000-7000-8000-0000000000aa";

beforeEach(() => {
  deleteTransaction.mockReset();
});

function renderButton() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <DeleteTransactionButton transactionId={ID} label="Food" listQuery={{ period: "week" }} />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("asks before deleting and cancel keeps the transaction", async () => {
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Delete" }));

  expect(
    await screen.findByRole("alertdialog", { name: "Delete this transaction?" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  await vi.waitFor(() => {
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
  expect(deleteTransaction).not.toHaveBeenCalled();
});

// On success the action redirects to the list, which unmounts the edit sheet with this button
test("confirming deletes by id and returns to the list's period", async () => {
  deleteTransaction.mockResolvedValue({});
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(await screen.findByRole("button", { name: "Delete" }));

  expect(deleteTransaction).toHaveBeenCalledWith({
    id: ID,
    locale: "en",
    listQuery: { period: "week" },
  });
});

test.each([
  [{ serverError: "transactionNotFound" }, en.Transactions.errors.transactionNotFound],
  [{ serverError: "unauthorized" }, en.Transactions.errors.unknown],
])("the server error %j shows a message and keeps the dialog open", async (result, message) => {
  deleteTransaction.mockResolvedValue(result);
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(await screen.findByRole("button", { name: "Delete" }));

  expect(await screen.findByText(message)).toBeVisible();
  expect(screen.getByRole("alertdialog")).toBeVisible();
});

test("a failed request shows the unknown error", async () => {
  deleteTransaction.mockRejectedValue(new Error("offline"));
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(await screen.findByRole("button", { name: "Delete" }));

  expect(await screen.findByText(en.Transactions.errors.unknown)).toBeVisible();
});
