"use client";

import { LogOutIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { authClient } from "@/shared/auth/auth-client";
import { Button } from "@/shared/ui/button";

type Status = "idle" | "pending" | "failed";

// Icon only fits the phone top bar; a failure still shows its text
export function SignOutButton({ isIconOnly = false }: { isIconOnly?: boolean }) {
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

  const label = status === "failed" ? t("signOutFailed") : t("signOut");
  const isLabelHidden = isIconOnly && status !== "failed";

  return (
    <Button
      type="button"
      variant="ghost"
      size={isLabelHidden ? "icon-lg" : "lg"}
      aria-label={isLabelHidden ? label : undefined}
      disabled={status === "pending"}
      focusableWhenDisabled
      onClick={handleSignOut}
    >
      <LogOutIcon aria-hidden className="rtl:rotate-180" />
      {isLabelHidden ? null : label}
    </Button>
  );
}
