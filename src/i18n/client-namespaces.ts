import type { Messages } from "next-intl";

// Only these namespaces go to the browser
export const CLIENT_NAMESPACES = [
  "Header",
  "Auth",
  "Error",
  "Categories",
  "Transactions",
  "Periods",
  "DataReset",
  "Toast",
  "Sheet",
  "Stats",
] as const satisfies readonly (keyof Messages)[];
