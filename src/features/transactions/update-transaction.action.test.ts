import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";

import { addTransaction } from "./add-transaction.action";
import { listTransactions } from "./transactions.dal";
import { updateTransaction } from "./update-transaction.action";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const RANGE = { from: "2026-03-01", to: "2026-03-31" };
const MISSING_ID = "0198a8c0-0000-7000-8000-000000000000";

async function signedIn() {
  const { id, cookie } = await createUser();
  requestHeaders.current = new Headers({ cookie });
  const categories = await listCategories(id);
  const food = categories.find((c) => c.defaultKey === "food" && c.type === "expense");
  const salary = categories.find((c) => c.defaultKey === "salary" && c.type === "income");
  if (!food || !salary) throw new Error("Default categories are missing");
  await addTransaction({ amount: "10", categoryId: food.id, date: "2026-03-10", note: "lunch" });
  const [stored] = await listTransactions(id, RANGE);
  if (!stored) throw new Error("The transaction was not stored");
  return { id, food, salary, stored };
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("updateTransaction", () => {
  test("changes the amount and the date, so the transaction moves to the new day", async () => {
    const { id, food, stored } = await signedIn();

    const result = await updateTransaction({
      id: stored.id,
      amount: "99,90",
      categoryId: food.id,
      date: "2026-03-20",
      note: "  ",
    });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();
    expect(await listTransactions(id, RANGE)).toEqual([
      { ...stored, amountKopecks: 9_990, occurredOn: "2026-03-20", note: null },
    ]);
  });

  test("changing the category changes the type", async () => {
    const { id, salary, stored } = await signedIn();

    await updateTransaction({
      id: stored.id,
      amount: "10",
      categoryId: salary.id,
      date: "2026-03-10",
      note: "",
    });

    expect((await listTransactions(id, RANGE))[0]).toMatchObject({ type: "income" });
  });

  test("rejects an invalid amount and changes nothing", async () => {
    const { id, food, stored } = await signedIn();

    const result = await updateTransaction({
      id: stored.id,
      amount: "0",
      categoryId: food.id,
      date: "2026-03-10",
      note: "",
    });

    expect(result.validationErrors?.amount?._errors).toEqual(["amountInvalid"]);
    expect(await listTransactions(id, RANGE)).toEqual([stored]);
  });

  test("another user's transaction is rejected and not changed", async () => {
    const owner = await signedIn();
    const other = await signedIn();

    const result = await updateTransaction({
      id: owner.stored.id,
      amount: "1",
      categoryId: other.food.id,
      date: "2026-03-11",
      note: "",
    });

    expect(result.serverError).toBe("transactionNotFound");
    expect(await listTransactions(owner.id, RANGE)).toEqual([owner.stored]);
  });

  test("another user's category is rejected and nothing changes", async () => {
    const owner = await signedIn();
    const other = await signedIn();

    const result = await updateTransaction({
      id: other.stored.id,
      amount: "1",
      categoryId: owner.food.id,
      date: "2026-03-11",
      note: "",
    });

    expect(result.serverError).toBe("categoryNotFound");
    expect(await listTransactions(other.id, RANGE)).toEqual([other.stored]);
  });

  test("a missing transaction is rejected", async () => {
    const { food } = await signedIn();

    const result = await updateTransaction({
      id: MISSING_ID,
      amount: "1",
      categoryId: food.id,
      date: "2026-03-11",
      note: "",
    });

    expect(result.serverError).toBe("transactionNotFound");
  });

  test("rejects a request without a session", async () => {
    const result = await updateTransaction({
      id: MISSING_ID,
      amount: "10",
      categoryId: MISSING_ID,
      date: "2026-03-10",
      note: "",
    });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
