CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"locale" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_outbox_kind_check" CHECK ("email_outbox"."kind" in ('password_reset')),
	CONSTRAINT "email_outbox_status_check" CHECK ("email_outbox"."status" in ('pending', 'sent', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_outbox_user_created_at_idx" ON "email_outbox" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_outbox_created_at_idx" ON "email_outbox" USING btree ("created_at");