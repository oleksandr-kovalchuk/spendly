"use server";

import { refresh } from "next/cache";
import { returnServerError, returnValidationErrors } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { updateCategory as storeUpdate } from "./categories.dal";
import { updateCategorySchema } from "./category-schema";

export const updateCategory = authedAction
  .inputSchema(updateCategorySchema)
  .action(async ({ parsedInput: { id, ...input }, ctx }) => {
    const result = await storeUpdate(ctx.user.id, id, input);
    if (!result.isSaved) {
      if (result.error === "categoryNotFound") returnServerError(result.error);
      returnValidationErrors(updateCategorySchema, { name: { _errors: [result.error] } });
    }

    refresh();
  });
