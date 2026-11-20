import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";

import { createCategory } from "./create-category.action";
import { renameCategory } from "./rename-category.action";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

async function signedIn() {
  const { id, cookie } = await createUser();
  requestHeaders.current = new Headers({ cookie });
  return id;
}

async function customNames(userId: string) {
  return (await listCategories(userId))
    .filter((category) => category.defaultKey === null)
    .map(({ type, name }) => `${type}:${name}`);
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("createCategory", () => {
  test("adds a category of the given type, with the name trimmed", async () => {
    const id = await signedIn();

    const result = await createCategory({ type: "expense", name: "  Coffee " });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();
    expect(await customNames(id)).toEqual(["expense:Coffee"]);
  });

  test.each([
    ["Coffee", "coffee"],
    ["Кава", "КАВА"],
  ])("a name differing only in case from %s is taken", async (first, second) => {
    const id = await signedIn();
    await createCategory({ type: "expense", name: first });

    const result = await createCategory({ type: "expense", name: second });

    expect(result.validationErrors?.name?._errors).toEqual(["nameTaken"]);
    expect(await customNames(id)).toEqual([`expense:${first}`]);
  });

  test("the same name is free in the other type and for another user", async () => {
    const first = await signedIn();
    await createCategory({ type: "expense", name: "Bonus" });
    await createCategory({ type: "income", name: "bonus" });
    const second = await signedIn();
    await createCategory({ type: "expense", name: "Bonus" });

    expect(await customNames(first)).toEqual(["expense:Bonus", "income:bonus"]);
    expect(await customNames(second)).toEqual(["expense:Bonus"]);
  });

  test.each(["food", "ЇЖА"])(
    "%s repeats the name of a default not renamed, in any language",
    async (name) => {
      const id = await signedIn();

      const result = await createCategory({ type: "expense", name });

      expect(result.validationErrors?.name?._errors).toEqual(["nameTaken"]);
      expect(await customNames(id)).toEqual([]);
    },
  );

  test("a default's name is free once the default is renamed, and in the other type", async () => {
    const id = await signedIn();
    const food = (await listCategories(id)).find((category) => category.defaultKey === "food");
    if (!food) throw new Error("The default Food category is missing");
    await renameCategory({ id: food.id, name: "Groceries" });

    await createCategory({ type: "expense", name: "Food" });
    await createCategory({ type: "income", name: "Transport" });

    expect(await customNames(id)).toEqual(["expense:Food", "income:Transport"]);
  });

  test.each([
    ["   ", "nameRequired"],
    ["x".repeat(41), "nameTooLong"],
  ])("rejects the name %j and adds nothing", async (name, error) => {
    const id = await signedIn();

    const result = await createCategory({ type: "income", name });

    expect(result.validationErrors?.name?._errors).toEqual([error]);
    expect(await customNames(id)).toEqual([]);
  });

  test("rejects a request without a session", async () => {
    const result = await createCategory({ type: "expense", name: "Coffee" });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
