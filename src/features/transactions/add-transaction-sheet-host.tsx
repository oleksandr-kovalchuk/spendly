"use client";

import dynamic from "next/dynamic";

import { useAddTransaction } from "./add-transaction-context";
import type { CategoryOption } from "./category-option";

// Loads on the first open: the budget check counts every script the page loads, even after paint
const AddTransactionSheet = dynamic(
  () => import("./add-transaction-sheet").then((mod) => mod.AddTransactionSheet),
  { ssr: false },
);

type AddTransactionSheetHostProps = { today: string; categories: CategoryOption[] };

// Focus returns to the opener, even where a tap doesn't focus it (Safari). If it's gone (an empty
// state's), focus goes to the screen here: returned, the sheet would pass it to its first control
export function AddTransactionSheetHost({ today, categories }: AddTransactionSheetHostProps) {
  const { isOpen, opener, onOpenChange } = useAddTransaction();

  function handleFinalFocus() {
    if (opener?.element.isConnected === true) return opener.element;
    document.querySelector("main")?.focus({ preventScroll: true });
    return null;
  }

  if (opener === null) return null;

  return (
    <AddTransactionSheet
      open={isOpen}
      onOpenChange={onOpenChange}
      finalFocus={handleFinalFocus}
      today={today}
      categories={categories}
    />
  );
}
