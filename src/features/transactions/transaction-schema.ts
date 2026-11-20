// The mini build: the form loads it in the browser, where the full one adds ~30 KB
import * as z from "zod/mini";

import { routing } from "@/i18n/routing";
import { CATEGORY_TYPES, MAX_NOTE_LENGTH } from "@/shared/db/app-constants";

import { parseAmount } from "./amount";

// A date's length (YYYY-MM-DD), the longest valid `period` or `date` value
const LIST_QUERY_VALUE_MAX_LENGTH = 10;

// Messages are codes: the form translates them
export const transactionSchema = z.object({
  type: z.enum(CATEGORY_TYPES),
  amount: z.string().check(
    z.superRefine((value, context) => {
      const parsed = parseAmount(value);
      if ("error" in parsed) context.addIssue({ code: "custom", message: parsed.error });
    }),
  ),
  categoryId: z.uuid({ error: "categoryInvalid" }),
  date: z.iso.date({ error: "dateInvalid" }),
  note: z.string().check(z.trim(), z.maxLength(MAX_NOTE_LENGTH, "noteTooLong")),
});

// The type isn't sent: it comes from the category, so the two can't disagree
export const addTransactionSchema = z.omit(transactionSchema, { type: true });

export const updateTransactionSchema = z.extend(addTransactionSchema, { id: z.uuid() });
// The list a delete returns to: its language (a Server Action can't read the route's) and its
// period (the screen's `period` and `date`, which it validates, falling back to the current month)
const listQuerySchema = z.partialRecord(
  z.enum(["period", "date"]),
  z.string().check(z.maxLength(LIST_QUERY_VALUE_MAX_LENGTH)),
);

export const deleteTransactionSchema = z.object({
  id: z.uuid(),
  locale: z.enum(routing.locales),
  listQuery: z.optional(listQuerySchema),
});

export type TransactionValues = z.infer<typeof transactionSchema>;
