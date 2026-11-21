// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { DeleteAccountButton } from "./delete-account-button";

const { deleteUser, assign } = vi.hoisted(() => ({ deleteUser: vi.fn(), assign: vi.fn() }));

vi.mock("@/shared/auth/auth-client", () => ({ authClient: { deleteUser } }));

beforeEach(() => {
  deleteUser.mockReset();
  assign.mockReset();
  vi.stubGlobal("location", { assign });
});

async function openDialog(hasPassword: boolean) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <DeleteAccountButton hasPassword={hasPassword} />
    </NextIntlClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Delete account" }));
  const dialog = await screen.findByRole("alertdialog", { name: "Delete your account?" });

  return { user, dialog };
}

function confirmButton(dialog: HTMLElement) {
  return within(dialog).getByRole("button", { name: "Delete account" });
}

test("an account with a password is deleted with it, then sign-in opens with a notice", async () => {
  deleteUser.mockResolvedValue({ error: null });
  const { user, dialog } = await openDialog(true);

  await user.type(within(dialog).getByLabelText("Password"), "my password");
  await user.click(confirmButton(dialog));

  expect(deleteUser).toHaveBeenCalledWith({ password: "my password" });
  expect(assign).toHaveBeenCalledWith("/en/sign-in?accountDeleted=1");
});

test("an empty password shows its error and deletes nothing", async () => {
  const { user, dialog } = await openDialog(true);

  await user.click(confirmButton(dialog));

  expect(await within(dialog).findByText("Enter your password.")).toBeVisible();
  expect(within(dialog).getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
  expect(deleteUser).not.toHaveBeenCalled();
});

test("a wrong password shows its error next to the field", async () => {
  deleteUser.mockResolvedValue({ error: { status: 400, code: "INVALID_PASSWORD" } });
  const { user, dialog } = await openDialog(true);

  await user.type(within(dialog).getByLabelText("Password"), "wrong password");
  await user.click(confirmButton(dialog));

  expect(await within(dialog).findByText("The password is incorrect.")).toBeVisible();
  expect(assign).not.toHaveBeenCalled();
});

test("an account without a password is deleted without asking for one", async () => {
  deleteUser.mockResolvedValue({ error: null });
  const { user, dialog } = await openDialog(false);

  expect(within(dialog).queryByLabelText("Password")).not.toBeInTheDocument();
  await user.click(confirmButton(dialog));

  expect(deleteUser).toHaveBeenCalledWith({});
  expect(assign).toHaveBeenCalledWith("/en/sign-in?accountDeleted=1");
});

test("an old session asks to sign in again", async () => {
  deleteUser.mockResolvedValue({ error: { status: 400, code: "SESSION_EXPIRED" } });
  const { user, dialog } = await openDialog(false);

  await user.click(confirmButton(dialog));

  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "For your safety, sign out and sign in again, then delete the account.",
  );
  expect(assign).not.toHaveBeenCalled();
});

test("too many attempts say so", async () => {
  deleteUser.mockResolvedValue({ error: { status: 429 } });
  const { user, dialog } = await openDialog(true);

  await user.type(within(dialog).getByLabelText("Password"), "my password");
  await user.click(confirmButton(dialog));

  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "Too many attempts. Try again in a minute.",
  );
});
