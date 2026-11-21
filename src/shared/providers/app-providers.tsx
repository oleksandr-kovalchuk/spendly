"use client";

import { useTranslations } from "next-intl";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

import { Toaster } from "@/shared/ui/toast";

import { TimeZoneSync } from "./time-zone-sync";

export function AppProviders({ children }: { children: ReactNode }) {
  const t = useTranslations("Toast");

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TimeZoneSync />
      <NuqsAdapter>{children}</NuqsAdapter>
      <Toaster regionLabel={t("region")} closeLabel={t("close")} />
    </ThemeProvider>
  );
}
