import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";

import { addTransaction } from "./add-transaction.action";
import { deleteTransaction } from "./delete-transaction.action";
import { listTransactions } from "./transactions.dal";

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
  if (!food) throw new Error("Default categories are missing");
  await addTransaction({ amount: "10", categoryId: food.id, date: "2026-03-10", note: "" });
  const [stored] = await listTransactions(id, RANGE);
  if (!stored) throw new Error("The transaction was not stored");
  return { id, stored };
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("deleteTransaction", () => {
  test("deletes the transaction of the user", async () => {
    const { id, stored } = await signedIn();

    const result = await deleteTransaction({ id: stored.id });

    expect(result.serverError).toBeUndefined();
    expect(await listTransactions(id, RANGE)).toEqual([]);
  });

  test("a second delete of the same transaction is rejected", async () => {
    const { stored } = await signedIn();
    await deleteTransaction({ id: stored.id });

    const result = await deleteTransaction({ id: stored.id });

    expect(result.serverError).toBe("transactionNotFound");
  });

  test("another user's transaction is rejected and kept", async () => {
    const owner = await signedIn();
    await signedIn();

    const result = await deleteTransaction({ id: owner.stored.id });

    expect(result.serverError).toBe("transactionNotFound");
    expect(await listTransactions(owner.id, RANGE)).toEqual([owner.stored]);
  });

  test("an id that is not a UUID is rejected", async () => {
    await signedIn();

    const result = await deleteTransaction({ id: "not-an-id" });

    expect(result.validationErrors).toBeDefined();
  });

  test("rejects a request without a session", async () => {
    const result = await deleteTransaction({ id: MISSING_ID });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
