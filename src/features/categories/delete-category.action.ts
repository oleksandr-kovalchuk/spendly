"use server";

import { refresh } from "next/cache";
import { returnServerError } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { deleteCategory as storeDelete } from "./categories.dal";
import { deleteCategorySchema } from "./category-schema";

export const deleteCategory = authedAction
  .inputSchema(deleteCategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await storeDelete(ctx.user.id, parsedInput.id);
    if (!result.isDeleted) returnServerError(result.error);

    refresh();
  });
