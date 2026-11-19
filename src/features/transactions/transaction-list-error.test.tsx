// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { TransactionListError } from "./transaction-list-error";

test("tells the list failed and retries on request", async () => {
  const retry = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <TransactionListError retry={retry} />
    </NextIntlClientProvider>,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(en.Transactions.list.loadFailed);
  await userEvent.click(screen.getByRole("button", { name: en.Transactions.list.retry }));

  expect(retry).toHaveBeenCalledOnce();
});
