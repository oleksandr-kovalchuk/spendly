// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { StatsError } from "./stats-error";

test("tells the summary failed and retries on request", async () => {
  const retry = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <StatsError retry={retry} />
    </NextIntlClientProvider>,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(en.Stats.loadFailed);
  await userEvent.click(screen.getByRole("button", { name: en.Stats.retry }));

  expect(retry).toHaveBeenCalledOnce();
});
