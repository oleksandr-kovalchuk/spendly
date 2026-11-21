import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories, type CategoryDto } from "@/shared/categories/categories.dal";
import { transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { countTransactionsByCategory } from "./categories.dal";
import { createCategory } from "./create-category.action";
import { deleteCategory } from "./delete-category.action";
import { updateCategory } from "./update-category.action";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const MISSING_ID = "0198a8c0-0000-7000-8000-000000000000";

async function signedIn() {
  const { id, cookie } = await createUser();
  requestHeaders.current = new Headers({ cookie });
  const categories = await listCategories();
  function find(type: CategoryDto["type"], defaultKey: CategoryDto["defaultKey"]) {
    const found = categories.find((c) => c.type === type && c.defaultKey === defaultKey);
    if (!found) throw new Error(`The default ${type} ${defaultKey} is missing`);
    return found;
  }
  return {
    id,
    cookie,
    food: find("expense", "food"),
    expenseOther: find("expense", "other"),
    salary: find("income", "salary"),
    incomeOther: find("income", "other"),
  };
}

function addTransaction(userId: string, categoryId: string) {
  return db
    .insert(transactions)
    .values({ userId, categoryId, amountKopecks: 1_000, occurredOn: "2026-03-10" });
}

// The signed-in user's categories
async function categoryIds() {
  return (await listCategories()).map((category) => category.id);
}

async function transactionCategoriesOf(userId: string) {
  const rows = await db
    .select({ categoryId: transactions.categoryId })
    .from(transactions)
    .where(eq(transactions.userId, userId));
  return rows.map((row) => row.categoryId);
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("deleteCategory", () => {
  test("deletes a category without transactions", async () => {
    const { food } = await signedIn();

    const result = await deleteCategory({ id: food.id });

    expect(result.serverError).toBeUndefined();
    expect(await categoryIds()).not.toContain(food.id);
  });

  test("deletes a category the user created", async () => {
    await signedIn();
    await createCategory({ type: "expense", name: "Coffee", icon: "coffee" });
    const coffee = (await listCategories()).find((category) => category.name === "Coffee");
    if (!coffee) throw new Error("Coffee was not created");

    await deleteCategory({ id: coffee.id });

    expect(await categoryIds()).not.toContain(coffee.id);
  });

  test("moves the category's transactions to Other of its type", async () => {
    const { id, food, expenseOther, salary } = await signedIn();
    await addTransaction(id, food.id);
    await addTransaction(id, food.id);
    await addTransaction(id, salary.id);

    await deleteCategory({ id: food.id });

    expect((await transactionCategoriesOf(id)).toSorted()).toEqual(
      [expenseOther.id, expenseOther.id, salary.id].toSorted(),
    );
  });

  test("moves the transactions to Other under the name the user gave it", async () => {
    const { id, food, expenseOther } = await signedIn();
    await updateCategory({ id: expenseOther.id, name: "Misc" });
    await addTransaction(id, food.id);

    await deleteCategory({ id: food.id });

    expect(await transactionCategoriesOf(id)).toEqual([expenseOther.id]);
    expect((await listCategories()).find((c) => c.id === expenseOther.id)?.name).toBe("Misc");
  });

  test("creates Other again when the user deleted it and the transactions need it", async () => {
    const { id, food, expenseOther } = await signedIn();
    await deleteCategory({ id: expenseOther.id });
    await addTransaction(id, food.id);

    const result = await deleteCategory({ id: food.id });

    expect(result.serverError).toBeUndefined();
    const other = (await listCategories()).find(
      (category) => category.type === "expense" && category.defaultKey === "other",
    );
    expect(other).toMatchObject({ name: null, icon: null });
    expect(await transactionCategoriesOf(id)).toEqual([other?.id]);
  });

  test("deleting the last category of a type without transactions doesn't create Other", async () => {
    const { salary, incomeOther } = await signedIn();
    const gifts = (await listCategories()).find((category) => category.defaultKey === "gifts");
    if (!gifts) throw new Error("The default Gifts category is missing");

    for (const category of [salary, gifts, incomeOther]) await deleteCategory({ id: category.id });

    const incomeCategories = (await listCategories()).filter((c) => c.type === "income");
    expect(incomeCategories).toEqual([]);
  });

  test("refuses to delete Other while it has transactions", async () => {
    const { id, expenseOther } = await signedIn();
    await addTransaction(id, expenseOther.id);

    const result = await deleteCategory({ id: expenseOther.id });

    expect(result.serverError).toBe("otherHasTransactions");
    expect(await categoryIds()).toContain(expenseOther.id);
    expect(await transactionCategoriesOf(id)).toEqual([expenseOther.id]);
  });

  test("the user keeps no categories once every one is deleted, and the defaults don't return", async () => {
    await signedIn();

    const errors = [];
    for (const categoryId of await categoryIds()) {
      errors.push((await deleteCategory({ id: categoryId })).serverError);
    }

    expect(errors.filter(Boolean)).toEqual([]);
    expect(await listCategories()).toEqual([]);
  });

  test("another user's category is rejected and not deleted", async () => {
    const owner = await signedIn();
    await addTransaction(owner.id, owner.food.id);
    await signedIn();

    const result = await deleteCategory({ id: owner.food.id });

    expect(result.serverError).toBe("categoryNotFound");
    requestHeaders.current = new Headers({ cookie: owner.cookie });
    expect(await categoryIds()).toContain(owner.food.id);
    expect(await transactionCategoriesOf(owner.id)).toEqual([owner.food.id]);
  });

  test("a missing category is rejected", async () => {
    await signedIn();

    const result = await deleteCategory({ id: MISSING_ID });

    expect(result.serverError).toBe("categoryNotFound");
  });

  test("rejects a request without a session", async () => {
    const result = await deleteCategory({ id: MISSING_ID });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});

describe("countTransactionsByCategory", () => {
  test("counts each category's transactions, of this user only", async () => {
    const owner = await signedIn();
    const other = await signedIn();
    await addTransaction(owner.id, owner.food.id);
    await addTransaction(owner.id, owner.food.id);
    await addTransaction(owner.id, owner.salary.id);
    await addTransaction(other.id, other.food.id);
    requestHeaders.current = new Headers({ cookie: owner.cookie });

    const counts = await countTransactionsByCategory();

    expect(Object.fromEntries(counts)).toEqual({ [owner.food.id]: 2, [owner.salary.id]: 1 });
  });
});
