import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignUpForm } from "@/features/auth/sign-up-form";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { isGoogleSignInEnabled } from "@/shared/auth/auth";
import { getCurrentUser } from "@/shared/auth/session";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { FieldSeparator } from "@/shared/ui/field";
import { PageHeading } from "@/shared/ui/page-heading";
import { AuthFrame } from "@/views/app-shell/auth-frame";

async function SignUpContent() {
  const user = await getCurrentUser();
  if (user) redirect(`/${await getLocale()}`);

  return <SignUpForm />;
}

function FormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
      <Skeleton className="h-9" />
    </div>
  );
}

export async function SignUpPage() {
  const [t, tGoogle, locale] = await Promise.all([
    getTranslations("Auth.signUp"),
    getTranslations("Auth.google"),
    getLocale(),
  ]);

  return (
    <AuthFrame>
      <Card>
        <CardHeader>
          <PageHeading>{t("heading")}</PageHeading>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Suspense fallback={<FormSkeleton />}>
            <SignUpContent />
          </Suspense>
          {isGoogleSignInEnabled ? (
            <>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {tGoogle("or")}
              </FieldSeparator>
              <GoogleSignInButton />
            </>
          ) : null}
          <FieldSeparator />
          <p className="text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link
              href={`/${locale}/sign-in`}
              className="text-foreground underline underline-offset-4"
            >
              {t("signInLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthFrame>
  );
}
