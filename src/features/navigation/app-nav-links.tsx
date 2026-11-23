"use client";

import { cva } from "class-variance-authority";
import { LayoutDashboardIcon, ReceiptTextIcon, TagsIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import { Fragment, Suspense, ViewTransition, type ReactNode } from "react";

const SCREENS = [
  { name: "overview", segment: "", icon: LayoutDashboardIcon, hasPeriod: true },
  { name: "transactions", segment: "transactions", icon: ReceiptTextIcon, hasPeriod: true },
  { name: "categories", segment: "categories", icon: TagsIcon, hasPeriod: false },
] as const;
const periodParsers = { period: parseAsString, date: parseAsString };

type Layout = "bar" | "sidebar";
type NavListProps = {
  layout: Layout;
  action?: ReactNode;
  currentSegment?: string;
  periodQuery?: Record<string, string>;
};

const ACTION_INDEX = 2;

const listVariants = cva("", {
  variants: { layout: { bar: "flex items-center", sidebar: "grid gap-1" } },
});

const itemVariants = cva("", {
  variants: { layout: { bar: "min-w-0 flex-1", sidebar: "" } },
});

const linkVariants = cva(
  "relative flex items-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring aria-[current=page]:font-semibold [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      layout: {
        bar: "h-16 flex-col justify-center gap-1 rounded-3xl text-xs text-muted-foreground hover:text-foreground focus-visible:ring-inset aria-[current=page]:text-primary",
        sidebar:
          "h-11 gap-3 rounded-xl px-3 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground",
      },
    },
  },
);

const indicatorVariants = cva("absolute rounded-full", {
  variants: {
    layout: {
      bar: "inset-x-0 top-1.5 mx-auto h-1 w-6 bg-primary",
      sidebar: "inset-y-2.5 start-0 w-1 bg-sidebar-primary",
    },
  },
});

function NavList({ layout, action, currentSegment, periodQuery }: NavListProps) {
  const t = useTranslations("Header.screens");
  const locale = useLocale();

  return (
    <ul className={listVariants({ layout })}>
      {SCREENS.map(({ name, segment, icon: Icon, hasPeriod }, index) => (
        <Fragment key={name}>
          {action !== undefined && index === ACTION_INDEX ? (
            <li className="flex shrink-0 justify-center px-1">{action}</li>
          ) : null}
          <li className={itemVariants({ layout })}>
            <Link
              href={{
                pathname: segment ? `/${locale}/${segment}` : `/${locale}`,
                query: hasPeriod ? periodQuery : undefined,
              }}
              aria-current={segment === currentSegment ? "page" : undefined}
              className={linkVariants({ layout })}
            >
              <Icon aria-hidden />
              {t(name)}
              {segment === currentSegment ? (
                <ViewTransition name={`nav-indicator-${layout}`} share="nav-slide" default="none">
                  <span aria-hidden="true" className={indicatorVariants({ layout })} />
                </ViewTransition>
              ) : null}
            </Link>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}

function CurrentNavList({ layout, action }: { layout: Layout; action?: ReactNode }) {
  const pathname = usePathname();
  const [period] = useQueryStates(periodParsers);
  const [, , currentSegment = ""] = pathname.split("/");
  const periodQuery = Object.fromEntries(
    Object.entries(period).flatMap(([key, value]) => (value === null ? [] : [[key, value]])),
  );

  return (
    <NavList
      layout={layout}
      action={action}
      currentSegment={currentSegment}
      periodQuery={periodQuery}
    />
  );
}

export function AppNavLinks({ layout, action }: { layout: Layout; action?: ReactNode }) {
  return (
    <Suspense fallback={<NavList layout={layout} action={action} />}>
      <CurrentNavList layout={layout} action={action} />
    </Suspense>
  );
}
