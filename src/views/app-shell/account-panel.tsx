import { cn } from "cn";
import { SettingsIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import { SignOutButton } from "@/features/sign-out/sign-out-button";
import { ThemeToggle } from "@/features/theme-toggle/theme-toggle";
import { buttonVariants } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

import { AccountAvatar } from "./account-avatar";
import { LanguageControl } from "./language-control";

// The visible row names repeat the groups' legends, so screen readers skip them
export async function AccountPanel({ email }: { email: string }) {
  const [t, locale] = await Promise.all([getTranslations("Header"), getLocale()]);

  return (
    <div className="grid justify-items-start gap-1">
      <div className="flex max-w-full items-center gap-3 p-2">
        <AccountAvatar email={email} size="lg" />
        <p className="min-w-0 truncate font-medium">{email}</p>
      </div>
      <Separator />
      <Link
        href={`/${locale}/settings`}
        className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "justify-start")}
      >
        <SettingsIcon aria-hidden />
        {t("settings")}
      </Link>
      <Separator />
      <div className="flex min-h-10 items-center justify-between gap-3 justify-self-stretch ps-2.5">
        <span aria-hidden="true">{t("theme")}</span>
        <ThemeToggle />
      </div>
      <div className="flex min-h-10 items-center justify-between gap-3 justify-self-stretch ps-2.5">
        <span aria-hidden="true">{t("language")}</span>
        <LanguageControl />
      </div>
      <Separator />
      <SignOutButton />
    </div>
  );
}
