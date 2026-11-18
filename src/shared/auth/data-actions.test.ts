import { describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "./authed-action";

vi.mock("next/headers", () => ({ headers: () => Promise.resolve(new Headers()) }));

// Server Actions live in `*.action.ts` files, all built on `authedAction`
const actionModules = import.meta.glob<Record<string, unknown>>("/src/**/*.action.ts");
const sourceFiles = import.meta.glob<string>("/src/**/*.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("data actions", () => {
  test("every file with Server Actions is a `*.action.ts` file", () => {
    const strays = Object.entries(sourceFiles)
      .filter(
        ([path, source]) => /^["']use server["']/m.test(source) && !path.endsWith(".action.ts"),
      )
      .map(([path]) => path);

    expect(strays).toEqual([]);
  });

  test.each(Object.entries(actionModules))(
    "every action in %s rejects a request without a session",
    async (_path, load) => {
      const actions = Object.values(await load()).filter(
        (value): value is () => Promise<{ serverError?: string }> => typeof value === "function",
      );

      for (const action of actions) {
        expect((await action()).serverError).toBe(UNAUTHORIZED_ERROR);
      }
    },
  );
});
