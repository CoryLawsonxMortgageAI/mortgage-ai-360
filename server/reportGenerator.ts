/**
 * Professional Income Verification Report Generator
 * For Mortgage Underwriters - Black & White, Print-Ready Format
 */

function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ReportData {
  reportId: string;
  loanNumber: string;
  borrowerName: string;
  loanAmount: number;
  propertyAddress: string | null;
  calculations: Array<{
    loanType: string;
    qualifiedIncome: number;
    backEndRatio: string;
    riskLevel: string;
    warnings: string[];
    analysis: string;
    citations: string[];
  }>;
  documentsReviewed: string[];
  generatedDate: string;
  generatedBy: string;
}

export function generateProfessionalReport(data: ReportData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Income Verification Report - ${escapeHtml(data.reportId)}</title>
  <style>
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }

    .header {
      border-bottom: 3px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .header .subtitle {
      font-size: 10pt;
      color: #333;
      font-style: italic;
    }

    .report-id {
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      padding: 10px;
      border: 2px solid #000;
      margin: 15px 0;
      background: #f5f5f5;
    }

    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }

    .info-item {
      padding: 8px;
      border: 1px solid #666;
    }

    .info-label {
      font-weight: bold;
      font-size: 9pt;
      color: #333;
      display: block;
      margin-bottom: 3px;
    }

    .info-value {
      font-size: 11pt;
    }

    .calculation-box {
      border: 2px solid #000;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .calculation-header {
      background: #000;
      color: #fff;
      padding: 10px;
      font-size: 11pt;
      font-weight: bold;
    }

    .calculation-body {
      padding: 15px;
    }

    .metric-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #ccc;
    }

    .metric {
      text-align: center;
    }

    .metric-label {
      font-size: 9pt;
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }

    .metric-value {
      font-size: 16pt;
      font-weight: bold;
    }

    .risk-badge {
      display: inline-block;
      padding: 3px 10px;
      border: 2px solid #000;
      font-weight: bold;
      font-size: 9pt;
      text-transform: uppercase;
    }

    .risk-low { background: #f0f0f0; }
    .risk-medium { background: #e0e0e0; }
    .risk-high { background: #d0d0d0; }

    .warnings-list {
      background: #f8f8f8;
      border-left: 4px solid #000;
      padding: 10px 15px;
      margin: 10px 0;
    }

    .warnings-list ul {
      margin-left: 20px;
    }

    .warnings-list li {
      margin: 5px 0;
      font-size: 10pt;
    }

    .analysis-text {
      font-size: 10pt;
      line-height: 1.5;
      text-align: justify;
      margin: 10px 0;
      padding: 10px;
      border: 1px solid #ccc;
      background: #fafafa;
    }

    .documents-list {
      margin: 10px 0;
    }

    .documents-list ol {
      margin-left: 25px;
    }

    .documents-list li {
      margin: 5px 0;
      font-size: 10pt;
    }

    .citations {
      font-size: 9pt;
      font-style: italic;
      color: #555;
      margin-top: 10px;
      padding: 8px;
      background: #f5f5f5;
      border-left: 3px solid #666;
    }

    .footer {
      border-top: 2px solid #000;
      padding-top: 15px;
      margin-top: 30px;
      font-size: 9pt;
      text-align: center;
      color: #666;
    }

    .disclaimer {
      font-size: 8pt;
      font-style: italic;
      margin-top: 10px;
      padding: 10px;
      border: 1px solid #ccc;
      background: #f9f9f9;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000;
      color: #fff;
      border: none;
      padding: 12px 24px;
      font-size: 12pt;
      cursor: pointer;
      font-weight: bold;
      border-radius: 4px;
    }

    .print-button:hover {
      background: #333;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ PRINT REPORT</button>

  <div class="header">
    <h1>Income Verification Report</h1>
    <div class="subtitle">Professional Mortgage Underwriting Analysis</div>
  </div>

  <div class="report-id">
    REPORT ID: ${escapeHtml(data.reportId)}
  </div>

  <div class="section">
    <div class="section-title">Loan Information</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Loan Number</span>
        <span class="info-value">${escapeHtml(data.loanNumber)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Borrower Name</span>
        <span class="info-value">${escapeHtml(data.borrowerName)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Loan Amount</span>
        <span class="info-value">${formatCurrency(data.loanAmount)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Property Address</span>
        <span class="info-value">${escapeHtml(data.propertyAddress)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Report Generated</span>
        <span class="info-value">${formatDate(data.generatedDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Generated By</span>
        <span class="info-value">${escapeHtml(data.generatedBy)}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Documents Reviewed</div>
    <div class="documents-list">
      <ol>
        ${data.documentsReviewed.map(doc => `<li>${escapeHtml(doc)}</li>`).join('')}
      </ol>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Multi-Guideline Income Analysis</div>
    
    ${data.calculations.map(calc => `
      <div class="calculation-box">
        <div class="calculation-header">
          ${escapeHtml(calc.loanType)} ANALYSIS
        </div>
        <div class="calculation-body">
          <div class="metric-row">
            <div class="metric">
              <span class="metric-label">Qualified Income</span>
              <div class="metric-value">${formatCurrency(calc.qualifiedIncome)}</div>
            </div>
            <div class="metric">
              <span class="metric-label">Back-End DTI Ratio</span>
              <div class="metric-value">${escapeHtml(calc.backEndRatio)}</div>
            </div>
            <div class="metric">
              <span class="metric-label">Risk Assessment</span>
              <div class="metric-value">
                <span class="risk-badge risk-${escapeHtml(calc.riskLevel.toLowerCase())}">${escapeHtml(calc.riskLevel.toUpperCase())}</span>
              </div>
            </div>
          </div>

          ${calc.warnings && calc.warnings.length > 0 ? `
            <div class="warnings-list">
              <strong>⚠️ Underwriting Warnings:</strong>
              <ul>
                ${calc.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="analysis-text">
            <strong>Analysis:</strong><br/>
            ${escapeHtml(calc.analysis)}
          </div>

          ${calc.citations && calc.citations.length > 0 ? `
            <div class="citations">
              <strong>Guideline Citations:</strong><br/>
              ${calc.citations.map(c => escapeHtml(c)).join(' | ')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <div class="disclaimer">
      <strong>DISCLAIMER:</strong> This income verification report is generated by AI-powered analysis and should be reviewed by a qualified underwriter. 
      All calculations are based on official FHA, VA, USDA, Fannie Mae, and Freddie Mac guidelines current as of the generation date. 
      This report is for professional mortgage underwriting use only and should not be used as the sole basis for lending decisions. 
      Verify all income sources with original documentation.
    </div>
    <p style="margin-top: 15px;">
      <strong>Mortgage AI 360</strong> | Powered by The Lawson Group<br/>
      Generated: ${formatDate(data.generatedDate)} | Report ID: ${escapeHtml(data.reportId)}
    </p>
  </div>
</body>
</html>`;
}
