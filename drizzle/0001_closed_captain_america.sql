CREATE TYPE "public"."auditAction" AS ENUM('login', 'logout', 'view_loan', 'create_loan', 'update_loan', 'delete_loan', 'view_document', 'upload_document', 'delete_document', 'view_pii', 'export_data');--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auditLogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"userEmail" varchar(320),
	"action" "auditAction" NOT NULL,
	"resourceType" varchar(50),
	"resourceId" varchar(50),
	"ipAddress" varchar(45),
	"userAgent" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar(255) PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");