// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { Toaster } from "@/shared/ui/toast";

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

test("the pressed Delete stays disabled, and focusable, until the request ends", async () => {
  const { promise, resolve } = Promise.withResolvers<object>();
  deleteTransaction.mockReturnValue(promise);
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Delete" }));

  await vi.waitFor(() => {
    expect(within(dialog).getByRole("button", { name: "Delete" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
  resolve({ serverError: "transactionNotFound" });
  expect(await within(dialog).findByText(en.Transactions.errors.transactionNotFound)).toBeVisible();
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

// The toast waits for the redirect to unmount the edit sheet with this button
function DeleteScreen({ hasButton }: { hasButton: boolean }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {hasButton ? (
        <DeleteTransactionButton transactionId={ID} label="Food" listQuery={{ period: "week" }} />
      ) : null}
      <Toaster regionLabel="Notifications" closeLabel="Close notification" />
    </NextIntlClientProvider>
  );
}

test.each([
  ["a delete shows a toast once the button goes away", {}, true],
  [
    "a failed delete shows no toast when the button goes away",
    { serverError: "transactionNotFound" },
    false,
  ],
])("%s", async (_name, result, hasToast) => {
  deleteTransaction.mockResolvedValue(result);
  const user = userEvent.setup();
  const { rerender } = render(<DeleteScreen hasButton />);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(await screen.findByRole("button", { name: "Delete" }));
  await vi.waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });
  expect(screen.queryByText("Transaction deleted.")).not.toBeInTheDocument();

  rerender(<DeleteScreen hasButton={false} />);
  const notifications = within(screen.getByRole("region", { name: "Notifications" }));
  if (hasToast) {
    expect(await notifications.findByText("Transaction deleted.")).toBeVisible();
  } else {
    expect(notifications.queryByText("Transaction deleted.")).not.toBeInTheDocument();
  }
});
