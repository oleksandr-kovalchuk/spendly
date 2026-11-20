"use server";

import { redirect } from "next/navigation";
import { returnServerError } from "next-safe-action";

import { authedAction } from "@/shared/auth/authed-action";

import { deleteTransactionSchema } from "./transaction-schema";
import { deleteTransaction as removeTransaction } from "./transactions.dal";

// Deleting happens in the transaction's edit form, whose URL names it: a refresh of that URL
// would find no transaction and show the 404 page, so the flow returns to the list instead
export const deleteTransaction = authedAction
  .inputSchema(deleteTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { isDeleted } = await removeTransaction(ctx.user.id, parsedInput.id);
    if (!isDeleted) returnServerError("transactionNotFound");

    const { locale, listQuery } = parsedInput;
    const query = new URLSearchParams(listQuery);
    redirect(`/${locale}/transactions${query.size > 0 ? `?${query.toString()}` : ""}`);
  });
