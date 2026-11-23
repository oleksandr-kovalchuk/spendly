import { expect, test } from "vitest";

import { listUrlOf } from "./list-url";

test.each([
  ["overview", "/uk"],
  ["transactions", "/uk/transactions"],
] as const)("the %s list is at %s", (screen, path) => {
  expect(listUrlOf("uk", screen, {})).toBe(path);
});

test("the list's URL carries its query", () => {
  expect(listUrlOf("en", "overview", { period: "week", edit: "42" })).toBe(
    "/en?period=week&edit=42",
  );
});
