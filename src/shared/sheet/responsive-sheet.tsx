"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";

import { useIsDesktop } from "./use-is-desktop";

type ResponsiveSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  title: string;
  // Where focus goes when the sheet opens; without it, to its first control, the close button
  initialFocus?: () => HTMLElement | null;
  // Where focus goes when the sheet closes; without it, to the element focused before it opened
  finalFocus?: () => HTMLElement | null;
  children: ReactNode;
};

// A bottom sheet with swipe to close on a phone, a dialog from the `lg` breakpoint
export function ResponsiveSheet({
  open,
  onOpenChange,
  onOpenChangeComplete,
  title,
  initialFocus,
  finalFocus,
  children,
}: ResponsiveSheetProps) {
  const t = useTranslations("Sheet");
  const isDesktop = useIsDesktop();
  const closeButton = (
    <Button variant="ghost" size="icon-lg" className="shrink-0" aria-label={t("close")} />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
        <DialogContent
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-md"
        >
          <DialogHeader className="flex-row items-center justify-between gap-2 p-4 pb-2">
            <DialogTitle className="text-lg leading-tight">{title}</DialogTitle>
            <DialogClose render={closeButton}>
              <XIcon aria-hidden />
            </DialogClose>
          </DialogHeader>
          <div className="grid gap-4 p-4 pt-2">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      showSwipeHandle
    >
      <DrawerContent initialFocus={initialFocus} finalFocus={finalFocus}>
        <DrawerHeader className="flex-row items-center justify-between gap-2 pb-2 text-start">
          <DrawerTitle className="text-lg leading-tight">{title}</DrawerTitle>
          <DrawerClose render={closeButton}>
            <XIcon aria-hidden />
          </DrawerClose>
        </DrawerHeader>
        <div className="grid gap-4 overflow-y-auto p-4 pt-2">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
