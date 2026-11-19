import { describe, expect, test } from "vitest";

import { amountInputOf, parseAmount } from "./amount";

describe("parseAmount", () => {
  test.each([
    ["125.50", 12_550],
    ["125,5", 12_550],
    ["1234.5", 123_450],
    ["0.01", 1],
    ["7", 700],
    [" 42 ", 4_200],
    ["999999999.99", 99_999_999_999],
    ["0.29", 29],
    ["19.99", 1_999],
  ])("%j is %i kopecks", (input, kopecks) => {
    expect(parseAmount(input)).toEqual({ kopecks });
  });

  test.each(["", "   "])("%j is required", (input) => {
    expect(parseAmount(input)).toEqual({ error: "amountRequired" });
  });

  test.each([
    "0",
    "0.00",
    "-5",
    "-0.5",
    "+5",
    "1.234",
    "1,234.50",
    "1 000",
    "abc",
    "1e3",
    "5.",
    ".5",
    "NaN",
  ])("%j is invalid", (input) => {
    expect(parseAmount(input)).toEqual({ error: "amountInvalid" });
  });

  test.each(["1000000000", "1000000000.00", "99999999999999999999"])("%j is too large", (input) => {
    expect(parseAmount(input)).toEqual({ error: "amountTooLarge" });
  });

  test("more than 2 decimals is invalid even just above the maximum", () => {
    expect(parseAmount("999999999.995")).toEqual({ error: "amountInvalid" });
  });
});

describe("amountInputOf", () => {
  test.each([
    [12_550, "125.50"],
    [1, "0.01"],
    [700, "7.00"],
    [99_999_999_999, "999999999.99"],
  ])("%i kopecks is %j", (kopecks, text) => {
    expect(amountInputOf(kopecks)).toBe(text);
  });

  test.each([12_550, 1, 29, 99_999_999_999])("parses back to %i kopecks", (kopecks) => {
    expect(parseAmount(amountInputOf(kopecks))).toEqual({ kopecks });
  });
});
