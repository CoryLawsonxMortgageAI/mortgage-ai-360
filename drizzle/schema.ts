import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Loans table - stores mortgage loan applications
 */
export const loans = mysqlTable("loans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  loanNumber: varchar("loanNumber", { length: 50 }).notNull().unique(),
  borrowerName: varchar("borrowerName", { length: 255 }).notNull(),
  loanType: mysqlEnum("loanType", ["FHA", "VA", "USDA", "Conventional"]).notNull(),
  loanAmount: int("loanAmount").notNull(),
  propertyAddress: text("propertyAddress"),
  status: mysqlEnum("status", ["draft", "processing", "verified", "approved", "rejected"]).default("draft").notNull(),
  qualifiedIncome: int("qualifiedIncome"),
  debtToIncomeRatio: varchar("debtToIncomeRatio", { length: 10 }),
  incomeTrend: varchar("incomeTrend", { length: 10 }),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]),
  fraudDetected: int("fraudDetected").default(0).notNull(),
  missingDocuments: text("missingDocuments"),
  calculationData: text("calculationData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * Documents table - stores uploaded mortgage documents
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  documentCategory: mysqlEnum("documentCategory", [
    "bank_statement",
    "w2",
    "tax_return",
    "paystub",
    "business_return",
    "rental_income",
    "other"
  ]),
  verified: int("verified").default(0).notNull(),
  extractedData: text("extractedData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Income calculations table - stores detailed income calculation results
 */
export const incomeCalculations = mysqlTable("incomeCalculations", {
  id: int("id").autoincrement().primaryKey(),
  reportId: varchar("reportId", { length: 20 }).notNull().unique(), // Unique report ID
  loanId: int("loanId").notNull(),
  userId: int("userId").notNull(),
  loanType: mysqlEnum("loanType", ["FHA", "VA", "USDA", "Conventional"]).notNull(),
  baseIncome: int("baseIncome"),
  overtimeIncome: int("overtimeIncome"),
  bonusIncome: int("bonusIncome"),
  commissionIncome: int("commissionIncome"),
  rentalIncome: int("rentalIncome"),
  businessIncome: int("businessIncome"),
  otherIncome: int("otherIncome"),
  monthlyDebt: int("monthlyDebt"),
  qualifiedIncome: int("qualifiedIncome"),
  frontEndRatio: varchar("frontEndRatio", { length: 10 }),
  backEndRatio: varchar("backEndRatio", { length: 10 }),
  riskLevel: varchar("riskLevel", { length: 20 }),
  analysis: text("analysis"),
  warnings: text("warnings"),
  missingDocuments: text("missingDocuments"),
  guidelineCitations: text("guidelineCitations"), // JSON array of citations
  documentsReviewed: text("documentsReviewed"), // JSON array of document names
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IncomeCalculation = typeof incomeCalculations.$inferSelect;
export type InsertIncomeCalculation = typeof incomeCalculations.$inferInsert;

/**
 * Guidelines cache table - stores scraped mortgage guidelines
 */
export const guidelineCache = mysqlTable("guidelineCache", {
  id: int("id").autoincrement().primaryKey(),
  source: mysqlEnum("source", ["FHA", "VA", "USDA", "FannieMae", "FreddieMac"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  content: text("content").notNull(),
  version: varchar("version", { length: 50 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GuidelineCache = typeof guidelineCache.$inferSelect;
export type InsertGuidelineCache = typeof guidelineCache.$inferInsert;