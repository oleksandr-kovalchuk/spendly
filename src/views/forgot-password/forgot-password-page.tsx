import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { getCurrentUser } from "@/shared/auth/session";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { FieldSeparator } from "@/shared/ui/field";
import { PageHeading } from "@/shared/ui/page-heading";
import { AuthFrame } from "@/views/app-shell/auth-frame";
import { Skeleton } from "@/shared/ui/skeleton";

async function ForgotPasswordContent() {
  const user = await getCurrentUser();
  if (user) redirect(`/${await getLocale()}`);

  return <ForgotPasswordForm />;
}

function FormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-10" />
      <Skeleton className="h-14" />
      <Skeleton className="h-9" />
    </div>
  );
}

export async function ForgotPasswordPage() {
  const [t, locale] = await Promise.all([getTranslations("Auth.forgotPassword"), getLocale()]);

  return (
    <AuthFrame>
      <Card>
        <CardHeader>
          <PageHeading>{t("heading")}</PageHeading>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Suspense fallback={<FormSkeleton />}>
            <ForgotPasswordContent />
          </Suspense>
          <FieldSeparator />
          <p className="text-sm">
            <Link
              href={`/${locale}/sign-in`}
              className="text-foreground underline underline-offset-4"
            >
              {t("backToSignIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthFrame>
  );
}
