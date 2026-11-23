"use server";

import { redirect, RedirectType } from "next/navigation";
import { returnServerError } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { listUrlOf } from "./list-url";
import { deleteTransactionSchema } from "./transaction-schema";
import { deleteTransaction as removeTransaction } from "./transactions.dal";

// A refresh would 404 on the edit URL: replace it with the list, so Back doesn't reopen it
export const deleteTransaction = authedAction
  .inputSchema(deleteTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { isDeleted } = await removeTransaction(ctx.user.id, parsedInput.id);
    if (!isDeleted) returnServerError("transactionNotFound");

    const { locale, screen, listQuery = {} } = parsedInput;
    redirect(listUrlOf(locale, screen, listQuery), RedirectType.replace);
  });
