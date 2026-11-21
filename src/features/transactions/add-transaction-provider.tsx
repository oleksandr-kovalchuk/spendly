"use client";

import { useState, type ReactNode } from "react";

import { AddTransactionContext, type AddFormOpener } from "./add-transaction-context";

// One add form for every Add button; it stays open when the button that opened it goes away
export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [opener, setOpener] = useState<AddFormOpener | null>(null);

  function handleOpen(next: AddFormOpener) {
    setOpener(next);
    setIsOpen(true);
  }

  return (
    <AddTransactionContext value={{ isOpen, opener, open: handleOpen, onOpenChange: setIsOpen }}>
      {children}
    </AddTransactionContext>
  );
}
