import { expect, test } from "vitest";

import { stripLocale } from "./strip-locale";

test.each([
  ["/en", ""],
  ["/uk", ""],
  ["/uk/categories", "/categories"],
  ["/en/a/b", "/a/b"],
  ["/ukulele", "/ukulele"],
  ["/", "/"],
])("%s becomes %j", (pathname, expected) => {
  expect(stripLocale(pathname)).toBe(expected);
});
