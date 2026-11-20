import { getLocale } from "next-intl/server";
import Link from "next/link";

import { APP_NAME } from "@/shared/lib/page-title";
import { buttonVariants } from "@/shared/ui/button";

export async function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      href={`/${await getLocale()}`}
      className={buttonVariants({
        variant: "ghost",
        size: "lg",
        className: ["text-base", className],
      })}
    >
      {APP_NAME}
    </Link>
  );
}
