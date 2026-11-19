import { describe, expect, test } from "vitest";

import { transactionSchema } from "./transaction-schema";

const VALID = {
  type: "expense",
  amount: "12,50",
  categoryId: "0198a8c0-0000-7000-8000-000000000000",
  date: "2026-03-10",
  note: "lunch",
};

function errorsOf(input: unknown) {
  const result = transactionSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => [i.path.join("."), i.message]);
}

describe("transactionSchema", () => {
  test("accepts a valid transaction and trims the note", () => {
    const result = transactionSchema.parse({ ...VALID, note: "  lunch " });

    expect(result.note).toBe("lunch");
  });

  test("reports each invalid field with a code", () => {
    expect(
      errorsOf({
        ...VALID,
        amount: "",
        categoryId: "x",
        date: "10.03.2026",
        note: "n".repeat(201),
      }),
    ).toEqual([
      ["amount", "amountRequired"],
      ["categoryId", "categoryInvalid"],
      ["date", "dateInvalid"],
      ["note", "noteTooLong"],
    ]);
  });

  test("refuses an unknown type", () => {
    expect(errorsOf({ ...VALID, type: "transfer" })).toHaveLength(1);
  });
});
