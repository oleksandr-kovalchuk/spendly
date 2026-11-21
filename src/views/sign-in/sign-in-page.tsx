import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { googleErrorOf } from "@/features/auth/auth-errors";
import { SignInForm, type SignInNotice } from "@/features/auth/sign-in-form";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { isGoogleSignInEnabled } from "@/shared/auth/auth";
import { getCurrentUser } from "@/shared/auth/session";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { FieldSeparator } from "@/shared/ui/field";
import { PageHeading } from "@/shared/ui/page-heading";
import { AuthFrame } from "@/views/app-shell/auth-frame";

const searchParamsSchema = z.object({
  email: z.email().optional().catch(undefined),
  registered: z.literal("1").optional().catch(undefined),
  passwordReset: z.literal("1").optional().catch(undefined),
  accountDeleted: z.literal("1").optional().catch(undefined),
  error: z.string().optional().catch(undefined),
});

type SignInSearchParams = z.infer<typeof searchParamsSchema>;

function noticeOf({
  registered,
  passwordReset,
  accountDeleted,
}: SignInSearchParams): SignInNotice | undefined {
  if (registered) return "registered";
  if (passwordReset) return "passwordReset";
  if (accountDeleted) return "accountDeleted";
  return undefined;
}

async function SignInContent({ searchParams }: { searchParams: Promise<unknown> }) {
  const [user, locale, params] = await Promise.all([getCurrentUser(), getLocale(), searchParams]);
  if (user) redirect(`/${locale}`);

  const parsed = searchParamsSchema.parse(params);

  // Next keeps a visited sign-in page mounted, so a new email needs a fresh form
  return (
    <SignInForm
      key={parsed.email ?? ""}
      defaultEmail={parsed.email}
      notice={noticeOf(parsed)}
      googleError={googleErrorOf(parsed.error)}
    />
  );
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

export async function SignInPage({ searchParams }: { searchParams: Promise<unknown> }) {
  const [t, tGoogle, locale] = await Promise.all([
    getTranslations("Auth.signIn"),
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
            <SignInContent searchParams={searchParams} />
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
            {t("noAccount")}{" "}
            <Link
              href={`/${locale}/sign-up`}
              className="text-foreground underline underline-offset-4"
            >
              {t("signUpLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthFrame>
  );
}
