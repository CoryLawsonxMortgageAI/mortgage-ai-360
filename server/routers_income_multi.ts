// Multi-guideline income calculation procedure
// This will be imported into the main routers.ts

import { z } from "zod";
import { protectedProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import * as fs from "fs";
import * as path from "path";

// Load guideline data
let guidelineData: any = null;
try {
  const guidelinePath = path.join(__dirname, "../guidelines/combined_guidelines.json");
  const data = fs.readFileSync(guidelinePath, "utf-8");
  guidelineData = JSON.parse(data);
  console.log("[Guidelines] Loaded combined guidelines successfully");
} catch (error) {
  console.error("[Guidelines] Could not load guideline data:", error);
}

export const calculateMultiGuideline = protectedProcedure
  .input(
    z.object({
      loanId: z.number(),
      documentNames: z.array(z.string()),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const loan = await db.getLoanById(input.loanId);
    if (!loan || loan.userId !== ctx.user.id) {
      throw new Error("Loan not found or access denied");
    }

    // Generate unique report ID
    const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Define all loan types to calculate
    const loanTypes = [
      { type: "FHA", key: "fha", name: "FHA" },
      { type: "VA", key: "va", name: "VA" },
      { type: "USDA", key: "usda", name: "USDA" },
      { type: "Conventional", key: "fannie_mae", name: "Conventional (Fannie Mae)" },
      { type: "Conventional", key: "freddie_mac", name: "Conventional (Freddie Mac)" },
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
- Loan Amount: $${loan.loanAmount}
- Property Address: ${loan.propertyAddress || "N/A"}

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

        // Save each calculation to database
        await db.createIncomeCalculation({
          loanId: input.loanId,
          userId: ctx.user.id,
          loanType: loanType.type as "FHA" | "VA" | "USDA" | "Conventional",
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
  });
