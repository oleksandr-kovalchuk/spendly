// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import { SignUpForm } from "./sign-up-form";

const { push, signUp } = vi.hoisted(() => ({ push: vi.fn(), signUp: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/shared/auth/auth-client", () => ({ authClient: { signUp: { email: signUp } } }));

beforeEach(() => {
  push.mockReset();
  signUp.mockReset();
});

function renderForm(locale: "en" | "uk" = "en") {
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : uk}>
      <SignUpForm />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

async function fill(user: ReturnType<typeof userEvent.setup>, email: string, password: string) {
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
}

test("an invalid email shows its error next to the field and sends nothing", async () => {
  const user = renderForm();
  await fill(user, "not-an-email", "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  const email = screen.getByLabelText("Email");
  expect(await screen.findByText("Enter a valid email address.")).toBeVisible();
  expect(email).toBeInvalid();
  expect(email).toHaveAccessibleDescription("Enter a valid email address.");
  expect(signUp).not.toHaveBeenCalled();
});

test("a short password shows its error, and a long one is rejected as well", async () => {
  const user = renderForm();
  await fill(user, "ann@example.com", "short");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("The password must have at least 8 characters.")).toBeVisible();
  expect(signUp).not.toHaveBeenCalled();

  await user.clear(screen.getByLabelText("Password"));
  await user.type(screen.getByLabelText("Password"), "a".repeat(129));
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("The password must have at most 128 characters.")).toBeVisible();
});

test("a field error clears once the value is fixed", async () => {
  const user = renderForm();
  await fill(user, "bad", "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign up" }));
  await screen.findByText("Enter a valid email address.");

  await user.type(screen.getByLabelText("Email"), "@example.com");

  expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
});

test("valid values are sent, and the user moves to sign in with the email", async () => {
  signUp.mockResolvedValue({ error: null });
  const user = renderForm();
  await fill(user, "ann@example.com", "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(signUp).toHaveBeenCalledWith({
    email: "ann@example.com",
    password: "long-enough-password",
    name: "",
  });
  expect(push).toHaveBeenCalledWith("/en/sign-in?email=ann%40example.com&registered=1");
});

test("submit stays disabled, and focusable, until the request ends", async () => {
  const { promise, resolve } = Promise.withResolvers<object>();
  signUp.mockReturnValue(promise);
  const user = renderForm();
  await fill(user, "ann@example.com", "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  await vi.waitFor(() => {
    expect(screen.getByRole("button", { name: "Sign up" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
  resolve({ error: null });
  await vi.waitFor(() => {
    expect(push).toHaveBeenCalledOnce();
  });
});

test("a server field error is shown next to its field", async () => {
  signUp.mockResolvedValue({ error: { status: 400, code: "INVALID_EMAIL" } });
  const user = renderForm();
  await fill(user, "ann@example.com", "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Enter a valid email address.")).toBeVisible();
  expect(push).not.toHaveBeenCalled();
});

test("a rate limit answer shows a form error", async () => {
  signUp.mockResolvedValue({ error: { status: 429 } });
  const user = renderForm();
  await fill(user, "ann@example.com", "long-enough-password");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Too many attempts. Try again in a minute.",
  );
});

test("the form is in Ukrainian for the uk locale", async () => {
  const user = renderForm("uk");
  await user.type(screen.getByLabelText("Електронна пошта"), "bad");
  await user.click(screen.getByRole("button", { name: "Зареєструватися" }));

  expect(await screen.findByText(uk.Auth.errors.emailInvalid)).toBeVisible();
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
  expect(signUp).not.toHaveBeenCalled();
});
