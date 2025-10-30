/**
 * OCR Service - Extract text from uploaded documents
 * Uses Tesseract OCR to read W-2s, tax returns, paystubs, and other mortgage documents
 */

import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';

export interface OCRResult {
  text: string;
  confidence: number;
  documentType?: string;
  extractedFields?: Record<string, any>;
}

export interface IncomeData {
  wages?: number;
  salaries?: number;
  tips?: number;
  selfEmploymentIncome?: number;
  rentalIncome?: number;
  interestIncome?: number;
  dividendIncome?: number;
  capitalGains?: number;
  otherIncome?: number;
  adjustedGrossIncome?: number;
  taxableIncome?: number;
  year?: number;
  employerName?: string;
  employerEIN?: string;
  employeeName?: string;
  employeeSSN?: string;
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    // Dynamic import for CommonJS module
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from image using Tesseract OCR
 */
async function extractTextFromImage(filePath: string): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('eng');
  
  try {
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    
    return {
      text: data.text,
      confidence: data.confidence / 100, // Convert to 0-1 scale
    };
  } catch (error) {
    await worker.terminate();
    console.error('OCR failed:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Detect document type from extracted text
 */
function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('form w-2') || lowerText.includes('wage and tax statement')) {
    return 'W-2';
  }
  if (lowerText.includes('form 1040') || lowerText.includes('u.s. individual income tax return')) {
    return 'Form 1040';
  }
  if (lowerText.includes('schedule c') || lowerText.includes('profit or loss from business')) {
    return 'Schedule C';
  }
  if (lowerText.includes('schedule e') || lowerText.includes('supplemental income and loss')) {
    return 'Schedule E';
  }
  if (lowerText.includes('form 1120') || lowerText.includes('u.s. corporation income tax return')) {
    return 'Form 1120';
  }
  if (lowerText.includes('form 1065') || lowerText.includes('u.s. return of partnership income')) {
    return 'Form 1065';
  }
  if (lowerText.includes('schedule k-1') || lowerText.includes('partner\'s share of income')) {
    return 'Schedule K-1';
  }
  if (lowerText.includes('paystub') || lowerText.includes('pay stub') || lowerText.includes('earnings statement')) {
    return 'Paystub';
  }
  if (lowerText.includes('bank statement')) {
    return 'Bank Statement';
  }
  
  return 'Unknown';
}

/**
 * Extract income data from W-2 form
 */
function extractW2Data(text: string): IncomeData {
  const data: IncomeData = {};
  
  // Extract wages (Box 1)
  const wagesMatch = text.match(/(?:wages|box\s*1)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (wagesMatch) {
    data.wages = parseFloat(wagesMatch[1].replace(/,/g, ''));
  }
  
  // Extract employer name
  const employerMatch = text.match(/(?:employer|company)[^\n]*\n([A-Z][A-Za-z\s&.,'-]+)/i);
  if (employerMatch) {
    data.employerName = employerMatch[1].trim();
  }
  
  // Extract employee name
  const employeeMatch = text.match(/(?:employee|name)[^\n]*\n([A-Z][A-Za-z\s.,'-]+)/i);
  if (employeeMatch) {
    data.employeeName = employeeMatch[1].trim();
  }
  
  // Extract year
  const yearMatch = text.match(/20\d{2}/);
  if (yearMatch) {
    data.year = parseInt(yearMatch[0]);
  }
  
  return data;
}

/**
 * Extract income data from Form 1040
 */
function extractForm1040Data(text: string): IncomeData {
  const data: IncomeData = {};
  
  // Extract wages (Line 1)
  const wagesMatch = text.match(/(?:line\s*1|wages)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (wagesMatch) {
    data.wages = parseFloat(wagesMatch[1].replace(/,/g, ''));
  }
  
  // Extract adjusted gross income (Line 11)
  const agiMatch = text.match(/(?:adjusted\s*gross\s*income|line\s*11)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (agiMatch) {
    data.adjustedGrossIncome = parseFloat(agiMatch[1].replace(/,/g, ''));
  }
  
  // Extract taxable income
  const taxableMatch = text.match(/(?:taxable\s*income|line\s*15)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (taxableMatch) {
    data.taxableIncome = parseFloat(taxableMatch[1].replace(/,/g, ''));
  }
  
  // Extract year
  const yearMatch = text.match(/20\d{2}/);
  if (yearMatch) {
    data.year = parseInt(yearMatch[0]);
  }
  
  return data;
}

/**
 * Extract income data from paystub
 */
function extractPaystubData(text: string): IncomeData {
  const data: IncomeData = {};
  
  // Extract gross pay
  const grossMatch = text.match(/(?:gross\s*pay|gross\s*earnings)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (grossMatch) {
    data.wages = parseFloat(grossMatch[1].replace(/,/g, ''));
  }
  
  // Extract YTD gross
  const ytdMatch = text.match(/(?:ytd\s*gross|year\s*to\s*date)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (ytdMatch) {
    data.wages = parseFloat(ytdMatch[1].replace(/,/g, ''));
  }
  
  // Extract employer name
  const employerMatch = text.match(/^([A-Z][A-Za-z\s&.,'-]+)$/m);
  if (employerMatch) {
    data.employerName = employerMatch[1].trim();
  }
  
  return data;
}

/**
 * Extract income data based on document type
 */
function extractIncomeData(text: string, documentType: string): IncomeData {
  switch (documentType) {
    case 'W-2':
      return extractW2Data(text);
    case 'Form 1040':
      return extractForm1040Data(text);
    case 'Paystub':
      return extractPaystubData(text);
    default:
      return {};
  }
}

/**
 * Main OCR function - extracts text and income data from document
 */
export async function performOCR(filePath: string): Promise<OCRResult> {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';
  let confidence = 1.0;
  
  try {
    if (ext === '.pdf') {
      // Extract text from PDF
      text = await extractTextFromPDF(filePath);
    } else if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp'].includes(ext)) {
      // Extract text from image using OCR
      const result = await extractTextFromImage(filePath);
      text = result.text;
      confidence = result.confidence;
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
    
    // Detect document type
    const documentType = detectDocumentType(text);
    
    // Extract income data
    const extractedFields = extractIncomeData(text, documentType);
    
    return {
      text,
      confidence,
      documentType,
      extractedFields,
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
}

/**
 * Batch OCR processing for multiple documents
 */
export async function batchOCR(filePaths: string[]): Promise<OCRResult[]> {
  const results: OCRResult[] = [];
  
  for (const filePath of filePaths) {
    try {
      const result = await performOCR(filePath);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${filePath}:`, error);
      results.push({
        text: '',
        confidence: 0,
        documentType: 'Error',
        extractedFields: {},
      });
    }
  }
  
  return results;
}

/**
 * Calculate total income from multiple documents
 */
export function calculateTotalIncome(ocrResults: OCRResult[]): {
  totalWages: number;
  totalAGI: number;
  years: number[];
  documentTypes: string[];
} {
  let totalWages = 0;
  let totalAGI = 0;
  const years: number[] = [];
  const documentTypes: string[] = [];
  
  for (const result of ocrResults) {
    if (result.extractedFields) {
      if (result.extractedFields.wages) {
        totalWages += result.extractedFields.wages;
      }
      if (result.extractedFields.adjustedGrossIncome) {
        totalAGI += result.extractedFields.adjustedGrossIncome;
      }
      if (result.extractedFields.year) {
        years.push(result.extractedFields.year);
      }
    }
    if (result.documentType) {
      documentTypes.push(result.documentType);
    }
  }
  
  return {
    totalWages,
    totalAGI,
    years: [...new Set(years)].sort(),
    documentTypes: [...new Set(documentTypes)],
  };
}
