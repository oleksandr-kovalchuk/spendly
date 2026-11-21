import { posix } from "node:path";
import { expect, test } from "vitest";

import { CLIENT_NAMESPACES } from "./client-namespaces";

const sources = import.meta.glob<string>(["/src/**/*.{ts,tsx}", "!/src/**/*.test.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const USE_CLIENT = /^["']use client["']/m;
// Static imports and re-exports (`import type` is erased) and next/dynamic's `import()`
const IMPORTS =
  /(?:import|export)\s+(type\s+)?[^"';]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const TRANSLATIONS = /useTranslations\(\s*["']([^."']+)/g;

function resolveImport(from: string, specifier: string) {
  let base: string;
  if (specifier.startsWith("@/")) base = `/src/${specifier.slice(2)}`;
  else if (specifier.startsWith(".")) base = posix.join(posix.dirname(from), specifier);
  else return undefined;

  return [base, `${base}.ts`, `${base}.tsx`].find((path) => path in sources);
}

// Every module a client component imports, directly or not, renders in the browser too
function clientNamespaces() {
  const queue = Object.keys(sources).filter((path) => USE_CLIENT.test(sources[path] ?? ""));
  const visited = new Set(queue);
  const namespaces = new Set<string>();

  for (const path of queue) {
    const source = sources[path] ?? "";
    for (const [, namespace] of source.matchAll(TRANSLATIONS)) {
      if (namespace) namespaces.add(namespace);
    }
    for (const [, typeOnly, staticSpecifier, dynamicSpecifier] of source.matchAll(IMPORTS)) {
      const specifier = staticSpecifier ?? dynamicSpecifier;
      const resolved = typeOnly || !specifier ? undefined : resolveImport(path, specifier);
      if (resolved && !visited.has(resolved)) {
        visited.add(resolved);
        queue.push(resolved);
      }
    }
  }

  return namespaces;
}

test("the browser gets exactly the message namespaces client components translate with", () => {
  expect(CLIENT_NAMESPACES.toSorted()).toEqual([...clientNamespaces()].toSorted());
});
