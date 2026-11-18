"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { authClient } from "@/shared/auth/auth-client";
import { Button } from "@/shared/ui/button";

type Status = "idle" | "pending" | "failed";

export function SignOutButton() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSignOut() {
    setStatus("pending");
    const { error } = await authClient.signOut();
    if (error) {
      setStatus("failed");
      return;
    }

    // A full page load drops everything the previous user left in the client
    window.location.assign(`/${locale}/sign-in`);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      disabled={status === "pending"}
      onClick={handleSignOut}
    >
      {status === "failed" ? t("signOutFailed") : t("signOut")}
    </Button>
  );
}
