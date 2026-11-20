"use server";

import { refresh } from "next/cache";
import { returnServerError } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { deleteTransactionSchema } from "./transaction-schema";
import { deleteTransaction as removeTransaction } from "./transactions.dal";

export const deleteTransaction = authedAction
  .inputSchema(deleteTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { isDeleted } = await removeTransaction(ctx.user.id, parsedInput.id);
    if (!isDeleted) returnServerError("transactionNotFound");

    refresh();
  });
