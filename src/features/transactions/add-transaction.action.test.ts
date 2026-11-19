import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";

import { addTransaction } from "./add-transaction.action";
import { listTransactions } from "./transactions.dal";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const RANGE = { from: "2026-03-01", to: "2026-03-31" };

async function signedIn() {
  const { id, cookie } = await createUser();
  requestHeaders.current = new Headers({ cookie });
  const categories = await listCategories(id);
  const food = categories.find((c) => c.defaultKey === "food" && c.type === "expense");
  if (!food) throw new Error("Default categories are missing");
  return { id, categoryId: food.id };
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("addTransaction", () => {
  test("stores the amount in kopecks and an empty note as none", async () => {
    const { id, categoryId } = await signedIn();

    const result = await addTransaction({
      amount: "125,50",
      categoryId,
      date: "2026-03-10",
      note: "  ",
    });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();
    const [stored] = await listTransactions(id, RANGE);
    expect(stored).toMatchObject({ amountKopecks: 12_550, note: null, type: "expense" });
  });

  test.each([
    ["", "amountRequired"],
    ["abc", "amountInvalid"],
    ["0", "amountInvalid"],
    ["1000000000", "amountTooLarge"],
  ])("rejects the amount %j", async (amount, code) => {
    const { id, categoryId } = await signedIn();

    const result = await addTransaction({ amount, categoryId, date: "2026-03-10", note: "" });

    expect(result.validationErrors?.amount?._errors).toEqual([code]);
    expect(await listTransactions(id, RANGE)).toEqual([]);
  });

  test("rejects an impossible date and a note over 200 characters", async () => {
    const { categoryId } = await signedIn();

    const result = await addTransaction({
      amount: "1",
      categoryId,
      date: "2026-02-30",
      note: "x".repeat(201),
    });

    expect(result.validationErrors?.date?._errors).toEqual(["dateInvalid"]);
    expect(result.validationErrors?.note?._errors).toEqual(["noteTooLong"]);
  });

  test("rejects another user's category and stores nothing", async () => {
    const owner = await signedIn();
    const other = await signedIn();

    const result = await addTransaction({
      amount: "10",
      categoryId: owner.categoryId,
      date: "2026-03-10",
      note: "",
    });

    expect(result.serverError).toBe("categoryNotFound");
    expect(await listTransactions(other.id, RANGE)).toEqual([]);
    expect(await listTransactions(owner.id, RANGE)).toEqual([]);
  });

  test("rejects a request without a session", async () => {
    const result = await addTransaction({
      amount: "10",
      categoryId: "0198a8c0-0000-7000-8000-000000000000",
      date: "2026-03-10",
      note: "",
    });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
