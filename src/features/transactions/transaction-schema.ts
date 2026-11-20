import { z } from "zod";

import { routing } from "@/i18n/routing";
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
// The list a delete returns to: its language (a Server Action can't read the route's) and its
// period (the screen's `period` and `date`, which it validates, falling back to the current month)
const listQuerySchema = z.partialRecord(z.enum(["period", "date"]), z.string().max(10));

export const deleteTransactionSchema = z.object({
  id: z.uuid(),
  locale: z.enum(routing.locales),
  listQuery: listQuerySchema.optional(),
});

export type TransactionValues = z.infer<typeof transactionSchema>;
