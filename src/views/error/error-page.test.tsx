// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { ErrorPage } from "./error-page";

test("retries when the user presses the button", async () => {
  const retry = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ErrorPage retry={retry} />
    </NextIntlClientProvider>,
  );

  expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));

  expect(retry).toHaveBeenCalledOnce();
});
