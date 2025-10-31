# Income Calculation & Report Generation Test Guide

## Overview
This guide demonstrates how to test the professional income verification report system with unique Report IDs for mortgage underwriters.

## Prerequisites
- User must be logged in (first user becomes admin automatically)
- Server running on port 5000

## Test Flow

### Step 1: Create a Test Loan
After logging in, create a loan with the following details:
- Borrower Name: "John Smith"
- Loan Type: "FHA" (or any other type)
- Loan Amount: $350,000
- Property Address: "123 Main St, Springfield, IL 62701"

**Expected Result**: Loan created with a unique loan number (e.g., `LOAN-1730390000000-ABC123`)

### Step 2: Upload Documents
Upload or create test documents representing:
- W2 forms (2 years)
- Paystubs (recent 2 months)
- Tax returns (2 years)
- Bank statements

**Example Document Names**:
- 2023-W2-John-Smith.pdf
- 2024-Paystub-January.pdf
- 2024-Paystub-February.pdf
- 2023-Tax-Return.pdf
- 2024-Tax-Return.pdf

### Step 3: Run Multi-Guideline Income Calculation

**API Endpoint**: `POST /api/trpc/income.calculateMultiGuideline`

**Request Body** (via tRPC):
```json
{
  "loanId": 1,
  "documentNames": [
    "2023-W2-John-Smith.pdf",
    "2024-Paystub-January.pdf",
    "2024-Paystub-February.pdf",
    "2023-Tax-Return.pdf",
    "2024-Tax-Return.pdf"
  ]
}
```

**Expected Response**:
```json
{
  "reportId": "RPT-1730390000000-ABC123DEF",
  "calculations": [
    {
      "loanType": "FHA",
      "qualifiedIncome": 85000,
      "backEndRatio": "42.5%",
      "riskLevel": "medium",
      "warnings": ["Verify overtime income stability"],
      "analysis": "..."
    },
    {
      "loanType": "VA",
      "qualifiedIncome": 82000,
      "backEndRatio": "43.8%",
      "riskLevel": "medium",
      "warnings": ["Additional documentation needed"],
      "analysis": "..."
    },
    // ... (USDA, Conventional Fannie Mae, Conventional Freddie Mac)
  ],
  "documentsReviewed": [...]
}
```

**Key Points**:
- ✅ Returns a unique Report ID (format: `RPT-{timestamp}-{random}`)
- ✅ Calculates for **5 different loan types**: FHA, VA, USDA, Fannie Mae, Freddie Mac
- ✅ Each calculation is saved to the database with the same reportId
- ✅ No UNIQUE constraint errors (multiple calculations share same reportId)

### Step 4: View the Professional Report

**API Endpoint**: `GET /api/reports/{reportId}`

**Example**: `http://localhost:5000/api/reports/RPT-1730390000000-ABC123DEF`

**Expected Result**: 
- Professional black & white HTML report
- Print-ready format (8.5" x 11" letter size)
- Contains:
  - Report ID prominently displayed
  - Loan information (number, borrower, amount, address)
  - Documents reviewed list
  - Multi-guideline analysis for all 5 loan types
  - Qualified income, DTI ratios, risk levels
  - Warnings and analysis for each guideline
  - Official guideline citations
  - Compliance disclaimer
  - Print button for easy printing

### Step 5: Get Report Metadata (Optional)

**API Endpoint**: `GET /api/reports/{reportId}/metadata`

**Expected Response**:
```json
{
  "reportId": "RPT-1730390000000-ABC123DEF",
  "loanNumber": "LOAN-1730390000000-ABC123",
  "borrowerName": "John Smith",
  "loanAmount": 350000,
  "propertyAddress": "123 Main St, Springfield, IL 62701",
  "createdAt": "2025-10-31T14:30:00.000Z",
  "calculationCount": 5,
  "documentsReviewed": [...]
}
```

## Security Tests

### Test 1: Unauthorized Access
- **Action**: Access `/api/reports/{reportId}` without being logged in
- **Expected**: 401 Unauthorized error

### Test 2: Access Other User's Report
- **Action**: User A tries to access User B's report
- **Expected**: 403 Access Denied error

### Test 3: XSS Protection
- **Action**: Create loan with borrower name: `<script>alert('XSS')</script>`
- **Expected**: Script is escaped in report HTML, displays as plain text
- **Verification**: View page source and confirm it shows: `&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;`

**XSS Test Examples**:
```json
{
  "borrowerName": "<script>alert('XSS')</script>",
  "propertyAddress": "<img src=x onerror=alert('XSS')>",
  "documentNames": ["<script>steal_data()</script>.pdf"]
}
```

**All fields are protected**:
- ✅ reportId
- ✅ loanNumber  
- ✅ borrowerName
- ✅ propertyAddress
- ✅ generatedBy
- ✅ documentNames (all items)
- ✅ loanType
- ✅ backEndRatio
- ✅ riskLevel
- ✅ warnings (all items)
- ✅ analysis
- ✅ citations (all items)

## Report Quality Checks

### Visual Inspection
- ✅ Black and white color scheme (professional)
- ✅ Clear typography (Times New Roman, 11pt)
- ✅ Proper spacing and margins
- ✅ All sections clearly labeled
- ✅ Report ID prominently displayed
- ✅ Print button visible (hidden when printed)

### Content Completeness
- ✅ All 5 loan types analyzed (FHA, VA, USDA, Fannie, Freddie)
- ✅ Qualified income calculated for each
- ✅ DTI ratios displayed
- ✅ Risk levels shown with badges
- ✅ Warnings listed (if any)
- ✅ Analysis text included
- ✅ Guideline citations present
- ✅ Compliance disclaimer included

### Print Quality
- ✅ Fits on standard 8.5" x 11" paper
- ✅ No content cut off
- ✅ Page breaks appropriate
- ✅ Print button hidden in print view
- ✅ High contrast for readability

## Database Verification

**Check multiple calculations share same reportId**:
```sql
SELECT reportId, loanType, qualifiedIncome, backEndRatio, riskLevel
FROM "incomeCalculations"
WHERE reportId = 'RPT-1730390000000-ABC123DEF'
ORDER BY loanType;
```

**Expected Result**: 5 rows with same reportId, different loanType values

## Success Criteria

✅ Income calculation completes successfully for all 5 loan types
✅ Unique Report ID is generated (format: RPT-{timestamp}-{random})
✅ Multiple calculations can share the same reportId (no UNIQUE constraint error)
✅ Report is viewable via `/api/reports/{reportId}`
✅ Report displays all calculations in professional format
✅ Report is black & white and print-ready
✅ Report includes compliance disclaimer
✅ Only authorized users can access reports
✅ HTML injection is prevented (XSS protection)
✅ Report can be printed directly from browser

## Known Issues / Future Enhancements

1. **PDF Export**: Currently HTML only. Consider adding PDF generation for permanent storage.
2. **Email Delivery**: Add ability to email report to underwriters.
3. **Report Archive**: Add UI to view all reports for a loan.
4. **Digital Signature**: Consider adding digital signature capability for compliance.

## Troubleshooting

**Issue**: "UNIQUE constraint violation on reportId"
**Solution**: Run `pnpm db:push` to apply the latest schema changes (removed UNIQUE constraint)

**Issue**: "Report not found (404)"
**Solution**: Verify the income calculation completed successfully and check the database for the reportId

**Issue**: "Unauthorized (401)"
**Solution**: Make sure you're logged in via `/api/login`

**Issue**: Report shows `<script>` tags
**Solution**: Update to latest code - XSS protection has been added with HTML escaping
