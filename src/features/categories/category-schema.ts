// The mini build: the forms load it in the browser, where the full one adds ~30 KB
import * as z from "zod/mini";

import { CATEGORY_TYPES, MAX_CATEGORY_NAME_LENGTH } from "@/shared/db/app-constants";

// Messages are codes: the forms translate them
export const categoryNameSchema = z.object({
  name: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, "nameRequired"),
      z.maxLength(MAX_CATEGORY_NAME_LENGTH, "nameTooLong"),
    ),
});

export const createCategorySchema = z.extend(categoryNameSchema, { type: z.enum(CATEGORY_TYPES) });

// No type: a category keeps the type it was created with
export const renameCategorySchema = z.extend(categoryNameSchema, { id: z.uuid() });

export type CategoryNameValues = z.infer<typeof categoryNameSchema>;
