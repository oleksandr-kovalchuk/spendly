// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { SignInForm } from "./sign-in-form";

const { assign, signIn } = vi.hoisted(() => ({ assign: vi.fn(), signIn: vi.fn() }));

vi.mock("@/shared/auth/auth-client", () => ({ authClient: { signIn: { email: signIn } } }));

beforeEach(() => {
  assign.mockReset();
  signIn.mockReset();
  vi.stubGlobal("location", { assign });
});

function renderForm(props: Partial<ComponentProps<typeof SignInForm>> = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SignInForm {...props} />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("empty fields show their errors and send nothing", async () => {
  const user = renderForm();
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Enter a valid email address.")).toBeVisible();
  expect(screen.getByText("Enter your password.")).toBeVisible();
  expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Enter your password.");
  expect(signIn).not.toHaveBeenCalled();
});

test("a password is not checked for its length on sign in", async () => {
  signIn.mockResolvedValue({ error: null });
  const user = renderForm({ defaultEmail: "ann@example.com" });
  await user.type(screen.getByLabelText("Password"), "x");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(signIn).toHaveBeenCalledWith({ email: "ann@example.com", password: "x" });
});

test("a successful sign in loads the main page in full", async () => {
  signIn.mockResolvedValue({ error: null });
  const user = renderForm({ defaultEmail: "ann@example.com" });
  await user.type(screen.getByLabelText("Password"), "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(assign).toHaveBeenCalledWith("/en");
});

test("submit stays disabled, and focusable, until the request ends", async () => {
  const { promise, resolve } = Promise.withResolvers<object>();
  signIn.mockReturnValue(promise);
  const user = renderForm({ defaultEmail: "ann@example.com" });
  await user.type(screen.getByLabelText("Password"), "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await vi.waitFor(() => {
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
  resolve({ error: null });
  await vi.waitFor(() => {
    expect(assign).toHaveBeenCalledWith("/en");
  });
});

test("wrong credentials show one form error and keep the user on the page", async () => {
  signIn.mockResolvedValue({ error: { status: 401, code: "INVALID_EMAIL_OR_PASSWORD" } });
  const user = renderForm({ defaultEmail: "ann@example.com" });
  await user.type(screen.getByLabelText("Password"), "wrong-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("The email or password is incorrect.");
  expect(assign).not.toHaveBeenCalled();
});

test("a rate limit answer says to try again later", async () => {
  signIn.mockResolvedValue({ error: { status: 429 } });
  const user = renderForm({ defaultEmail: "ann@example.com" });
  await user.type(screen.getByLabelText("Password"), "whatever");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Too many attempts. Try again in a minute.",
  );
});

test("after sign up the email is filled in and a notice is shown", () => {
  renderForm({ defaultEmail: "ann@example.com", notice: "registered" });

  expect(screen.getByLabelText("Email")).toHaveValue("ann@example.com");
  expect(screen.getByRole("status")).toHaveTextContent("Your account is ready.");
});

test("after deleting the account a notice says it's gone", () => {
  renderForm({ notice: "accountDeleted" });

  expect(screen.getByRole("status")).toHaveTextContent(
    "Your account and all its data have been deleted.",
  );
});

test("after a password reset a notice asks for the new password", () => {
  renderForm({ notice: "passwordReset" });

  expect(screen.getByRole("status")).toHaveTextContent(
    "Your password has changed. Sign in with the new one.",
  );
});

test("links to the forgot-password page in the page's language", () => {
  renderForm();

  expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
    "href",
    "/en/forgot-password",
  );
});

test("a failed Google sign-in shows why", () => {
  renderForm({ googleError: "accountNotLinked" });

  expect(screen.getByRole("alert")).toHaveTextContent(
    "This email already has an account with a password. Sign in with your password.",
  );
});

test("without a notice there is none", () => {
  renderForm();

  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("the password can be shown and hidden again without sending the form", async () => {
  const user = renderForm();
  const password = screen.getByLabelText("Password");
  const toggle = screen.getByRole("button", { name: "Show password" });
  await user.type(password, "secret");

  await user.click(toggle);
  expect(password).toHaveAttribute("type", "text");
  expect(password).toHaveValue("secret");
  expect(toggle).toHaveAttribute("aria-pressed", "true");

  await user.click(toggle);
  expect(password).toHaveAttribute("type", "password");
  expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(signIn).not.toHaveBeenCalled();
});
