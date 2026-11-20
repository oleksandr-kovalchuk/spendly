import { z } from "zod";

import { CATEGORY_TYPES, MAX_CATEGORY_NAME_LENGTH } from "@/shared/db/app-schema";

// Messages are codes: the forms translate them
export const categoryNameSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(MAX_CATEGORY_NAME_LENGTH, "nameTooLong"),
});

export const createCategorySchema = categoryNameSchema.extend({ type: z.enum(CATEGORY_TYPES) });

// No type: a category keeps the type it was created with
export const renameCategorySchema = categoryNameSchema.extend({ id: z.uuid() });

export type CategoryNameValues = z.infer<typeof categoryNameSchema>;
