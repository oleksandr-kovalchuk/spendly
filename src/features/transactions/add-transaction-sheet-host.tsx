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

// Closing returns focus to the button that opened the form, also where a tap doesn't focus it
// (Safari). An empty state's button is gone once the list has an item, so focus goes to the screen;
// the sheet would move it on to the screen's first control, so it's moved here and not returned.
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
