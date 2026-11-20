"use client";

import dynamic from "next/dynamic";

// Only a URL with a transaction to edit needs the sheet and its form, so the list loads without
// them; the sheet is never in the server HTML anyway
export const LazyEditTransactionSheet = dynamic(
  () => import("./edit-transaction-sheet").then((mod) => mod.EditTransactionSheet),
  { ssr: false },
);
