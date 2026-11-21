"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { AccountAvatar } from "./account-avatar";
import { closeOnLink } from "./close-on-link";

export function AccountPopover({ email, children }: { email: string; children: ReactNode }) {
  const t = useTranslations("Header");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="flex h-13 w-full items-center gap-3 rounded-xl px-2.5 text-start text-sm font-medium transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring aria-expanded:bg-sidebar-accent">
        <AccountAvatar email={email} />
        <span className="min-w-0 flex-1 truncate">
          <span className="sr-only">{`${t("account")}: `}</span>
          {email}
        </span>
        <ChevronsUpDownIcon aria-hidden className="size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        aria-label={t("account")}
        className="p-2"
        onClickCapture={closeOnLink(() => setIsOpen(false))}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
