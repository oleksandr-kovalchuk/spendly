import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";

import { createCategory } from "./create-category.action";
import { updateCategory } from "./update-category.action";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

// Returns the session cookie, to sign the user back in after another one
async function signedIn() {
  const { cookie } = await createUser();
  requestHeaders.current = new Headers({ cookie });
  return cookie;
}

async function customNames() {
  return (await listCategories())
    .filter((category) => category.defaultKey === null)
    .map(({ type, name }) => `${type}:${name}`);
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("createCategory", () => {
  test("adds a category of the given type, with the name trimmed", async () => {
    await signedIn();

    const result = await createCategory({ type: "expense", name: "  Coffee ", icon: "tag" });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();
    expect(await customNames()).toEqual(["expense:Coffee"]);
  });

  test.each([
    ["Coffee", "coffee"],
    ["Кава", "КАВА"],
  ])("a name differing only in case from %s is taken", async (first, second) => {
    await signedIn();
    await createCategory({ type: "expense", name: first, icon: "tag" });

    const result = await createCategory({ type: "expense", name: second, icon: "tag" });

    expect(result.validationErrors?.name?._errors).toEqual(["nameTaken"]);
    expect(await customNames()).toEqual([`expense:${first}`]);
  });

  test("the same name is free in the other type and for another user", async () => {
    const first = await signedIn();
    await createCategory({ type: "expense", name: "Bonus", icon: "tag" });
    await createCategory({ type: "income", name: "bonus", icon: "tag" });
    await signedIn();
    await createCategory({ type: "expense", name: "Bonus", icon: "tag" });

    expect(await customNames()).toEqual(["expense:Bonus"]);
    requestHeaders.current = new Headers({ cookie: first });
    expect(await customNames()).toEqual(["expense:Bonus", "income:bonus"]);
  });

  test.each(["food", "ЇЖА"])(
    "%s repeats the name of a default not renamed, in any language",
    async (name) => {
      await signedIn();

      const result = await createCategory({ type: "expense", name, icon: "tag" });

      expect(result.validationErrors?.name?._errors).toEqual(["nameTaken"]);
      expect(await customNames()).toEqual([]);
    },
  );

  test("a default's name is free once the default is renamed, and in the other type", async () => {
    await signedIn();
    const food = (await listCategories()).find((category) => category.defaultKey === "food");
    if (!food) throw new Error("The default Food category is missing");
    await updateCategory({ id: food.id, name: "Groceries" });

    await createCategory({ type: "expense", name: "Food", icon: "tag" });
    await createCategory({ type: "income", name: "Transport", icon: "tag" });

    expect(await customNames()).toEqual(["expense:Food", "income:Transport"]);
  });

  test.each([
    ["   ", "nameRequired"],
    ["x".repeat(41), "nameTooLong"],
  ])("rejects the name %j and adds nothing", async (name, error) => {
    await signedIn();

    const result = await createCategory({ type: "income", name, icon: "tag" });

    expect(result.validationErrors?.name?._errors).toEqual([error]);
    expect(await customNames()).toEqual([]);
  });

  test("stores the chosen icon", async () => {
    await signedIn();

    await createCategory({ type: "expense", name: "Coffee", icon: "coffee" });

    const coffee = (await listCategories()).find((category) => category.name === "Coffee");
    expect(coffee?.icon).toBe("coffee");
  });

  test("rejects an icon outside the set and adds nothing", async () => {
    await signedIn();

    // @ts-expect-error: a client can send any value
    const result = await createCategory({ type: "expense", name: "Coffee", icon: "rocket" });

    expect(result.validationErrors?.icon).toBeDefined();
    expect(await customNames()).toEqual([]);
  });

  test("rejects a request without a session", async () => {
    const result = await createCategory({ type: "expense", name: "Coffee", icon: "tag" });

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
