// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import { RollingText } from "./rolling-text";

function strips(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(".rolling-strip")];
}

// How far a strip is moved up, in lines: the digit it shows
function shift(strip: HTMLElement | undefined) {
  return strip?.style.translate.split(" ").at(1);
}

test("has no text of its own, so the real value next to it is read once", () => {
  const { container } = render(<RollingText text="₴845.29" />);

  expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  expect(container.textContent).toBe("");
  expect(strips(container).map(shift)).toEqual(["-8lh", "-4lh", "-5lh", "-2lh", "-9lh"]);
});

test("a digit keeps its strip when the number grows, so it rolls instead of appearing", () => {
  const { container, rerender } = render(<RollingText text="₴845.29" />);
  const lastStrip = strips(container).at(-1);

  rerender(<RollingText text="₴1,845.27" />);

  expect(strips(container)).toHaveLength(6);
  expect(strips(container).at(-1)).toBe(lastStrip);
  expect(shift(lastStrip)).toBe("-7lh");
});
