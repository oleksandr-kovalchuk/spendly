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

// Next's redirect() throws an error whose digest holds the target
function redirectTo(url: string) {
  return { digest: expect.stringContaining(`;${url};`) };
}

async function signedIn() {
  const { id, cookie } = await createUser();
  requestHeaders.current = new Headers({ cookie });
  const categories = await listCategories();
  const food = categories.find((c) => c.defaultKey === "food" && c.type === "expense");
  if (!food) throw new Error("Default categories are missing");
  await addTransaction({ amount: "10", categoryId: food.id, date: "2026-03-10", note: "" });
  const [stored] = await listTransactions(RANGE);
  if (!stored) throw new Error("The transaction was not stored");
  return { id, cookie, stored };
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("deleteTransaction", () => {
  test("deletes the transaction of the user and returns to the list's period", async () => {
    const { stored } = await signedIn();

    await expect(
      deleteTransaction({
        id: stored.id,
        locale: "uk",
        listQuery: { period: "week", date: "2026-03-09" },
      }),
    ).rejects.toMatchObject(redirectTo("/uk/transactions?period=week&date=2026-03-09"));
    expect(await listTransactions(RANGE)).toEqual([]);
  });

  test("without a period it returns to the list's default", async () => {
    const { stored } = await signedIn();

    await expect(deleteTransaction({ id: stored.id, locale: "uk" })).rejects.toMatchObject(
      redirectTo("/uk/transactions"),
    );
  });

  test("an unknown language is rejected", async () => {
    const { stored } = await signedIn();

    // @ts-expect-error -- a client can send any string
    const result = await deleteTransaction({ id: stored.id, locale: "de" });

    expect(result.validationErrors).toBeDefined();
    expect(await listTransactions(RANGE)).toEqual([stored]);
  });

  test("a period value that is too long is rejected", async () => {
    const { stored } = await signedIn();

    const result = await deleteTransaction({
      id: stored.id,
      locale: "uk",
      listQuery: { period: "x".repeat(11) },
    });

    expect(result.validationErrors).toBeDefined();
    expect(await listTransactions(RANGE)).toEqual([stored]);
  });

  test("a second delete of the same transaction is rejected", async () => {
    const { stored } = await signedIn();
    await expect(deleteTransaction({ id: stored.id, locale: "uk" })).rejects.toMatchObject(
      redirectTo("/uk/transactions"),
    );

    const result = await deleteTransaction({ id: stored.id, locale: "uk" });

    expect(result.serverError).toBe("transactionNotFound");
  });

  test("another user's transaction is rejected and kept", async () => {
    const owner = await signedIn();
    await signedIn();

    const result = await deleteTransaction({ id: owner.stored.id, locale: "en" });

    expect(result.serverError).toBe("transactionNotFound");
    requestHeaders.current = new Headers({ cookie: owner.cookie });
    expect(await listTransactions(RANGE)).toEqual([owner.stored]);
  });

  test("an id that is not a UUID is rejected", async () => {
    await signedIn();

    const result = await deleteTransaction({ id: "not-an-id", locale: "en" });

    expect(result.validationErrors).toBeDefined();
  });

  test("rejects a request without a session", async () => {
    const result = await deleteTransaction({ id: MISSING_ID, locale: "en" });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
