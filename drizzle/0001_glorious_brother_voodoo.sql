CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`documentCategory` enum('bank_statement','w2','tax_return','paystub','business_return','rental_income','other'),
	`verified` int NOT NULL DEFAULT 0,
	`extractedData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guidelineCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('FHA','VA','USDA','FannieMae','FreddieMac') NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`version` varchar(50),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guidelineCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incomeCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`userId` int NOT NULL,
	`calculationType` varchar(100) NOT NULL,
	`baseIncome` int,
	`overtimeIncome` int,
	`bonusIncome` int,
	`commissionIncome` int,
	`rentalIncome` int,
	`businessIncome` int,
	`otherIncome` int,
	`totalQualifiedIncome` int NOT NULL,
	`monthlyDebt` int,
	`frontEndRatio` varchar(10),
	`backEndRatio` varchar(10),
	`guidelineUsed` varchar(50) NOT NULL,
	`aiAnalysis` text,
	`warnings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incomeCalculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`loanNumber` varchar(50) NOT NULL,
	`borrowerName` varchar(255) NOT NULL,
	`loanType` enum('FHA','VA','USDA','Conventional') NOT NULL,
	`loanAmount` int NOT NULL,
	`propertyAddress` text,
	`status` enum('draft','processing','verified','approved','rejected') NOT NULL DEFAULT 'draft',
	`qualifiedIncome` int,
	`debtToIncomeRatio` varchar(10),
	`incomeTrend` varchar(10),
	`riskLevel` enum('low','medium','high'),
	`fraudDetected` int NOT NULL DEFAULT 0,
	`missingDocuments` text,
	`calculationData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loans_id` PRIMARY KEY(`id`),
	CONSTRAINT `loans_loanNumber_unique` UNIQUE(`loanNumber`)
);
