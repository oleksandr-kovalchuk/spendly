"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import { CategoryIcon } from "@/shared/categories/category-icon";
import { FieldError } from "@/shared/ui/field";

import type { CategoryOption } from "./category-option";

type CategoryTilesProps = {
  legend: string;
  categories: CategoryOption[];
  name: string;
  value: string;
  error: string | undefined;
  onChange: (categoryId: string) => void;
  onBlur: () => void;
};

// The radio is visually hidden, its tile is what a user taps; the checked tile has a ring and
// bold text, so it isn't marked by color alone
export function CategoryTiles({
  legend,
  categories,
  name,
  value,
  error,
  onChange,
  onBlur,
}: CategoryTilesProps) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const errorId = useId();

  // The user may have deleted every category of this type
  if (categories.length === 0) {
    return (
      <div className="grid gap-1 text-sm">
        <p className="font-medium">{legend}</p>
        <p>{t("form.noCategories")}</p>
        <Link
          href={`/${locale}/categories`}
          className="inline-flex min-h-6 items-center justify-self-start text-foreground underline underline-offset-4"
        >
          {t("form.addCategory")}
        </Link>
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    );
  }

  return (
    // A radio group, unlike a plain group, can be marked invalid
    <fieldset
      role="radiogroup"
      className="grid gap-2"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-3 gap-2 @md:grid-cols-4">
        {categories.map((category) => (
          <label
            key={category.id}
            className="relative flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-input bg-card p-2 text-center text-xs wrap-break-word transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-accent has-checked:font-semibold has-checked:text-accent-foreground has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name={name}
              value={category.id}
              checked={value === category.id}
              onChange={() => onChange(category.id)}
              onBlur={onBlur}
              className="sr-only"
            />
            <CategoryIcon category={category} size="sm" />
            {category.label}
          </label>
        ))}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
