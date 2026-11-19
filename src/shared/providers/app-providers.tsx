"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { TimeZoneSync } from "./time-zone-sync";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TimeZoneSync />
      {children}
    </ThemeProvider>
  );
}
