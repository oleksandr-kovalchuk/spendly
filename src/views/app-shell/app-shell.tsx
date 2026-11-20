import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AppNavLinks } from "@/features/navigation/app-nav-links";
import { SignOutButton } from "@/features/sign-out/sign-out-button";
import { ThemeToggle } from "@/features/theme-toggle/theme-toggle";

import { HomeLink } from "./home-link";
import { LanguageControl } from "./language-control";

// Signed-in screens: below lg a top bar and a fixed bottom navigation, from lg a sidebar.
// Only one of each pair is displayed, so screen readers find one banner and one navigation.
export async function AppShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Header");

  return (
    <div className="flex flex-1">
      <header className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 border-e border-sidebar-border bg-sidebar p-4 text-sidebar-foreground app-nav-anchor lg:flex">
        <HomeLink className="self-start" />
        <nav aria-label={t("nav")}>
          <AppNavLinks layout="sidebar" />
        </nav>
        <div className="mt-auto grid justify-items-start gap-2 border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-1">
            <LanguageControl />
            <ThemeToggle />
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border lg:hidden">
          <div className="flex flex-wrap items-center gap-1 px-4 py-2">
            <HomeLink />
            <div className="ms-auto flex items-center">
              <LanguageControl />
              <ThemeToggle />
              <SignOutButton isIconOnly />
            </div>
          </div>
        </header>
        {/* The bottom padding keeps the end of the content above the bottom navigation */}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-8 pb-24 outline-none lg:px-8 lg:pb-8"
        >
          {children}
        </main>
      </div>
      <nav
        aria-label={t("nav")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background app-nav-anchor lg:hidden"
      >
        <AppNavLinks layout="bar" />
      </nav>
    </div>
  );
}
