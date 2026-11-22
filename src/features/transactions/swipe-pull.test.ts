import { expect, test } from "vitest";

import { ACTION_WIDTH, armedActionOf, OPEN_DISTANCE, pullOf } from "./swipe-pull";

test("follows the finger up to the action's width", () => {
  expect(pullOf(40)).toBe(40);
  expect(pullOf(-ACTION_WIDTH)).toBe(-ACTION_WIDTH);
});

test("resists more the farther the row is pulled past the action", () => {
  const near = pullOf(ACTION_WIDTH + 20) - ACTION_WIDTH;
  const far = pullOf(ACTION_WIDTH + 40) - pullOf(ACTION_WIDTH + 20);

  expect(near).toBeGreaterThan(0);
  expect(near).toBeLessThan(20);
  expect(far).toBeLessThan(near);
  expect(pullOf(-(ACTION_WIDTH + 20))).toBe(-pullOf(ACTION_WIDTH + 20));
});

test("never goes past one and a half action widths", () => {
  expect(pullOf(10_000)).toBeLessThan(ACTION_WIDTH * 1.5);
  expect(pullOf(-10_000)).toBeGreaterThan(-ACTION_WIDTH * 1.5);
});

test("arms edit at the action's width and delete at the open distance", () => {
  expect(armedActionOf(ACTION_WIDTH - 1)).toBeNull();
  expect(armedActionOf(ACTION_WIDTH)).toBe("edit");
  expect(armedActionOf(-OPEN_DISTANCE + 1)).toBeNull();
  expect(armedActionOf(-OPEN_DISTANCE)).toBe("delete");
});
