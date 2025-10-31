import type { Express } from "express";
import { isAuthenticated } from "./replitAuth";
import { getDb } from "./db";
import { incomeCalculations, loans, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateProfessionalReport } from "./reportGenerator";

export function registerReportRoutes(app: Express) {
  // View professional report by Report ID
  app.get("/api/reports/:reportId", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const sessionUser: any = req.user;
      
      if (!sessionUser?.dbUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ message: "Database not available" });
      }

      // Get all calculations for this report ID
      const calculations = await db
        .select()
        .from(incomeCalculations)
        .where(eq(incomeCalculations.reportId, reportId));

      if (calculations.length === 0) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Get loan information
      const loanId = calculations[0].loanId;
      const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));

      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }

      // Verify ownership
      if (loan.userId !== sessionUser.dbUser.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get user info
      const [user] = await db.select().from(users).where(eq(users.id, loan.userId));

      // Format calculations for report
      const formattedCalculations = calculations.map(calc => ({
        loanType: calc.loanType,
        qualifiedIncome: calc.qualifiedIncome || 0,
        backEndRatio: calc.backEndRatio || "N/A",
        riskLevel: calc.riskLevel || "medium",
        warnings: calc.warnings ? JSON.parse(calc.warnings) : [],
        analysis: calc.analysis || "Analysis not available",
        citations: calc.guidelineCitations ? JSON.parse(calc.guidelineCitations) : [],
      }));

      // Parse documents reviewed
      const documentsReviewed = calculations[0].documentsReviewed
        ? JSON.parse(calculations[0].documentsReviewed)
        : [];

      // Generate professional report
      const reportHtml = generateProfessionalReport({
        reportId,
        loanNumber: loan.loanNumber,
        borrowerName: loan.borrowerName,
        loanAmount: loan.loanAmount,
        propertyAddress: loan.propertyAddress,
        calculations: formattedCalculations,
        documentsReviewed,
        generatedDate: calculations[0].createdAt?.toISOString() || new Date().toISOString(),
        generatedBy: user?.name || user?.email || "System",
      });

      res.setHeader("Content-Type", "text/html");
      res.send(reportHtml);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Get report metadata (JSON) by Report ID
  app.get("/api/reports/:reportId/metadata", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const sessionUser: any = req.user;
      
      if (!sessionUser?.dbUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ message: "Database not available" });
      }

      // Get all calculations for this report ID
      const calculations = await db
        .select()
        .from(incomeCalculations)
        .where(eq(incomeCalculations.reportId, reportId));

      if (calculations.length === 0) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Get loan information
      const loanId = calculations[0].loanId;
      const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));

      if (!loan || loan.userId !== sessionUser.dbUser.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({
        reportId,
        loanNumber: loan.loanNumber,
        borrowerName: loan.borrowerName,
        loanAmount: loan.loanAmount,
        propertyAddress: loan.propertyAddress,
        createdAt: calculations[0].createdAt,
        calculationCount: calculations.length,
        documentsReviewed: calculations[0].documentsReviewed
          ? JSON.parse(calculations[0].documentsReviewed)
          : [],
      });
    } catch (error) {
      console.error("Error fetching report metadata:", error);
      res.status(500).json({ message: "Failed to fetch report metadata" });
    }
  });
}
