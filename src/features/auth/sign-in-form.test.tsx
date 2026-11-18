// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { SignInForm } from "./sign-in-form";

const { push, refresh, signIn } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/shared/auth/auth-client", () => ({ authClient: { signIn: { email: signIn } } }));

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  signIn.mockReset();
});

function renderForm(props: { defaultEmail?: string; hasJustRegistered?: boolean } = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SignInForm hasJustRegistered={false} {...props} />
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

test("a successful sign in opens the main page and refreshes the layout", async () => {
  signIn.mockResolvedValue({ error: null });
  const user = renderForm({ defaultEmail: "ann@example.com" });
  await user.type(screen.getByLabelText("Password"), "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(push).toHaveBeenCalledWith("/en");
  expect(refresh).toHaveBeenCalled();
});

test("wrong credentials show one form error and keep the user on the page", async () => {
  signIn.mockResolvedValue({ error: { status: 401, code: "INVALID_EMAIL_OR_PASSWORD" } });
  const user = renderForm({ defaultEmail: "ann@example.com" });
  await user.type(screen.getByLabelText("Password"), "wrong-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("The email or password is incorrect.");
  expect(push).not.toHaveBeenCalled();
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
  renderForm({ defaultEmail: "ann@example.com", hasJustRegistered: true });

  expect(screen.getByLabelText("Email")).toHaveValue("ann@example.com");
  expect(screen.getByRole("status")).toHaveTextContent("Your account is ready.");
});

test("without a fresh sign up there is no notice", () => {
  renderForm();

  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
