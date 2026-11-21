// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { PeriodSwipeArea } from "./period-swipe-area";
import { PERIOD_SWIPE_EVENT } from "./period-swipe-event";

const onSwipe = vi.fn<(step: unknown) => void>();

function handleSwipe(event: Event) {
  onSwipe(event instanceof CustomEvent ? event.detail : undefined);
}

beforeEach(() => {
  onSwipe.mockReset();
  window.addEventListener(PERIOD_SWIPE_EVENT, handleSwipe);
});

afterEach(() => {
  window.removeEventListener(PERIOD_SWIPE_EVENT, handleSwipe);
});

function swipe(from: { x: number; y: number }, to: { x: number; y: number }) {
  const content = screen.getByText("Content");
  fireEvent.touchStart(content, { touches: [{ clientX: from.x, clientY: from.y }] });
  fireEvent.touchEnd(content, { changedTouches: [{ clientX: to.x, clientY: to.y }] });
}

test("a swipe left asks for the next period and a swipe right for the previous one", () => {
  render(
    <PeriodSwipeArea>
      <p>Content</p>
    </PeriodSwipeArea>,
  );

  swipe({ x: 300, y: 100 }, { x: 200, y: 110 });
  swipe({ x: 100, y: 100 }, { x: 220, y: 90 });

  expect(onSwipe.mock.calls).toEqual([[1], [-1]]);
});

test("a short or mostly vertical swipe leaves the period", () => {
  render(
    <PeriodSwipeArea>
      <p>Content</p>
    </PeriodSwipeArea>,
  );

  swipe({ x: 300, y: 100 }, { x: 260, y: 100 });
  swipe({ x: 300, y: 100 }, { x: 200, y: 300 });

  expect(onSwipe).not.toHaveBeenCalled();
});
