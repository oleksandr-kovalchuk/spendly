"use client";

import { createContext, use } from "react";

// The button that opened the add form: its id marks it as expanded, its element gets focus back
export type AddFormOpener = { id: string; element: HTMLElement };

type AddTransactionState = {
  isOpen: boolean;
  opener: AddFormOpener | null;
  open: (opener: AddFormOpener) => void;
  onOpenChange: (open: boolean) => void;
};

export const AddTransactionContext = createContext<AddTransactionState | null>(null);

export function useAddTransaction() {
  const state = use(AddTransactionContext);
  if (!state) throw new Error("useAddTransaction needs an AddTransactionProvider");
  return state;
}
