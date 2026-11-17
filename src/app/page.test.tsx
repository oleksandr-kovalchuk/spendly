// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "./page";

test("links to the Next.js docs", () => {
  render(<Home />);

  expect(screen.getByRole("link", { name: "Next.js docs" })).toHaveAttribute(
    "href",
    "https://nextjs.org/docs",
  );
});
