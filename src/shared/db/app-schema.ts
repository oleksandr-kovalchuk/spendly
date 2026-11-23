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
  CATEGORY_ICON_KEYS,
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
export const TRANSACTION_CATEGORY_FOREIGN_KEY = "transactions_category_owner_fkey";

// A default has a `defaultKey`, no name until renamed, and no icon (it comes from the key)
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
    icon: text({ enum: CATEGORY_ICON_KEYS }),
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
      "categories_icon_check",
      sql`${table.icon} is null or (${table.defaultKey} is null and ${table.icon} in (${sql.raw(CATEGORY_ICON_KEYS.map((key) => `'${key}'`).join(", "))}))`,
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
      name: TRANSACTION_CATEGORY_FOREIGN_KEY,
    }),
    index("transactions_user_occurred_on_idx").on(table.userId, table.occurredOn.desc()),
    // Serves the category's foreign key check, its delete and the per-category counts
    index("transactions_user_category_idx").on(table.userId, table.categoryId),
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

const EMAIL_KINDS = ["password_reset"] as const;
const EMAIL_STATUSES = ["pending", "sent", "failed"] as const;

// One row per email: it limits emails per user and keeps the delivery status, never the link
export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text({ enum: EMAIL_KINDS }).notNull(),
    locale: text().notNull(),
    status: text({ enum: EMAIL_STATUSES }).notNull().default("pending"),
    // Resend's error name when the send failed
    error: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("email_outbox_user_created_at_idx").on(table.userId, table.createdAt.desc()),
    index("email_outbox_created_at_idx").on(table.createdAt),
    check(
      "email_outbox_kind_check",
      sql`${table.kind} in (${sql.raw(EMAIL_KINDS.map((kind) => `'${kind}'`).join(", "))})`,
    ),
    check(
      "email_outbox_status_check",
      sql`${table.status} in (${sql.raw(EMAIL_STATUSES.map((status) => `'${status}'`).join(", "))})`,
    ),
  ],
);
