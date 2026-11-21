import { cva } from "class-variance-authority";
import { getTranslations } from "next-intl/server";
import { Suspense, useId, type ReactNode } from "react";

import { DeleteAccountControl } from "@/features/auth/delete-account-control";
import { DataResetButton } from "@/features/data-reset/data-reset-button";
import { SignOutButton } from "@/features/sign-out/sign-out-button";
import { ThemeToggle } from "@/features/theme-toggle/theme-toggle";
import { requireUser } from "@/shared/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeading } from "@/shared/ui/page-heading";
import { Skeleton } from "@/shared/ui/skeleton";
import { LanguageControl } from "@/views/app-shell/language-control";
import { PageTransition } from "@/views/app-shell/page-transition";

async function AccountEmail() {
  const { email } = await requireUser();

  return <p className="font-medium break-all">{email}</p>;
}

// The danger zone is set apart by its ring and heading color, and by its name for screen readers
const cardVariants = cva("", {
  variants: { tone: { default: "", danger: "ring-2 ring-destructive" } },
});
const headingVariants = cva("", {
  variants: { tone: { default: "", danger: "text-destructive" } },
});

type Tone = "default" | "danger";

function SettingsSection({
  heading,
  description,
  tone = "default",
  children,
}: {
  heading: string;
  description?: string;
  tone?: Tone;
  children: ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Card className={cardVariants({ tone })}>
        <CardHeader>
          <CardTitle>
            <h2 id={headingId} className={headingVariants({ tone })}>
              {heading}
            </h2>
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="@container flex flex-wrap items-center justify-between gap-3">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function DangerAction({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}

export async function SettingsPage() {
  const t = await getTranslations("Settings");

  return (
    <PageTransition>
      <div className="grid stagger gap-6">
        <PageHeading>{t("heading")}</PageHeading>
        <div className="grid w-full max-w-2xl gap-4">
          <SettingsSection heading={t("theme")} description={t("themeHint")}>
            <ThemeToggle size="labeled" />
          </SettingsSection>
          <SettingsSection heading={t("language")} description={t("languageHint")}>
            <LanguageControl />
          </SettingsSection>
          <SettingsSection heading={t("account")}>
            <Suspense fallback={<Skeleton className="h-6 w-56" />}>
              <AccountEmail />
            </Suspense>
            <SignOutButton />
          </SettingsSection>
          <SettingsSection heading={t("dangerZone")} description={t("dangerHint")} tone="danger">
            <DangerAction hint={t("clearTransactionsHint")}>
              <DataResetButton kind="transactions" />
            </DangerAction>
            <DangerAction hint={t("resetDataHint")}>
              <DataResetButton kind="all" />
            </DangerAction>
            <DangerAction hint={t("deleteHint")}>
              {/* It asks the database whether the account has a password */}
              <Suspense fallback={<Skeleton className="h-9 w-44" />}>
                <DeleteAccountControl />
              </Suspense>
            </DangerAction>
          </SettingsSection>
        </div>
      </div>
    </PageTransition>
  );
}
