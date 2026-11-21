// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { Toaster } from "@/shared/ui/toast";

import { DataResetButton } from "./data-reset-button";

const { clearTransactions, resetData } = vi.hoisted(() => ({
  clearTransactions: vi.fn(),
  resetData: vi.fn(),
}));
vi.mock("./clear-transactions.action", () => ({ clearTransactions }));
vi.mock("./reset-data.action", () => ({ resetData }));

type Kind = "transactions" | "all";

beforeEach(() => {
  clearTransactions.mockReset();
  resetData.mockReset();
});

function renderButton(kind: Kind) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <DataResetButton kind={kind} />
      <Toaster regionLabel="Notifications" closeLabel="Close notification" />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

function notifications() {
  return within(screen.getByRole("region", { name: "Notifications" }));
}

describe.each([
  { kind: "transactions" as const, action: clearTransactions, other: resetData },
  { kind: "all" as const, action: resetData, other: clearTransactions },
])("$kind", ({ kind, action, other }) => {
  const text = en.DataReset[kind];

  test("asks first, and cancel changes nothing", async () => {
    const user = renderButton(kind);
    await user.click(screen.getByRole("button", { name: text.action }));

    expect(await screen.findByRole("alertdialog", { name: text.title })).toBeVisible();
    await user.click(screen.getByRole("button", { name: en.DataReset.cancel }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(action).not.toHaveBeenCalled();
  });

  test("confirming runs the action, closes the dialog and shows a toast", async () => {
    action.mockResolvedValue({});
    const user = renderButton(kind);
    await user.click(screen.getByRole("button", { name: text.action }));
    await user.click(await screen.findByRole("button", { name: text.confirm }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(action).toHaveBeenCalledOnce();
    expect(other).not.toHaveBeenCalled();
    expect(await notifications().findByText(text.toast)).toBeVisible();
  });

  test.each([
    ["a server error", () => action.mockResolvedValue({ serverError: "unauthorized" })],
    ["a failed request", () => action.mockRejectedValue(new Error("offline"))],
  ])("%s shows a message and keeps the dialog open", async (_name, arrange) => {
    arrange();
    const user = renderButton(kind);
    await user.click(screen.getByRole("button", { name: text.action }));
    await user.click(await screen.findByRole("button", { name: text.confirm }));

    expect(await screen.findByText(en.DataReset.error)).toBeVisible();
    expect(screen.getByRole("alertdialog", { name: text.title })).toBeVisible();
  });
});
