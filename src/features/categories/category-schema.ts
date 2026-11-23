import * as z from "zod/mini";

import {
  CATEGORY_ICON_KEYS,
  CATEGORY_TYPES,
  MAX_CATEGORY_NAME_LENGTH,
} from "@/shared/db/app-constants";

// Messages are codes: the forms translate them
const categoryNameSchema = z.object({
  name: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, "nameRequired"),
      z.maxLength(MAX_CATEGORY_NAME_LENGTH, "nameTooLong"),
    ),
});

// A user's own category: a default one has no icon to choose
export const ownCategorySchema = z.extend(categoryNameSchema, {
  icon: z.enum(CATEGORY_ICON_KEYS),
});

export const createCategorySchema = z.extend(ownCategorySchema, { type: z.enum(CATEGORY_TYPES) });

// No type: it never changes; the server ignores an icon sent for a default category
export const updateCategorySchema = z.extend(categoryNameSchema, {
  id: z.uuid(),
  icon: z.optional(z.enum(CATEGORY_ICON_KEYS)),
});

export const deleteCategorySchema = z.object({ id: z.uuid() });

export type OwnCategoryValues = z.infer<typeof ownCategorySchema>;
