"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/shared/ui/button";

const THEMES = [
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
  { value: "system", icon: MonitorIcon },
] as const;

const subscribe = () => () => {};

export function ThemeToggle() {
  const t = useTranslations("Header.theme");
  const { theme, setTheme } = useTheme();
  // The stored theme is unknown on the server, so the pressed state waits for hydration
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <fieldset className="flex items-center">
      <legend className="sr-only">{t("label")}</legend>
      {THEMES.map(({ value, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant={isHydrated && theme === value ? "secondary" : "ghost"}
          size="icon-lg"
          aria-label={t(value)}
          aria-pressed={isHydrated ? theme === value : false}
          onClick={() => setTheme(value)}
        >
          <Icon />
        </Button>
      ))}
    </fieldset>
  );
}
