"use server";

import { refresh } from "next/cache";
import { returnServerError } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { kopecksOf } from "./amount";
import { addTransactionSchema } from "./transaction-schema";
import { insertTransaction } from "./transactions.dal";

export const addTransaction = authedAction
  .inputSchema(addTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { amount, categoryId, date, note } = parsedInput;
    const result = await insertTransaction(ctx.user.id, {
      categoryId,
      amountKopecks: kopecksOf(amount),
      occurredOn: date,
      note: note === "" ? null : note,
    });
    if (!result.isAdded) returnServerError(result.error);

    // The list reads uncached data, so the router has to fetch it again
    refresh();
  });
