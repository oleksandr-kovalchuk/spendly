import { cva } from "class-variance-authority";
import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { AppNavLinks } from "@/features/navigation/app-nav-links";
import { AddTransactionProvider } from "@/features/transactions/add-transaction-provider";
import { requireUser } from "@/shared/auth/session";
import { Skeleton } from "@/shared/ui/skeleton";

import { AccountPanel } from "./account-panel";
import { AccountPopover } from "./account-popover";
import { AccountSheet } from "./account-sheet";
import { AddTransactionControl, AddTransactionSheetSection } from "./add-transaction-control";
import { HomeLink } from "./home-link";
import { ScreenMain } from "./screen-main";

type Placement = "sidebar" | "bar";

const accountSkeletonVariants = cva("", {
  variants: { placement: { sidebar: "h-13 w-full rounded-xl", bar: "size-9 rounded-full" } },
});

async function Account({ placement }: { placement: Placement }) {
  const { email } = await requireUser();
  const panel = <AccountPanel email={email} />;

  if (placement === "bar") return <AccountSheet email={email}>{panel}</AccountSheet>;
  return <AccountPopover email={email}>{panel}</AccountPopover>;
}

// The button shows the account's email, request data
function AccountControl({ placement }: { placement: Placement }) {
  return (
    <Suspense fallback={<Skeleton className={accountSkeletonVariants({ placement })} />}>
      <Account placement={placement} />
    </Suspense>
  );
}

// Only the phone's or the desktop's bar and navigation is displayed, so screen readers find one
// banner and one navigation
export async function AppShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Header");

  return (
    <AddTransactionProvider>
      <div className="flex flex-1">
        <header className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 border-e border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground app-nav-anchor lg:flex">
          <HomeLink className="self-start" />
          <AddTransactionControl placement="sidebar" />
          <nav aria-label={t("nav")}>
            <AppNavLinks layout="sidebar" />
          </nav>
          <div className="mt-auto border-t border-sidebar-border pt-3">
            <AccountControl placement="sidebar" />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="lg:hidden">
            <div className="flex items-center gap-1 px-4 py-2">
              <HomeLink />
              <div className="ms-auto">
                <AccountControl placement="bar" />
              </div>
            </div>
          </header>
          {/* The bottom padding keeps the end of the content above the floating bottom navigation */}
          <ScreenMain className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-4 pb-28 outline-none lg:px-8 lg:pt-8 lg:pb-8">
            {children}
          </ScreenMain>
        </div>
        {/* Nearly opaque, without a costly backdrop blur: its labels keep their contrast over the
            gradient card scrolling under it */}
        <nav
          aria-label={t("nav")}
          className="fixed inset-x-3 bottom-3 z-40 rounded-3xl bg-card/95 shadow-soft app-nav-anchor lg:hidden"
        >
          <AppNavLinks layout="bar" action={<AddTransactionControl placement="bar" />} />
        </nav>
      </div>
      <AddTransactionSheetSection />
    </AddTransactionProvider>
  );
}
