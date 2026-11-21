"use server";

import { refresh } from "next/cache";

import { authedAction } from "@/shared/auth/authed-action";

import { deleteAllTransactions } from "./data-reset.dal";

export const clearTransactions = authedAction.action(async ({ ctx }) => {
  await deleteAllTransactions(ctx.user.id);

  refresh();
});
