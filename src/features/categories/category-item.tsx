"use client";

import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import { CategoryIcon } from "@/shared/categories/category-icon";
import type { CategoryIconKey, DefaultCategoryKey } from "@/shared/db/app-constants";
import { Button } from "@/shared/ui/button";

import { DeleteCategoryButton } from "./delete-category-button";

const EditCategorySheet = dynamic(
  () => import("./edit-category-sheet").then((mod) => mod.EditCategorySheet),
  { ssr: false },
);

type CategoryItemProps = {
  id: string;
  label: string;
  defaultKey: DefaultCategoryKey | null;
  icon: CategoryIconKey | null;
  transactionCount: number;
  otherLabel: string;
};

export function CategoryItem({
  id,
  label,
  defaultKey,
  icon,
  transactionCount,
  otherLabel,
}: CategoryItemProps) {
  const t = useTranslations("Categories");
  const [isEditing, setIsEditing] = useState(false);
  // The name the sheet opened with: a save's refresh brings the new one while the sheet closes
  const [editedLabel, setEditedLabel] = useState(label);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  // A default category only gets a new name
  const action = defaultKey === null ? "edit" : "rename";

  function handleEdit() {
    setEditedLabel(label);
    setIsEditing(true);
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <CategoryIcon category={{ id, defaultKey, icon }} size="sm" />
      <span className="min-w-0 flex-1 font-medium wrap-break-word">{label}</span>
      {/* Icons, not words: a long name and two worded buttons don't fit a small screen */}
      <div className="flex gap-1">
        <Button
          ref={editButtonRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t(`list.${action}`, { category: label })}
          onClick={handleEdit}
        >
          <PencilIcon aria-hidden />
        </Button>
        <DeleteCategoryButton
          id={id}
          label={label}
          transactionCount={transactionCount}
          isOther={defaultKey === "other"}
          otherLabel={otherLabel}
        />
      </div>
      {/* Closing returns focus to Rename or Edit, also where a tap doesn't focus it (Safari) */}
      <EditCategorySheet
        id={id}
        label={editedLabel}
        defaultKey={defaultKey}
        icon={icon}
        open={isEditing}
        onOpenChange={setIsEditing}
        finalFocus={() => editButtonRef.current}
      />
    </li>
  );
}
