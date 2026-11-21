"use server";

import { refresh } from "next/cache";

import { authedAction } from "@/shared/auth/authed-action";

import { resetToDefaults } from "./data-reset.dal";

export const resetData = authedAction.action(async ({ ctx }) => {
  await resetToDefaults(ctx.user.id);

  refresh();
});
