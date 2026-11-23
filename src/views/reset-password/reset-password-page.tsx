import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { FieldSeparator } from "@/shared/ui/field";
import { PageHeading } from "@/shared/ui/page-heading";
import { AuthFrame } from "@/views/app-shell/auth-frame";
import { Skeleton } from "@/shared/ui/skeleton";

const searchParamsSchema = z.object({
  token: z.string().min(1).optional().catch(undefined),
  error: z.string().optional().catch(undefined),
});

async function ResetPasswordContent({ searchParams }: { searchParams: Promise<unknown> }) {
  const { token, error } = searchParamsSchema.parse(await searchParams);

  // A used or expired link brings ?error=; Next keeps the page mounted, so a new token resets it
  return <ResetPasswordForm key={token ?? ""} token={error ? undefined : token} />;
}

function FormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-14" />
      <Skeleton className="h-5" />
      <Skeleton className="h-9" />
    </div>
  );
}

export async function ResetPasswordPage({ searchParams }: { searchParams: Promise<unknown> }) {
  const [t, tForgot, locale] = await Promise.all([
    getTranslations("Auth.resetPassword"),
    getTranslations("Auth.forgotPassword"),
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
            <ResetPasswordContent searchParams={searchParams} />
          </Suspense>
          <FieldSeparator />
          <p className="text-sm">
            <Link
              href={`/${locale}/sign-in`}
              className="text-foreground underline underline-offset-4"
            >
              {tForgot("backToSignIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthFrame>
  );
}
