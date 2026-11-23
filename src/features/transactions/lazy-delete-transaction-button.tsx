"use client";

import dynamic from "next/dynamic";

// Only a swiped-open row shows delete, so the list loads without the dialog and its action
export const LazyDeleteTransactionButton = dynamic(
  () => import("./delete-transaction-button").then((mod) => mod.DeleteTransactionButton),
  { ssr: false },
);
