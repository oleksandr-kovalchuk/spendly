import { Suspense, type ReactNode } from "react";

import { ThemeToggle } from "@/features/theme-toggle/theme-toggle";

import { HomeLink } from "./home-link";
import { LanguageControl } from "./language-control";
import { SessionSignOut } from "./session-sign-out";

// Signed-out pages: a top bar without app navigation, and the content in one readable column
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <HomeLink />
          <div className="ms-auto flex items-center gap-1">
            <Suspense fallback={null}>
              <SessionSignOut />
            </Suspense>
            <LanguageControl />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 outline-none"
      >
        {children}
      </main>
    </>
  );
}
