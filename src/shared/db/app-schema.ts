import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  CATEGORY_TYPES,
  DEFAULT_CATEGORY_KEYS,
  MAX_AMOUNT_KOPECKS,
  MAX_CATEGORY_NAME_LENGTH,
  MAX_NOTE_LENGTH,
} from "./app-constants";
import { user } from "./auth-schema";

const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuidv7()`);
const createdAt = () => timestamp({ withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export const CATEGORY_NAME_UNIQUE_INDEX = "categories_user_type_name_unique";

// A default category has a `defaultKey` and no name until the user renames it
export const categories = pgTable(
  "categories",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text({ enum: CATEGORY_TYPES }).notNull(),
    defaultKey: text({ enum: DEFAULT_CATEGORY_KEYS }),
    name: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    // Lets a transaction reference its category together with its owner
    unique("categories_id_user_id_unique").on(table.id, table.userId),
    uniqueIndex("categories_user_default_key_unique")
      .on(table.userId, table.type, table.defaultKey)
      .where(sql`${table.defaultKey} is not null`),
    // The builtin collation lowercases Cyrillic too, whatever the database's locale
    uniqueIndex(CATEGORY_NAME_UNIQUE_INDEX)
      .on(table.userId, table.type, sql`lower(${table.name} collate "pg_c_utf8")`)
      .where(sql`${table.name} is not null`),
    check("categories_type_check", sql`${table.type} in ('expense', 'income')`),
    check(
      "categories_default_key_check",
      sql`${table.defaultKey} is null or ${table.defaultKey} in (${sql.raw(DEFAULT_CATEGORY_KEYS.map((key) => `'${key}'`).join(", "))})`,
    ),
    check(
      "categories_name_check",
      sql`(${table.defaultKey} is not null or ${table.name} is not null) and (${table.name} is null or char_length(${table.name}) between 1 and ${sql.raw(String(MAX_CATEGORY_NAME_LENGTH))})`,
    ),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: uuid().notNull(),
    amountKopecks: bigint({ mode: "number" }).notNull(),
    occurredOn: date({ mode: "string" }).notNull(),
    note: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    // The category must belong to the same user, whatever the code does
    foreignKey({
      columns: [table.categoryId, table.userId],
      foreignColumns: [categories.id, categories.userId],
      name: "transactions_category_owner_fkey",
    }),
    index("transactions_user_occurred_on_idx").on(table.userId, table.occurredOn.desc()),
    check(
      "transactions_amount_check",
      sql`${table.amountKopecks} between 1 and ${sql.raw(String(MAX_AMOUNT_KOPECKS))}`,
    ),
    check(
      "transactions_note_check",
      sql`${table.note} is null or char_length(${table.note}) <= ${sql.raw(String(MAX_NOTE_LENGTH))}`,
    ),
  ],
);
