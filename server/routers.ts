import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { readFileSync } from "fs";
import { join } from "path";
import { performOCR, batchOCR, calculateTotalIncome, type OCRResult } from "./ocr";
import { ocrRouter } from "./ocrRouter";

// Load guideline data
let guidelineData: any = null;
try {
  const guidelinePath = join(process.cwd(), "guidelines", "combined_guidelines.json");
  guidelineData = JSON.parse(readFileSync(guidelinePath, "utf-8"));
} catch (error) {
  console.warn("Could not load guideline data:", error);
}

export const appRouter = router({
  system: systemRouter,
  ocr: ocrRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  loans: router({
    // List all loans for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserLoans(ctx.user.id);
    }),

    // Get single loan by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.id);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new Error("Loan not found or access denied");
        }
        return loan;
      }),

    // Create new loan
    create: protectedProcedure
      .input(z.object({
        borrowerName: z.string(),
        loanType: z.enum(["FHA", "VA", "USDA", "Conventional"]),
        loanAmount: z.number(),
        propertyAddress: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const loanNumber = `LOAN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        
        await db.createLoan({
          userId: ctx.user.id,
          loanNumber,
          borrowerName: input.borrowerName,
          loanType: input.loanType,
          loanAmount: input.loanAmount,
          propertyAddress: input.propertyAddress || null,
          status: "draft",
        });

        return { success: true, loanNumber };
      }),

    // Update loan
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        borrowerName: z.string().optional(),
        loanAmount: z.number().optional(),
        propertyAddress: z.string().optional(),
        status: z.enum(["draft", "processing", "verified", "approved", "rejected"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.id);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new Error("Loan not found or access denied");
        }

        const { id, ...updates } = input;
        await db.updateLoan(id, updates);
        return { success: true };
      }),

    // Delete loan
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.id);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new Error("Loan not found or access denied");
        }

        await db.deleteLoan(input.id);
        return { success: true };
      }),
  }),

  documents: router({
    // List documents for a loan
    list: protectedProcedure
      .input(z.object({ loanId: z.number() }))
      .query(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.loanId);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new Error("Loan not found or access denied");
        }
        return db.getLoanDocuments(input.loanId);
      }),

    // Upload document
    upload: protectedProcedure
      .input(z.object({
        loanId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        documentCategory: z.enum([
          "bank_statement",
          "w2",
          "tax_return",
          "paystub",
          "business_return",
          "rental_income",
          "other"
        ]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.loanId);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new Error("Loan not found or access denied");
        }

        // Decode base64 and upload to S3
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileKey = `loans/${input.loanId}/documents/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Save to database
        await db.createDocument({
          loanId: input.loanId,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileType: input.fileName.split(".").pop() || "unknown",
          mimeType: input.mimeType,
          fileSize: fileBuffer.length,
          documentCategory: input.documentCategory || null,
          verified: 0,
        });

        return { success: true, url };
      }),

    // Delete document
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const documents = await db.getLoanDocuments(input.id);
        const document = documents.find(d => d.id === input.id);
        
        if (!document || document.userId !== ctx.user.id) {
          throw new Error("Document not found or access denied");
        }

        await db.deleteDocument(input.id);
        return { success: true };
      }),
  }),

  income: router({
    // Calculate qualified income using AI and guidelines
    calculate: protectedProcedure
      .input(z.object({
        loanId: z.number(),
        loanType: z.enum(["FHA", "VA", "USDA", "Conventional"]),
        baseIncome: z.number().optional(),
        overtimeIncome: z.number().optional(),
        bonusIncome: z.number().optional(),
        commissionIncome: z.number().optional(),
        rentalIncome: z.number().optional(),
        businessIncome: z.number().optional(),
        otherIncome: z.number().optional(),
        monthlyDebt: z.number().optional(),
        documentUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.loanId);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new Error("Loan not found or access denied");
        }

        // Get relevant guidelines
        let guidelineContext = "";
        if (guidelineData && guidelineData.guidelines) {
          const sourceKey = input.loanType === "Conventional" ? "fannie_mae" : input.loanType.toLowerCase();
          const guidelines = guidelineData.guidelines[sourceKey];
          
          if (guidelines) {
            guidelineContext = `
Relevant ${input.loanType} Guidelines:
- Income Requirements: ${guidelines.income_requirements?.length || 0} rules
- Credit Requirements: ${guidelines.credit_requirements?.length || 0} rules
- DTI Requirements: ${guidelines.debt_to_income_ratios?.length || 0} rules

Sample Income Guidelines:
${JSON.stringify(guidelines.income_requirements?.slice(0, 5) || [], null, 2)}

Sample DTI Guidelines:
${JSON.stringify(guidelines.debt_to_income_ratios?.slice(0, 3) || [], null, 2)}
`;
          }
        }

        // Calculate total income
        const totalIncome = (input.baseIncome || 0) +
          (input.overtimeIncome || 0) +
          (input.bonusIncome || 0) +
          (input.commissionIncome || 0) +
          (input.rentalIncome || 0) +
          (input.businessIncome || 0) +
          (input.otherIncome || 0);

        // Calculate DTI ratios
        const monthlyIncome = totalIncome / 12;
        const monthlyDebt = input.monthlyDebt || 0;
        const backEndRatio = monthlyIncome > 0 ? ((monthlyDebt / monthlyIncome) * 100).toFixed(2) : "0.00";

        // Use AI to analyze and validate
        const aiPrompt = `You are a mortgage underwriting AI assistant for ${input.loanType} loans. Analyze the following income data and provide a detailed assessment.

${guidelineContext}

Income Data:
- Base Income: $${input.baseIncome || 0}
- Overtime Income: $${input.overtimeIncome || 0}
- Bonus Income: $${input.bonusIncome || 0}
- Commission Income: $${input.commissionIncome || 0}
- Rental Income: $${input.rentalIncome || 0}
- Business Income: $${input.businessIncome || 0}
- Other Income: $${input.otherIncome || 0}
- Total Annual Income: $${totalIncome}
- Monthly Debt: $${monthlyDebt}
- Calculated Back-End DTI: ${backEndRatio}%

Based on ${input.loanType} guidelines, provide:
1. Qualified Income Assessment (which income sources are acceptable)
2. DTI Ratio Analysis (is ${backEndRatio}% acceptable for ${input.loanType}?)
3. Risk Assessment (low/medium/high)
4. Missing Documentation Requirements
5. Recommendations for approval

Format your response as JSON with these fields:
{
  "qualifiedIncome": number,
  "dtiAnalysis": string,
  "riskLevel": "low" | "medium" | "high",
  "missingDocuments": string[],
  "recommendations": string,
  "warnings": string[]
}`;

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert mortgage underwriting AI that strictly follows FHA, VA, USDA, and Conventional loan guidelines." },
            { role: "user", content: aiPrompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "income_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  qualifiedIncome: { type: "number" },
                  dtiAnalysis: { type: "string" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  missingDocuments: { type: "array", items: { type: "string" } },
                  recommendations: { type: "string" },
                  warnings: { type: "array", items: { type: "string" } }
                },
                required: ["qualifiedIncome", "dtiAnalysis", "riskLevel", "missingDocuments", "recommendations", "warnings"],
                additionalProperties: false
              }
            }
          }
        });

        const content = aiResponse.choices[0].message.content;
        const analysis = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

        // Generate unique report ID
        const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Save calculation to database
        await db.createIncomeCalculation({
          loanId: input.loanId,
          userId: ctx.user.id,
          loanType: input.loanType,
          reportId,
          baseIncome: input.baseIncome || null,
          overtimeIncome: input.overtimeIncome || null,
          bonusIncome: input.bonusIncome || null,
          commissionIncome: input.commissionIncome || null,
          rentalIncome: input.rentalIncome || null,
          businessIncome: input.businessIncome || null,
          otherIncome: input.otherIncome || null,
          qualifiedIncome: analysis.qualifiedIncome,
          monthlyDebt: monthlyDebt,
          frontEndRatio: null,
          backEndRatio: backEndRatio,
          riskLevel: analysis.riskLevel,
          analysis: analysis.recommendations,
          warnings: JSON.stringify(analysis.warnings),
          missingDocuments: JSON.stringify(analysis.missingDocuments),
          guidelineCitations: JSON.stringify([`${input.loanType} Guidelines Applied`]),
          documentsReviewed: JSON.stringify([]),
        });

        // Update loan with results
        await db.updateLoan(input.loanId, {
          qualifiedIncome: analysis.qualifiedIncome,
          debtToIncomeRatio: backEndRatio,
          riskLevel: analysis.riskLevel as "low" | "medium" | "high",
          missingDocuments: JSON.stringify(analysis.missingDocuments),
          status: "processing",
        });

        return {
          success: true,
          qualifiedIncome: analysis.qualifiedIncome,
          backEndRatio,
          riskLevel: analysis.riskLevel,
          analysis: analysis.recommendations,
          warnings: analysis.warnings,
          missingDocuments: analysis.missingDocuments,
        };
      }),

    // Get calculation history for a loan
    history: protectedProcedure
      .input(z.object({ loanId: z.number() }))
      .query(async ({ input, ctx }) => {
        const loan = await db.getLoanById(input.loanId);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new Error("Loan not found or access denied");
        }
        return db.getLoanCalculations(input.loanId);
      }),

    // Calculate income for ALL guidelines simultaneously
    calculateMultiGuideline: publicProcedure
      .input(z.object({
        loanId: z.number().optional(),
        documentNames: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        // Loan ID is optional for public access
        let loan = null;
        if (input.loanId && input.loanId > 0 && ctx.user) {
          loan = await db.getLoanById(input.loanId);
          if (loan && loan.userId !== ctx.user.id) {
            throw new Error("Access denied to this loan");
          }
        }

        // Generate unique report ID
        const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Define all loan types to calculate
        const loanTypes = [
          { type: "FHA" as const, key: "fha", name: "FHA" },
          { type: "VA" as const, key: "va", name: "VA" },
          { type: "USDA" as const, key: "usda", name: "USDA" },
          { type: "Conventional" as const, key: "fannie_mae", name: "Conventional (Fannie Mae)" },
          { type: "Conventional" as const, key: "freddie_mac", name: "Conventional (Freddie Mac)" },
        ];

        const calculations = [];

        // Calculate for each guideline
        for (const loanType of loanTypes) {
          let guidelineContext = "";
          let citations: string[] = [];

          if (guidelineData && guidelineData.guidelines) {
            const guidelines = guidelineData.guidelines[loanType.key];

            if (guidelines) {
              const source = guidelines.source || loanType.name;
              citations.push(`${source} - Last Updated: ${guidelines.last_updated || "N/A"}`);

              guidelineContext = `
Relevant ${loanType.name} Guidelines:
Source: ${source}
- Income Requirements: ${guidelines.income_requirements?.length || 0} rules
- Credit Requirements: ${guidelines.credit_requirements?.length || 0} rules

Sample Income Guidelines:
${JSON.stringify(guidelines.income_requirements?.slice(0, 10) || [], null, 2)}

Sample DTI Guidelines:
${JSON.stringify(guidelines.debt_to_income_ratios?.slice(0, 5) || [], null, 2)}
`;

              // Add specific citations
              if (guidelines.income_requirements && guidelines.income_requirements.length > 0) {
                citations.push(
                  ...guidelines.income_requirements
                    .slice(0, 3)
                    .map((req: any) => `${source}: ${req.section || req.requirement || "Income Rule"}`)
                );
              }
            }
          }

          // AI prompt for this specific guideline
          const aiPrompt = `You are analyzing income documents for a ${loanType.name} loan.

${guidelineContext}

Documents Provided:
${input.documentNames.map((name, idx) => `${idx + 1}. ${name}`).join("\n")}

Loan Details:
- Loan Amount: $${loan?.loanAmount || "Not specified"}
- Property Address: ${loan?.propertyAddress || "N/A"}

Based on the ${loanType.name} guidelines and the document names provided, provide:
1. Estimated Qualified Income (be conservative)
2. Estimated Back-End DTI Ratio (assume reasonable debt levels)
3. Risk Assessment (low/medium/high)
4. Warnings specific to ${loanType.name}
5. Analysis and recommendations

Format your response as JSON with these fields:
{
  "qualifiedIncome": number,
  "backEndRatio": string,
  "riskLevel": "low" | "medium" | "high",
  "warnings": string[],
  "analysis": string
}`;

          try {
            const aiResponse = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `You are an expert mortgage underwriting AI specializing in ${loanType.name} loans. You strictly follow official guidelines and provide conservative estimates.`,
                },
                { role: "user", content: aiPrompt },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "guideline_analysis",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      qualifiedIncome: { type: "number" },
                      backEndRatio: { type: "string" },
                      riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                      warnings: { type: "array", items: { type: "string" } },
                      analysis: { type: "string" },
                    },
                    required: ["qualifiedIncome", "backEndRatio", "riskLevel", "warnings", "analysis"],
                    additionalProperties: false,
                  },
                },
              },
            });

            const content = aiResponse.choices[0].message.content;
            const analysis = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

            calculations.push({
              loanType: loanType.name,
              qualifiedIncome: analysis.qualifiedIncome,
              backEndRatio: analysis.backEndRatio,
              riskLevel: analysis.riskLevel,
              citations,
              warnings: analysis.warnings,
              analysis: analysis.analysis,
            });

            // Save each calculation to database (only if user is authenticated and loanId exists)
            if (ctx.user && input.loanId) {
              await db.createIncomeCalculation({
                loanId: input.loanId,
                userId: ctx.user.id,
                loanType: loanType.type,
                reportId,
                qualifiedIncome: analysis.qualifiedIncome,
                backEndRatio: analysis.backEndRatio,
                riskLevel: analysis.riskLevel,
                analysis: analysis.analysis,
                warnings: JSON.stringify(analysis.warnings),
                guidelineCitations: JSON.stringify(citations),
                documentsReviewed: JSON.stringify(input.documentNames),
                baseIncome: null,
                overtimeIncome: null,
                bonusIncome: null,
                commissionIncome: null,
                rentalIncome: null,
                businessIncome: null,
                otherIncome: null,
                monthlyDebt: null,
                frontEndRatio: null,
                missingDocuments: null,
              });
            }
          } catch (error) {
            console.error(`Error calculating for ${loanType.name}:`, error);
            // Add error result
            calculations.push({
              loanType: loanType.name,
              qualifiedIncome: 0,
              backEndRatio: "N/A",
              riskLevel: "high",
              citations: ["Error: Unable to calculate"],
              warnings: [`Calculation failed for ${loanType.name}`],
              analysis: "Unable to complete analysis due to an error.",
            });
          }
        }

        return {
          reportId,
          calculations,
          documentsReviewed: input.documentNames,
        };
      }),
  }),

  guidelines: router({
    // Search guidelines by source
    search: publicProcedure
      .input(z.object({
        source: z.enum(["FHA", "VA", "USDA", "FannieMae", "FreddieMac"]),
        query: z.string().optional(),
      }))
      .query(async ({ input }) => {
        if (!guidelineData || !guidelineData.guidelines) {
          return { results: [], source: input.source };
        }

        const sourceKey = input.source === "FannieMae" ? "fannie_mae" : 
                         input.source === "FreddieMac" ? "freddie_mac" :
                         input.source.toLowerCase();
        
        const guidelines = guidelineData.guidelines[sourceKey];
        
        if (!guidelines) {
          return { results: [], source: input.source };
        }

        // If query provided, filter results
        if (input.query) {
          const query = input.query.toLowerCase();
          const results = [];
          
          // Search in income requirements
          if (guidelines.income_requirements) {
            results.push(...guidelines.income_requirements.filter((req: any) => 
              req.context?.toLowerCase().includes(query) || 
              req.keyword?.toLowerCase().includes(query)
            ).slice(0, 10));
          }
          
          return { results, source: input.source };
        }

        // Return summary
        return {
          source: input.source,
          summary: {
            incomeRequirements: guidelines.income_requirements?.length || 0,
            creditRequirements: guidelines.credit_requirements?.length || 0,
            dtiRequirements: guidelines.debt_to_income_ratios?.length || 0,
          },
          lastUpdated: guidelines.last_updated,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
