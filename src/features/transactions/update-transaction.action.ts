"use server";

import { refresh } from "next/cache";
import { returnServerError } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { kopecksOf } from "./amount";
import { updateTransactionSchema } from "./transaction-schema";
import { updateTransaction as storeUpdate } from "./transactions.dal";

export const updateTransaction = authedAction
  .inputSchema(updateTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, amount, categoryId, date, note } = parsedInput;
    const result = await storeUpdate(ctx.user.id, id, {
      categoryId,
      amountKopecks: kopecksOf(amount),
      occurredOn: date,
      note: note === "" ? null : note,
    });
    if (!result.isUpdated) returnServerError(result.error);

    refresh();
  });
