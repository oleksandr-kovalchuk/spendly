import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignUpForm } from "@/features/auth/sign-up-form";
import { getCurrentUser } from "@/shared/auth/session";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { PageHeading } from "@/shared/ui/page-heading";

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
  const t = await getTranslations("Auth.signUp");

  return (
    <Card className="mx-auto w-full max-w-sm text-base">
      <CardHeader>
        <PageHeading>{t("heading")}</PageHeading>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<FormSkeleton />}>
          <SignUpContent />
        </Suspense>
      </CardContent>
    </Card>
  );
}
