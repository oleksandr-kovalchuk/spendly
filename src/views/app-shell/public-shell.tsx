import { Suspense, type ReactNode } from "react";

import { ThemeToggle } from "@/features/theme-toggle/theme-toggle";

import { Copyright } from "./copyright";
import { HomeLink } from "./home-link";
import { LanguageControl } from "./language-control";
import { PrivacyLink } from "./privacy-link";
import { SessionSignOut } from "./session-sign-out";

// Pages narrow their own content: the sign-in pages use the full width, the policy a reading column
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 lg:px-8">
          <HomeLink />
          <div className="ms-auto flex items-center gap-2">
            {/* Keep this runtime part: with a fully static shell, browsers get the 404 page without
                its title (Next drops the not-found metadata); the 404 E2E test checks the title */}
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
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-2 pb-10 outline-none lg:px-8 lg:pt-4"
      >
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-4 lg:px-8">
          <PrivacyLink />
          <Copyright />
        </div>
      </footer>
    </>
  );
}
