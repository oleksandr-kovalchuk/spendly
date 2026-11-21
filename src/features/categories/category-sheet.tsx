"use client";

import { useRef, type ReactNode } from "react";

import { ResponsiveSheet } from "@/shared/sheet/responsive-sheet";

type CategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
  title: string;
  finalFocus: () => HTMLElement | null;
  children: ReactNode;
};

// The name field takes the focus, its text selected so typing replaces a name being changed
export function CategorySheet({ children, ...sheetProps }: CategorySheetProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  function handleInitialFocus() {
    const nameInput = bodyRef.current?.querySelector("input") ?? null;
    nameInput?.select();
    return nameInput;
  }

  return (
    <ResponsiveSheet {...sheetProps} initialFocus={handleInitialFocus}>
      <div ref={bodyRef}>{children}</div>
    </ResponsiveSheet>
  );
}
