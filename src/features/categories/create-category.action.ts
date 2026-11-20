"use server";

import { refresh } from "next/cache";
import { returnValidationErrors } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { insertCategory } from "./categories.dal";
import { createCategorySchema } from "./category-schema";

export const createCategory = authedAction
  .inputSchema(createCategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await insertCategory(ctx.user.id, parsedInput);
    if (!result.isSaved) {
      returnValidationErrors(createCategorySchema, { name: { _errors: [result.error] } });
    }

    // The pages read uncached data, so the router has to fetch it again
    refresh();
  });
