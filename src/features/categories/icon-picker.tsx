"use client";

import { useTranslations } from "next-intl";

import { CATEGORY_ICONS } from "@/shared/categories/category-look";
import { CATEGORY_ICON_KEYS, type CategoryIconKey } from "@/shared/db/app-constants";

type IconPickerProps = {
  name: string;
  value: CategoryIconKey;
  onChange: (icon: CategoryIconKey) => void;
};

// The radio is hidden; the checked tile has a ring, so color isn't the only mark
export function IconPicker({ name, value, onChange }: IconPickerProps) {
  const t = useTranslations("Categories");

  return (
    // A fieldset is as wide as its content by default, which would widen the card on small screens
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-sm font-medium">{t("form.icon")}</legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
        {CATEGORY_ICON_KEYS.map((key) => {
          const Icon = CATEGORY_ICONS[key];

          return (
            <label
              key={key}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-input bg-card transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-accent has-checked:text-accent-foreground has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring [&_svg]:size-4"
            >
              <input
                type="radio"
                name={name}
                value={key}
                checked={value === key}
                onChange={() => onChange(key)}
                className="sr-only"
              />
              <Icon aria-hidden />
              <span className="sr-only">{t(`icons.${key}`)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
