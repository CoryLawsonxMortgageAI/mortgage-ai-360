import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const loanTypeEnum = pgEnum("loanType", ["FHA", "VA", "USDA", "Conventional"]);
export const statusEnum = pgEnum("status", ["draft", "processing", "verified", "approved", "rejected"]);
export const riskLevelEnum = pgEnum("riskLevel", ["low", "medium", "high"]);
export const documentCategoryEnum = pgEnum("documentCategory", [
  "bank_statement",
  "w2",
  "tax_return",
  "paystub",
  "business_return",
  "rental_income",
  "other"
]);
export const guidelineSourceEnum = pgEnum("source", ["FHA", "VA", "USDA", "FannieMae", "FreddieMac"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Loans table - stores mortgage loan applications
 */
export const loans = pgTable("loans", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  loanNumber: varchar("loanNumber", { length: 50 }).notNull().unique(),
  borrowerName: varchar("borrowerName", { length: 255 }).notNull(),
  loanType: loanTypeEnum("loanType").notNull(),
  loanAmount: integer("loanAmount").notNull(),
  propertyAddress: text("propertyAddress"),
  status: statusEnum("status").default("draft").notNull(),
  qualifiedIncome: integer("qualifiedIncome"),
  debtToIncomeRatio: varchar("debtToIncomeRatio", { length: 10 }),
  incomeTrend: varchar("incomeTrend", { length: 10 }),
  riskLevel: riskLevelEnum("riskLevel"),
  fraudDetected: integer("fraudDetected").default(0).notNull(),
  missingDocuments: text("missingDocuments"),
  calculationData: text("calculationData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * Documents table - stores uploaded mortgage documents
 */
export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  loanId: integer("loanId").notNull(),
  userId: integer("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: integer("fileSize").notNull(),
  documentCategory: documentCategoryEnum("documentCategory"),
  verified: integer("verified").default(0).notNull(),
  extractedData: text("extractedData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Income calculations table - stores detailed income calculation results
 */
export const incomeCalculations = pgTable("incomeCalculations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: varchar("reportId", { length: 20 }).notNull().unique(),
  loanId: integer("loanId").notNull(),
  userId: integer("userId").notNull(),
  loanType: loanTypeEnum("loanType").notNull(),
  baseIncome: integer("baseIncome"),
  overtimeIncome: integer("overtimeIncome"),
  bonusIncome: integer("bonusIncome"),
  commissionIncome: integer("commissionIncome"),
  rentalIncome: integer("rentalIncome"),
  businessIncome: integer("businessIncome"),
  otherIncome: integer("otherIncome"),
  monthlyDebt: integer("monthlyDebt"),
  qualifiedIncome: integer("qualifiedIncome"),
  frontEndRatio: varchar("frontEndRatio", { length: 10 }),
  backEndRatio: varchar("backEndRatio", { length: 10 }),
  riskLevel: varchar("riskLevel", { length: 20 }),
  analysis: text("analysis"),
  warnings: text("warnings"),
  missingDocuments: text("missingDocuments"),
  guidelineCitations: text("guidelineCitations"),
  documentsReviewed: text("documentsReviewed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IncomeCalculation = typeof incomeCalculations.$inferSelect;
export type InsertIncomeCalculation = typeof incomeCalculations.$inferInsert;

/**
 * Guidelines cache table - stores scraped mortgage guidelines
 */
export const guidelineCache = pgTable("guidelineCache", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  source: guidelineSourceEnum("source").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  content: text("content").notNull(),
  version: varchar("version", { length: 50 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GuidelineCache = typeof guidelineCache.$inferSelect;
export type InsertGuidelineCache = typeof guidelineCache.$inferInsert;
