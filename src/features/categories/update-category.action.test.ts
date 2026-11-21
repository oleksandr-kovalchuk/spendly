import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories, type CategoryDto } from "@/shared/categories/categories.dal";
import { categories, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { createCategory } from "./create-category.action";
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
    transport: find("expense", "transport"),
    salary: find("income", "salary"),
  };
}

// One of the signed-in user's categories
async function categoryOf(categoryId: string) {
  return (await listCategories()).find((category) => category.id === categoryId);
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("updateCategory", () => {
  test("renames a default, keeping its type, and its transactions show the new name", async () => {
    const { id, food } = await signedIn();
    await db.insert(transactions).values({
      userId: id,
      categoryId: food.id,
      amountKopecks: 1_000,
      occurredOn: "2026-03-10",
    });

    const result = await updateCategory({ id: food.id, name: " Groceries " });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();
    expect(await categoryOf(food.id)).toEqual({ ...food, name: "Groceries" });
    const shown = await db
      .select({ name: categories.name })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, id));
    expect(shown).toEqual([{ name: "Groceries" }]);
  });

  test("renames a category the user created", async () => {
    await signedIn();
    await createCategory({ type: "expense", name: "Coffee", icon: "tag" });
    const coffee = (await listCategories()).find((category) => category.name === "Coffee");
    if (!coffee) throw new Error("Coffee was not created");

    await updateCategory({ id: coffee.id, name: "Tea" });

    expect(await categoryOf(coffee.id)).toEqual({ ...coffee, name: "Tea" });
  });

  test("changes the icon of a category the user created", async () => {
    await signedIn();
    await createCategory({ type: "expense", name: "Coffee", icon: "tag" });
    const coffee = (await listCategories()).find((category) => category.name === "Coffee");
    if (!coffee) throw new Error("Coffee was not created");

    const result = await updateCategory({ id: coffee.id, name: "Coffee", icon: "coffee" });

    expect(result.validationErrors).toBeUndefined();
    expect(await categoryOf(coffee.id)).toEqual({ ...coffee, icon: "coffee" });
  });

  test("a default keeps the icon of its key: an icon sent for it is ignored", async () => {
    const { food } = await signedIn();

    const result = await updateCategory({ id: food.id, name: "Groceries", icon: "coffee" });

    expect(result.serverError).toBeUndefined();
    expect(await categoryOf(food.id)).toEqual({ ...food, name: "Groceries", icon: null });
  });

  test("changing only the case of its own name is allowed", async () => {
    const { food } = await signedIn();
    await updateCategory({ id: food.id, name: "Groceries" });

    const result = await updateCategory({ id: food.id, name: "GROCERIES" });

    expect(result.validationErrors).toBeUndefined();
    expect((await categoryOf(food.id))?.name).toBe("GROCERIES");
  });

  test("a default may take its own translation", async () => {
    const { food } = await signedIn();

    const result = await updateCategory({ id: food.id, name: "Їжа" });

    expect(result.validationErrors).toBeUndefined();
    expect((await categoryOf(food.id))?.name).toBe("Їжа");
  });

  test("another category's name of the same type is taken, regardless of case", async () => {
    const { food, transport } = await signedIn();
    await updateCategory({ id: food.id, name: "Groceries" });

    const result = await updateCategory({ id: transport.id, name: "groceries" });

    expect(result.validationErrors?.name?._errors).toEqual(["nameTaken"]);
    expect(await categoryOf(transport.id)).toEqual(transport);
  });

  test("a default's name not renamed is taken", async () => {
    const { transport } = await signedIn();

    const result = await updateCategory({ id: transport.id, name: "FOOD" });

    expect(result.validationErrors?.name?._errors).toEqual(["nameTaken"]);
    expect(await categoryOf(transport.id)).toEqual(transport);
  });

  test("a name taken in the other type is free", async () => {
    const { food, salary } = await signedIn();
    await updateCategory({ id: salary.id, name: "Bonus" });

    await updateCategory({ id: food.id, name: "bonus" });

    expect((await categoryOf(food.id))?.name).toBe("bonus");
  });

  test("rejects an empty name and changes nothing", async () => {
    const { food } = await signedIn();

    const result = await updateCategory({ id: food.id, name: "  " });

    expect(result.validationErrors?.name?._errors).toEqual(["nameRequired"]);
    expect(await categoryOf(food.id)).toEqual(food);
  });

  test("another user's category is rejected and not changed", async () => {
    const owner = await signedIn();
    await signedIn();

    const result = await updateCategory({ id: owner.food.id, name: "Mine" });

    expect(result.serverError).toBe("categoryNotFound");
    requestHeaders.current = new Headers({ cookie: owner.cookie });
    expect(await categoryOf(owner.food.id)).toEqual(owner.food);
  });

  test("a missing category is rejected", async () => {
    await signedIn();

    const result = await updateCategory({ id: MISSING_ID, name: "Mine" });

    expect(result.serverError).toBe("categoryNotFound");
  });

  test("rejects a request without a session", async () => {
    const result = await updateCategory({ id: MISSING_ID, name: "Mine" });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
