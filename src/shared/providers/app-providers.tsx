"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

import { TimeZoneSync } from "./time-zone-sync";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TimeZoneSync />
      <NuqsAdapter>{children}</NuqsAdapter>
    </ThemeProvider>
  );
}
