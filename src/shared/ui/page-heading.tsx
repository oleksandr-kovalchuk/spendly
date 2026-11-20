import type { ReactNode } from "react";

// The page's one h1, on the type scale: larger from the `lg` breakpoint
export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">{children}</h1>
  );
}
