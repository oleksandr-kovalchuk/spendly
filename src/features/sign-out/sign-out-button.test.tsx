// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { SignOutButton } from "./sign-out-button";

const { signOut, assign } = vi.hoisted(() => ({ signOut: vi.fn(), assign: vi.fn() }));

vi.mock("@/shared/auth/auth-client", () => ({ authClient: { signOut } }));

beforeEach(() => {
  signOut.mockReset();
  assign.mockReset();
  vi.stubGlobal("location", { assign });
});

function renderButton() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SignOutButton />
    </NextIntlClientProvider>,
  );

  return userEvent.setup();
}

test("signing out ends with a full page load of the sign-in page", async () => {
  signOut.mockResolvedValue({ error: null });
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Sign out" }));

  expect(signOut).toHaveBeenCalledOnce();
  expect(assign).toHaveBeenCalledWith("/en/sign-in");
});

test("the button stays disabled, and focusable, until the request ends", async () => {
  const { promise, resolve } = Promise.withResolvers<object>();
  signOut.mockReturnValue(promise);
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Sign out" }));

  await vi.waitFor(() => {
    expect(screen.getByRole("button", { name: "Sign out" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
  resolve({ error: null });
  await vi.waitFor(() => {
    expect(assign).toHaveBeenCalledWith("/en/sign-in");
  });
});

test("a failed sign out stays on the page and says so", async () => {
  signOut.mockResolvedValue({ error: { status: 500 } });
  const user = renderButton();
  await user.click(screen.getByRole("button", { name: "Sign out" }));

  expect(await screen.findByRole("button", { name: "Sign out failed, try again" })).toBeEnabled();
  expect(assign).not.toHaveBeenCalled();
});

test("the icon-only button is named and shows the failure as text", async () => {
  signOut.mockResolvedValue({ error: { status: 500 } });
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SignOutButton isIconOnly />
    </NextIntlClientProvider>,
  );
  await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));

  expect(await screen.findByRole("button")).toHaveTextContent("Sign out failed, try again");
});
