CREATE TYPE "public"."documentCategory" AS ENUM('bank_statement', 'w2', 'tax_return', 'paystub', 'business_return', 'rental_income', 'other');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('FHA', 'VA', 'USDA', 'FannieMae', 'FreddieMac');--> statement-breakpoint
CREATE TYPE "public"."loanType" AS ENUM('FHA', 'VA', 'USDA', 'Conventional');--> statement-breakpoint
CREATE TYPE "public"."riskLevel" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('draft', 'processing', 'verified', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"loanId" integer NOT NULL,
	"userId" integer NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"fileUrl" text NOT NULL,
	"fileType" varchar(100) NOT NULL,
	"mimeType" varchar(100) NOT NULL,
	"fileSize" integer NOT NULL,
	"documentCategory" "documentCategory",
	"verified" integer DEFAULT 0 NOT NULL,
	"extractedData" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guidelineCache" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "guidelineCache_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" "source" NOT NULL,
	"category" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"version" varchar(50),
	"lastUpdated" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incomeCalculations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "incomeCalculations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"reportId" varchar(20) NOT NULL,
	"loanId" integer NOT NULL,
	"userId" integer NOT NULL,
	"loanType" "loanType" NOT NULL,
	"baseIncome" integer,
	"overtimeIncome" integer,
	"bonusIncome" integer,
	"commissionIncome" integer,
	"rentalIncome" integer,
	"businessIncome" integer,
	"otherIncome" integer,
	"monthlyDebt" integer,
	"qualifiedIncome" integer,
	"frontEndRatio" varchar(10),
	"backEndRatio" varchar(10),
	"riskLevel" varchar(20),
	"analysis" text,
	"warnings" text,
	"missingDocuments" text,
	"guidelineCitations" text,
	"documentsReviewed" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "incomeCalculations_reportId_unique" UNIQUE("reportId")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "loans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"loanNumber" varchar(50) NOT NULL,
	"borrowerName" varchar(255) NOT NULL,
	"loanType" "loanType" NOT NULL,
	"loanAmount" integer NOT NULL,
	"propertyAddress" text,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"qualifiedIncome" integer,
	"debtToIncomeRatio" varchar(10),
	"incomeTrend" varchar(10),
	"riskLevel" "riskLevel",
	"fraudDetected" integer DEFAULT 0 NOT NULL,
	"missingDocuments" text,
	"calculationData" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loans_loanNumber_unique" UNIQUE("loanNumber")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
