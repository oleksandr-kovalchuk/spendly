"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

// Next leaves focus on the clicked link, so focus moves to the new screen; only a new path
// counts, not a period or an edit link (search params)
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
