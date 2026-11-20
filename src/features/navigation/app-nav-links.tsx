"use client";

import { cva } from "class-variance-authority";
import { LayoutDashboardIcon, ReceiptTextIcon, TagsIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import { Fragment, Suspense, type ReactNode } from "react";

// `segment` is the path after the locale; screens with a period keep it between each other
const SCREENS = [
  { name: "overview", segment: "", icon: LayoutDashboardIcon, hasPeriod: true },
  { name: "transactions", segment: "transactions", icon: ReceiptTextIcon, hasPeriod: true },
  { name: "categories", segment: "categories", icon: TagsIcon, hasPeriod: false },
] as const;
// Raw strings, copied as they are: the screen validates them and falls back to the current month
const periodParsers = { period: parseAsString, date: parseAsString };

type Layout = "bar" | "sidebar";
type NavListProps = {
  layout: Layout;
  // A control in the middle slot of the bar, within thumb reach (the Add button)
  action?: ReactNode;
  currentSegment?: string;
  periodQuery?: Record<string, string>;
};

// The action goes after the second screen
const ACTION_INDEX = 2;

const listVariants = cva("", {
  variants: {
    layout: { bar: "grid auto-cols-fr grid-flow-col items-center", sidebar: "grid gap-1" },
  },
});

// The current screen is bold and has an indicator bar, so it isn't marked by color alone
const linkVariants = cva(
  "relative flex items-center outline-none transition-colors before:absolute before:rounded-full focus-visible:ring-3 focus-visible:ring-ring aria-[current=page]:font-semibold [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      layout: {
        bar: "h-16 flex-col justify-center gap-1 text-xs text-muted-foreground before:inset-x-6 before:top-0 before:h-1 hover:text-foreground focus-visible:ring-inset aria-[current=page]:text-foreground aria-[current=page]:before:bg-primary",
        sidebar:
          "h-10 gap-3 rounded-lg px-3 text-sm before:inset-y-2 before:start-0 before:w-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:before:bg-sidebar-primary",
      },
    },
  },
);

function NavList({ layout, action, currentSegment, periodQuery }: NavListProps) {
  const t = useTranslations("Header.screens");
  const locale = useLocale();

  return (
    <ul className={listVariants({ layout })}>
      {SCREENS.map(({ name, segment, icon: Icon, hasPeriod }, index) => (
        <Fragment key={name}>
          {action !== undefined && index === ACTION_INDEX ? (
            <li className="flex justify-center">{action}</li>
          ) : null}
          <li>
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
            </Link>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}

function CurrentNavList({ layout, action }: { layout: Layout; action?: ReactNode }) {
  const pathname = usePathname();
  // nuqs, not `useSearchParams`: the period control's update shows here at once, while Next's
  // search params change only when the server render for the new period ends
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

// The search params are only known at request time, so the shell shows plain links until then
export function AppNavLinks({ layout, action }: { layout: Layout; action?: ReactNode }) {
  return (
    <Suspense fallback={<NavList layout={layout} action={action} />}>
      <CurrentNavList layout={layout} action={action} />
    </Suspense>
  );
}
