// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { GoogleSignInButton } from "./google-sign-in-button";

const { assign, signInSocial } = vi.hoisted(() => ({ assign: vi.fn(), signInSocial: vi.fn() }));

vi.mock("@/shared/auth/auth-client", () => ({ authClient: { signIn: { social: signInSocial } } }));

const GOOGLE_PAGE = "https://accounts.google.com/o/oauth2/v2/auth?client_id=x";

beforeEach(() => {
  assign.mockReset();
  signInSocial.mockReset();
  vi.stubGlobal("location", { assign });
});

function renderButton() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <GoogleSignInButton />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("opens Google's page, coming back to the main page or, on failure, to sign-in", async () => {
  signInSocial.mockResolvedValue({ error: null, url: GOOGLE_PAGE });
  const user = renderButton();

  await user.click(screen.getByRole("button", { name: "Continue with Google" }));

  expect(signInSocial).toHaveBeenCalledWith({
    provider: "google",
    callbackURL: "/en",
    errorCallbackURL: "/en/sign-in",
  });
  expect(assign).toHaveBeenCalledWith(GOOGLE_PAGE);
});

test("stays focusable but unavailable while Google's page opens", async () => {
  signInSocial.mockReturnValue(new Promise(() => undefined));
  const user = renderButton();
  const button = screen.getByRole("button", { name: "Continue with Google" });

  await user.click(button);

  expect(button).toHaveAttribute("aria-disabled", "true");
  expect(button).toHaveFocus();
});

test.each([
  ["a rate limit answer", { status: 429 }, "Too many attempts. Try again in a minute."],
  ["any other failure", { status: 500 }, "Something went wrong. Try again."],
])("%s shows its message and stays on the page", async (_name, error, message) => {
  signInSocial.mockResolvedValue({ error });
  const user = renderButton();

  await user.click(screen.getByRole("button", { name: "Continue with Google" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  expect(assign).not.toHaveBeenCalled();
});
