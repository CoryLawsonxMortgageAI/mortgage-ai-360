ALTER TABLE "incomeCalculations" DROP CONSTRAINT "incomeCalculations_reportId_unique";--> statement-breakpoint
ALTER TABLE "incomeCalculations" ALTER COLUMN "reportId" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "incomeCalculations" ALTER COLUMN "reportId" DROP NOT NULL;