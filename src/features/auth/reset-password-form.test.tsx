// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { ResetPasswordForm } from "./reset-password-form";

const { push, resetPassword } = vi.hoisted(() => ({ push: vi.fn(), resetPassword: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/shared/auth/auth-client", () => ({ authClient: { resetPassword } }));

beforeEach(() => {
  push.mockReset();
  resetPassword.mockReset();
});

function renderForm(token?: string) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ResetPasswordForm token={token} />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

async function submit(password: string) {
  const user = renderForm("token123");
  await user.type(screen.getByLabelText("New password"), password);
  await user.click(screen.getByRole("button", { name: "Save password" }));
}

function expectInvalidLink() {
  expect(screen.getByRole("alert")).toHaveTextContent("This link is invalid or has expired.");
  expect(screen.getByRole("link", { name: "Get a new link" })).toHaveAttribute(
    "href",
    "/en/forgot-password",
  );
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
}

test("a short password shows its error and sends nothing", async () => {
  await submit("1234567");

  expect(await screen.findByText("The password must have at least 8 characters.")).toBeVisible();
  expect(resetPassword).not.toHaveBeenCalled();
});

test("a new password is saved with the link's token, then sign-in opens with a notice", async () => {
  resetPassword.mockResolvedValue({ error: null });

  await submit("a brand new password");

  expect(resetPassword).toHaveBeenCalledWith({
    token: "token123",
    newPassword: "a brand new password",
  });
  expect(push).toHaveBeenCalledWith("/en/sign-in?passwordReset=1");
});

test("without a token the link is invalid", () => {
  renderForm();

  expectInvalidLink();
});

test("a used or expired token shows that the link is invalid", async () => {
  resetPassword.mockResolvedValue({ error: { status: 400, code: "INVALID_TOKEN" } });

  await submit("a brand new password");

  expectInvalidLink();
  expect(push).not.toHaveBeenCalled();
});

test("a failed request shows a message to try again and keeps the form", async () => {
  resetPassword.mockResolvedValue({ error: { status: 0 } });

  await submit("a brand new password");

  expect(await screen.findByText("Something went wrong. Try again.")).toBeVisible();
  expect(screen.getByLabelText("New password")).toBeVisible();
});
