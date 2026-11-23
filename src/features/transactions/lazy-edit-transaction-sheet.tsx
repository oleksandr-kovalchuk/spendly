"use client";

import dynamic from "next/dynamic";

// Only a URL with `edit` needs the sheet and its form; it's never in the server HTML
export const LazyEditTransactionSheet = dynamic(
  () => import("./edit-transaction-sheet").then((mod) => mod.EditTransactionSheet),
  { ssr: false },
);
