// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { ForgotPasswordForm } from "./forgot-password-form";

const { requestPasswordReset } = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }));

vi.mock("@/shared/auth/auth-client", () => ({ authClient: { requestPasswordReset } }));

beforeEach(() => {
  requestPasswordReset.mockReset();
});

function renderForm() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ForgotPasswordForm />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

async function submit(email: string) {
  const user = renderForm();
  await user.type(screen.getByLabelText("Email"), email);
  await user.click(screen.getByRole("button", { name: "Send link" }));
}

test("a malformed email shows its error and sends nothing", async () => {
  await submit("not-an-email");

  expect(await screen.findByText("Enter a valid email address.")).toBeVisible();
  expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
    "Enter a valid email address.",
  );
  expect(requestPasswordReset).not.toHaveBeenCalled();
});

test("asks for a link to the reset page in the page's language and says where it went", async () => {
  requestPasswordReset.mockResolvedValue({ error: null });

  await submit("ann@example.com");

  expect(requestPasswordReset).toHaveBeenCalledWith({
    email: "ann@example.com",
    redirectTo: "/en/reset-password",
  });
  expect(await screen.findByRole("status")).toHaveTextContent(
    "If ann@example.com has an account with a password, we’ve sent a link to it.",
  );
});

test("too many requests show a message to try again later", async () => {
  requestPasswordReset.mockResolvedValue({ error: { status: 429 } });

  await submit("ann@example.com");

  expect(await screen.findByText("Too many attempts. Try again in a minute.")).toBeVisible();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("a failed request shows a message to try again", async () => {
  requestPasswordReset.mockResolvedValue({ error: { status: 0 } });

  await submit("ann@example.com");

  expect(await screen.findByText("Something went wrong. Try again.")).toBeVisible();
});
