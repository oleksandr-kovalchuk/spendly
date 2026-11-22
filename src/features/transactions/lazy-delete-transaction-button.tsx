"use client";

import dynamic from "next/dynamic";

// Only a row swiped open shows its delete button, so the list loads without the confirmation
// dialog and its action; while it loads, the trash under the row looks the same
export const LazyDeleteTransactionButton = dynamic(
  () => import("./delete-transaction-button").then((mod) => mod.DeleteTransactionButton),
  { ssr: false },
);
