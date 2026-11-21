"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer";

import { AccountAvatar } from "./account-avatar";
import { closeOnLink } from "./close-on-link";

// The phone's top bar has room for the avatar only; its panel slides up within thumb reach
export function AccountSheet({ email, children }: { email: string; children: ReactNode }) {
  const t = useTranslations("Header");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} showSwipeHandle>
      <DrawerTrigger
        render={<Button variant="ghost" size="icon-lg" className="rounded-full" />}
        aria-label={t("account")}
      >
        <AccountAvatar email={email} />
      </DrawerTrigger>
      <DrawerContent onClickCapture={closeOnLink(() => setIsOpen(false))}>
        <DrawerTitle className="sr-only">{t("account")}</DrawerTitle>
        <div className="p-3 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
