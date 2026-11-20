import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { SignInForm } from "@/features/auth/sign-in-form";
import { getCurrentUser } from "@/shared/auth/session";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { PageHeading } from "@/shared/ui/page-heading";

const searchParamsSchema = z.object({
  email: z.email().optional().catch(undefined),
  registered: z.literal("1").optional().catch(undefined),
});

async function SignInContent({ searchParams }: { searchParams: Promise<unknown> }) {
  const [user, locale, params] = await Promise.all([getCurrentUser(), getLocale(), searchParams]);
  if (user) redirect(`/${locale}`);

  const { email, registered } = searchParamsSchema.parse(params);

  // Next keeps a visited sign-in page mounted, so a new email needs a fresh form
  return (
    <SignInForm key={email ?? ""} defaultEmail={email} hasJustRegistered={registered === "1"} />
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
  const t = await getTranslations("Auth.signIn");

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <PageHeading>{t("heading")}</PageHeading>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<FormSkeleton />}>
          <SignInContent searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
