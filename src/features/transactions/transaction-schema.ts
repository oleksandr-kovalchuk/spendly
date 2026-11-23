import * as z from "zod/mini";

import { routing } from "@/i18n/routing";
import { CATEGORY_TYPES, MAX_NOTE_LENGTH } from "@/shared/db/app-constants";

import { parseAmount } from "./amount";
import { LIST_SCREENS } from "./list-url";

const LIST_QUERY_VALUE_MAX_LENGTH = "YYYY-MM-DD".length;

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

// The server takes the type from the category
export const addTransactionSchema = z.omit(transactionSchema, { type: true });

export const updateTransactionSchema = z.extend(addTransactionSchema, { id: z.uuid() });
// The list a delete returns to; the screen validates `period` and `date`, falling back to today
const listQueryValue = z.string().check(z.maxLength(LIST_QUERY_VALUE_MAX_LENGTH));
const listQuerySchema = z.object({
  period: z.optional(listQueryValue),
  date: z.optional(listQueryValue),
  category: z.optional(z.uuid()),
});

export const deleteTransactionSchema = z.object({
  id: z.uuid(),
  locale: z.enum(routing.locales),
  screen: z.enum(LIST_SCREENS),
  listQuery: z.optional(listQuerySchema),
});

export type TransactionValues = z.infer<typeof transactionSchema>;
