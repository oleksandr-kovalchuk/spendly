import { ViewTransition, type ReactNode } from "react";

// Each screen wraps its own content: the layout stays mounted, so it never enters or exits
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
