CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"default_key" text,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "categories_type_check" CHECK ("categories"."type" in ('expense', 'income')),
	CONSTRAINT "categories_default_key_check" CHECK ("categories"."default_key" is null or "categories"."default_key" in ('food', 'transport', 'housing', 'utilities', 'health', 'shopping', 'entertainment', 'other', 'salary', 'gifts')),
	CONSTRAINT "categories_name_check" CHECK ("categories"."default_key" is not null or ("categories"."name" is not null and char_length("categories"."name") <= 40 and char_length("categories"."name") >= 1))
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"category_id" uuid NOT NULL,
	"amount_kopecks" bigint NOT NULL,
	"occurred_on" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_amount_check" CHECK ("transactions"."amount_kopecks" between 1 and 99999999999),
	CONSTRAINT "transactions_note_check" CHECK ("transactions"."note" is null or char_length("transactions"."note") <= 200)
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_owner_fkey" FOREIGN KEY ("category_id","user_id") REFERENCES "public"."categories"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_default_key_unique" ON "categories" USING btree ("user_id","type","default_key") WHERE "categories"."default_key" is not null;--> statement-breakpoint
CREATE INDEX "transactions_user_occurred_on_idx" ON "transactions" USING btree ("user_id","occurred_on" DESC NULLS LAST);