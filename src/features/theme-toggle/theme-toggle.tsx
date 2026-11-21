"use client";

import { cva } from "class-variance-authority";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";

import { Skeleton } from "@/shared/ui/skeleton";

const THEMES = [
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
  { value: "system", icon: MonitorIcon },
] as const;

type Size = "compact" | "labeled";

const subscribe = () => () => {};

const groupVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border border-border bg-muted p-px",
  { variants: { size: { compact: "h-7", labeled: "h-10 p-0.5" } } },
);

// The radio is visually hidden, so its label is the segment: checked, focused and hovered
const optionVariants = cva(
  "inline-flex h-full cursor-pointer items-center justify-center gap-2 rounded-full font-medium text-foreground transition-colors hover:bg-accent has-checked:bg-primary has-checked:text-primary-foreground has-checked:hover:bg-primary has-focus-visible:ring-3 has-focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        compact: "w-8",
        // A narrow container (a phone's card) has room for the names only
        labeled: "px-2.5 text-sm [&_svg]:hidden @sm:px-3 @sm:[&_svg]:block",
      },
    },
  },
);

const textVariants = cva("", { variants: { size: { compact: "sr-only", labeled: "" } } });

const skeletonVariants = cva("rounded-full", {
  variants: { size: { compact: "h-7 w-26", labeled: "h-10 w-72" } },
});

// Icons only where room is short; the Settings screen shows the names too
export function ThemeToggle({ size = "compact" }: { size?: Size }) {
  const t = useTranslations("Header");
  const name = useId();
  // Until one is picked, the stored theme is the default, System
  const { theme, setTheme } = useTheme();
  // The stored theme is unknown on the server, so the options wait for hydration
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isHydrated) {
    return <Skeleton className={skeletonVariants({ size })} />;
  }

  return (
    <fieldset className={groupVariants({ size })}>
      <legend className="sr-only">{t("theme")}</legend>
      {THEMES.map(({ value, icon: Icon }) => (
        <label key={value} className={optionVariants({ size })}>
          <input
            type="radio"
            name={name}
            value={value}
            checked={theme === value}
            onChange={() => setTheme(value)}
            className="sr-only"
          />
          <Icon aria-hidden />
          <span className={textVariants({ size })}>{t(`themes.${value}`)}</span>
        </label>
      ))}
    </fieldset>
  );
}
