/**
 * OCR Router - Handles document OCR processing requests
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { performOCR, batchOCR, calculateTotalIncome } from "./ocr";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const ocrRouter = router({
  // Process single document
  processDocument: publicProcedure
    .input(z.object({
      fileData: z.string(), // Base64 encoded file
      fileName: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), "uploads");
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        // Save file temporarily
        const filePath = join(uploadsDir, input.fileName);
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        await writeFile(filePath, fileBuffer);

        // Perform OCR
        const result = await performOCR(filePath);

        return {
          success: true,
          ...result,
        };
      } catch (error: any) {
        console.error("OCR processing error:", error);
        return {
          success: false,
          error: error.message || "OCR processing failed",
          text: "",
          confidence: 0,
        };
      }
    }),

  // Process multiple documents
  processBatch: publicProcedure
    .input(z.object({
      files: z.array(z.object({
        fileData: z.string(),
        fileName: z.string(),
        fileType: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      try {
        // Create uploads directory
        const uploadsDir = join(process.cwd(), "uploads");
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        // Save all files
        const filePaths: string[] = [];
        for (const file of input.files) {
          const filePath = join(uploadsDir, file.fileName);
          const fileBuffer = Buffer.from(file.fileData, 'base64');
          await writeFile(filePath, fileBuffer);
          filePaths.push(filePath);
        }

        // Perform batch OCR
        const results = await batchOCR(filePaths);

        // Calculate totals
        const totals = calculateTotalIncome(results);

        return {
          success: true,
          results,
          totals,
        };
      } catch (error: any) {
        console.error("Batch OCR processing error:", error);
        return {
          success: false,
          error: error.message || "Batch OCR processing failed",
          results: [],
          totals: {
            totalWages: 0,
            totalAGI: 0,
            years: [],
            documentTypes: [],
          },
        };
      }
    }),

  // Extract income from uploaded files (by file path)
  extractIncome: publicProcedure
    .input(z.object({
      filePaths: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      try {
        // Perform batch OCR
        const results = await batchOCR(input.filePaths);

        // Calculate totals
        const totals = calculateTotalIncome(results);

        // Format results for income calculator
        const incomeData = {
          wages: totals.totalWages,
          adjustedGrossIncome: totals.totalAGI,
          years: totals.years,
          documentTypes: totals.documentTypes,
          documents: results.map((r, idx) => ({
            fileName: input.filePaths[idx],
            documentType: r.documentType,
            confidence: r.confidence,
            extractedFields: r.extractedFields,
          })),
        };

        return {
          success: true,
          ...incomeData,
        };
      } catch (error: any) {
        console.error("Income extraction error:", error);
        return {
          success: false,
          error: error.message || "Income extraction failed",
          wages: 0,
          adjustedGrossIncome: 0,
          years: [],
          documentTypes: [],
          documents: [],
        };
      }
    }),
});
