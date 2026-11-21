import type { Messages } from "next-intl";

// The message namespaces client components translate with; only these go to the browser
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
