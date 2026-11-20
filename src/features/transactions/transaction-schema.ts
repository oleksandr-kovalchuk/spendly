import { z } from "zod";

import { CATEGORY_TYPES, MAX_NOTE_LENGTH } from "@/shared/db/app-schema";

import { parseAmount } from "./amount";

// Messages are codes: the form translates them
export const transactionSchema = z.object({
  type: z.enum(CATEGORY_TYPES),
  amount: z.string().superRefine((value, context) => {
    const parsed = parseAmount(value);
    if ("error" in parsed) context.addIssue({ code: "custom", message: parsed.error });
  }),
  categoryId: z.uuid({ error: "categoryInvalid" }),
  date: z.iso.date({ error: "dateInvalid" }),
  note: z.string().trim().max(MAX_NOTE_LENGTH, "noteTooLong"),
});

// The type isn't sent: it comes from the category, so the two can't disagree
export const addTransactionSchema = transactionSchema.omit({ type: true });

export const updateTransactionSchema = addTransactionSchema.extend({ id: z.uuid() });
export const deleteTransactionSchema = z.object({ id: z.uuid() });

export type TransactionValues = z.infer<typeof transactionSchema>;
