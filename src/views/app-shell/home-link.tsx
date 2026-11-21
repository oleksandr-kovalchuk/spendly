import { cn } from "cn";
import { getLocale } from "next-intl/server";
import Link from "next/link";

import { APP_NAME } from "@/shared/lib/page-title";
import { buttonVariants } from "@/shared/ui/button";

import { LogoMark } from "./logo-mark";

export async function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      href={`/${await getLocale()}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "lg" }),
        "gap-2 text-base font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark className="size-6" />
      {APP_NAME}
    </Link>
  );
}
