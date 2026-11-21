import { expect, test } from "vitest";

import sitemap from "./sitemap";

const ORIGIN = "http://localhost:3000";

test("lists the public pages in every language, each with its translations", () => {
  const entries = sitemap();

  expect(entries.map(({ url }) => url)).toEqual([
    `${ORIGIN}/en/sign-in`,
    `${ORIGIN}/uk/sign-in`,
    `${ORIGIN}/en/sign-up`,
    `${ORIGIN}/uk/sign-up`,
    `${ORIGIN}/en/privacy`,
    `${ORIGIN}/uk/privacy`,
  ]);
  expect(entries[0]?.alternates?.languages).toEqual({
    en: `${ORIGIN}/en/sign-in`,
    uk: `${ORIGIN}/uk/sign-in`,
  });
});
