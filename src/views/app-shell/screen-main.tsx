"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

// Next leaves focus on the clicked link after a client-side navigation, so a keyboard or
// screen reader user would start from the navigation again: focus moves to the new screen.
// Only a new path counts; a period or an edit link changes the search params, not the screen.
export function ScreenMain({ className, children }: { className: string; children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const shownPathname = useRef(pathname);

  useEffect(() => {
    if (shownPathname.current === pathname) return;
    shownPathname.current = pathname;
    // Next has already scrolled to the top
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <main ref={mainRef} id="main-content" tabIndex={-1} className={className}>
      {children}
    </main>
  );
}
