import { expect, test } from "vitest";

import { defaultKeysNamed } from "./default-names";

test.each([
  ["Food", ["food"]],
  ["food", ["food"]],
  ["ЇЖА", ["food"]],
  ["інше", ["other"]],
  ["Coffee", []],
])("%s names the defaults %j", (name, keys) => {
  expect(defaultKeysNamed(name)).toEqual(keys);
});
