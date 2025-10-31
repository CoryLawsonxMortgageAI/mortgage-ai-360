import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, 
  users,
  loans,
  InsertLoan,
  documents,
  InsertDocument,
  incomeCalculations,
  InsertIncomeCalculation,
  guidelineCache,
  InsertGuidelineCache
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Loan queries
export async function createLoan(loan: InsertLoan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(loans).values(loan);
  return result;
}

export async function getUserLoans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loans).where(eq(loans.userId, userId)).orderBy(loans.createdAt);
}

export async function getLoanById(loanId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLoan(loanId: number, updates: Partial<InsertLoan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(loans).set(updates).where(eq(loans.id, loanId));
}

export async function deleteLoan(loanId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(loans).where(eq(loans.id, loanId));
}

// Document queries
export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(documents).values(document);
}

export async function getLoanDocuments(loanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.loanId, loanId)).orderBy(documents.createdAt);
}

export async function deleteDocument(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(documents).where(eq(documents.id, documentId));
}

// Income calculation queries
export async function createIncomeCalculation(calculation: InsertIncomeCalculation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(incomeCalculations).values(calculation);
}

export async function getLoanCalculations(loanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incomeCalculations).where(eq(incomeCalculations.loanId, loanId)).orderBy(incomeCalculations.createdAt);
}

// Guideline cache queries
export async function getGuidelinesBySource(source: "FHA" | "VA" | "USDA" | "FannieMae" | "FreddieMac") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guidelineCache).where(eq(guidelineCache.source, source));
}

export async function upsertGuideline(guideline: InsertGuidelineCache) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(guidelineCache).values(guideline).onConflictDoNothing();
}
