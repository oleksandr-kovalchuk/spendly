"use server";

import { refresh } from "next/cache";
import { returnServerError, returnValidationErrors } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { renameCategory as storeRename } from "./categories.dal";
import { renameCategorySchema } from "./category-schema";

export const renameCategory = authedAction
  .inputSchema(renameCategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await storeRename(ctx.user.id, parsedInput.id, parsedInput.name);
    if (!result.isSaved) {
      if (result.error === "categoryNotFound") returnServerError(result.error);
      returnValidationErrors(renameCategorySchema, { name: { _errors: [result.error] } });
    }

    refresh();
  });
