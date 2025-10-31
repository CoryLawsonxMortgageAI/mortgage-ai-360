# Income Verification Test Scenario
## Mortgage AI 360 - Real-World Testing with Tax Documents

### Scenario Overview
**Applicants**: RAYMAR & GENEE DUMAS  
**Property**: 3218 Timberstone Drive, Canal Winchester, OH 43110  
**Loan Type**: FHA Purchase Loan  
**Requested Loan Amount**: $280,000  
**Application Date**: October 31, 2025

---

## Borrower Profile

### Personal Information
- **Primary Borrower**: Raymar Dumas (SSN: 283-86-4111)
- **Co-Borrower**: Genee Dumas (SSN: 279-88-2473)
- **Current Address**: 3218 Timberstone Drive, Canal Winchester, OH 43110

### Business Ownership
1. **NEXT LEVEL LOUNGE LLC** (EIN: 84-5075196)
   - Business Type: Bar & Grill
   - Started: May 1, 2022
   - Location: 1884 Tamarack Cir S, Columbus, OH 43229
   - Ownership: Partnership (3 partners)

2. **DYNASTY HAIR SUPPLY LLC** (EIN: 99-2113566)
   - Business Type: Beauty Supply
   - Started: March 25, 2024
   - Location: 3218 Timberstone Dr, Canal Winchester, OH 43110
   - Ownership: Partnership (2 partners)

---

## Documents Provided

### Individual Tax Returns
1. **2024 Form 1040** (Raymar & Genee Dumas)
   - Adjusted Gross Income: $35,234
   - Total Tax: $3,798
   - Refund: $1,273
   - Filing Status: Married Filing Jointly

2. **2023 Form 1040** (Raymar Dumas)
   - Adjusted Gross Income: -$21,277 (Loss)
   - Total Tax: $0
   - Filing Status: Single

### Business Tax Returns

3. **2024 Form 1065** (NEXT LEVEL LOUNGE LLC)
   - Gross Receipts: $205,305
   - Gross Profit: $111,409
   - Ordinary Business Income: $82,636
   - Cost of Goods Sold: $93,896
   - Salaries & Wages: $11,495
   - Rent: $18,006
   - Taxes & Licenses: $34,716

4. **2023 Form 1065** (NEXT LEVEL LOUNGE LLC)
   - Gross Receipts: $208,338
   - Gross Profit: $86,636
   - Ordinary Business Income: -$63,819 (Loss)
   - Cost of Goods Sold: $121,702
   - Salaries & Wages: $14,894
   - Rent: $22,500
   - Taxes & Licenses: $34,621

5. **2024 Form 1065** (DYNASTY HAIR SUPPLY LLC)
   - Gross Receipts: $61,208
   - Gross Profit: $41,885
   - Ordinary Business Income: -$1,350 (Loss)
   - Cost of Goods Sold: $19,323
   - Salaries & Wages: $10,750
   - Rent: $11,200

---

## Income Analysis

### Individual Income (W-2/Wages)
- **2024**: $35,234 AGI
- **2023**: -$21,277 AGI (Loss from business)
- **Average 2-Year Income**: $6,979

### Self-Employment Income (Partnership K-1)

#### NEXT LEVEL LOUNGE LLC (Bar & Grill)
- **2024 Income**: $82,636
- **2023 Income**: -$63,819 (Loss)
- **Trend**: Significant improvement from loss to profit
- **Analysis**: Business turned profitable in year 2

#### DYNASTY HAIR SUPPLY LLC (Beauty Supply)
- **2024 Income**: -$1,350 (Loss)
- **2023 Income**: N/A (Started March 2024)
- **Analysis**: New business, start-up phase loss

### Total Qualifying Income (Projected)
**Conservative Estimate** (Per FHA Guidelines):
- W-2 Income: $35,234 (2024 actual)
- Self-Employment (NEXT LEVEL): $82,636 ÷ 3 partners ≈ $27,545/partner
- Self-Employment (DYNASTY): Excluded (loss)
- **Total Estimated Annual Income**: ~$62,779

---

## Test Execution Steps

### Step 1: Create Loan Application
```json
{
  "borrowerName": "RAYMAR & GENEE DUMAS",
  "loanType": "FHA",
  "loanAmount": 280000,
  "propertyAddress": "3218 Timberstone Drive, Canal Winchester, OH 43110"
}
```

### Step 2: Upload Tax Documents
Upload the following documents to the loan file:
1. `duma4111_24i_FC_1761927277443.pdf` - 2024 Individual Return
2. `duma4111_23i_FC_1761927279710.pdf` - 2023 Individual Return
3. `next5196_24p_FC_1761927272956.pdf` - 2024 NEXT LEVEL LOUNGE
4. `next5196_23p_FC(1)_1761927281637.pdf` - 2023 NEXT LEVEL LOUNGE
5. `dyna3566_24p_FC_1761927275445.pdf` - 2024 DYNASTY HAIR SUPPLY

### Step 3: Run Multi-Guideline Income Calculation
```javascript
// API Call
income.calculateMultiGuideline({
  loanId: 1,
  documentNames: [
    "2024-1040-Raymar-Genee-Dumas.pdf",
    "2023-1040-Raymar-Dumas.pdf",
    "2024-1065-Next-Level-Lounge.pdf",
    "2023-1065-Next-Level-Lounge.pdf",
    "2024-1065-Dynasty-Hair-Supply.pdf"
  ]
})
```

### Step 4: Review AI Analysis
Expected AI analysis should consider:
- **Stability**: Business showed losses in 2023 but profitable in 2024
- **Trend**: Positive income trend for NEXT LEVEL LOUNGE
- **Risk Factors**: 
  - New business (DYNASTY) showing loss
  - Prior year individual loss
  - Business income volatility
- **DTI Calculation**: 
  - Monthly Income: ~$5,232
  - Estimated Monthly Debt: Unknown (need credit report)
  - Loan Payment (P&I): ~$1,650/month (@6.5% for 30 years)

---

## Expected Report Output

### Multi-Guideline Analysis Results

#### FHA Loan Analysis
- **Qualified Income**: $62,779 annually ($5,232/month)
- **Back-End DTI**: ~45% (assuming $750 other debts)
- **Risk Level**: Medium
- **Warnings**:
  - Prior year business losses require explanation
  - Verify partnership ownership percentage
  - Need 2 years stable self-employment income
  - New business income not qualifying (loss)
- **FHA Guideline Citations**:
  - HUD Handbook 4000.1 - Section II.A.4.d (Self-Employment Income)
  - HUD Handbook 4000.1 - Section II.A.4.b.iv (Income Trends)

#### VA Loan Analysis
- **Qualified Income**: $58,000 annually
- **Back-End DTI**: ~47%
- **Risk Level**: Medium-High
- **Warnings**:
  - Business income stability concerns
  - Compensating factors needed

#### USDA Loan Analysis
- **Qualified Income**: $60,500 annually
- **Back-End DTI**: ~46%
- **Risk Level**: Medium
- **Warnings**:
  - Income limits for USDA may apply
  - Rural property location verification needed

#### Conventional (Fannie Mae) Analysis
- **Qualified Income**: $61,000 annually
- **Back-End DTI**: ~46%
- **Risk Level**: Medium
- **Warnings**:
  - 2-year average required for self-employment
  - Business loss year requires compensating factors

#### Conventional (Freddie Mac) Analysis
- **Qualified Income**: $61,500 annually
- **Back-End DTI**: ~45%
- **Risk Level**: Medium
- **Warnings**:
  - Income stability documentation required
  - Consider DTI compensation with reserves

---

## Testing Checklist

### ✅ Functional Tests
- [ ] Loan creation with borrower information
- [ ] Document upload (5 tax documents)
- [ ] Multi-guideline income calculation
- [ ] Report ID generation (format: RPT-{timestamp}-{random})
- [ ] Professional report generation
- [ ] Report viewing at `/api/reports/{reportId}`

### ✅ Security Tests
- [ ] Authentication required for report access
- [ ] Ownership verification (only loan owner can view)
- [ ] XSS protection on borrower name
- [ ] XSS protection on property address
- [ ] XSS protection on document names

### ✅ Data Quality Tests
- [ ] All 5 loan types analyzed
- [ ] Qualified income calculations accurate
- [ ] DTI ratios displayed correctly
- [ ] Risk levels appropriate
- [ ] Warnings relevant and specific
- [ ] Guideline citations included

### ✅ Report Quality Tests
- [ ] Black & white professional format
- [ ] Print-ready (8.5" x 11")
- [ ] All sections present (loan info, documents, analysis)
- [ ] Compliance disclaimer included
- [ ] Print button functional
- [ ] Report ID prominently displayed

---

## Expected Underwriting Decision

**Recommendation**: CONDITIONAL APPROVAL (FHA)

**Conditions**:
1. Letter of Explanation for 2023 business losses
2. Verification of partnership ownership percentage (K-1 statements)
3. Year-to-date profit & loss statements for both businesses
4. Business bank statements (last 3 months)
5. Credit report and score verification
6. Verification of employment stability
7. Reserves requirement: 3 months PITI

**Compensating Factors**:
- Positive income trend (2023 loss → 2024 profit)
- Multiple income sources
- Property appears to be in good location
- FHA allows up to 50% DTI with compensating factors

---

## Database Verification

After test execution, verify database entries:

```sql
-- Check loan creation
SELECT * FROM loans WHERE "borrowerName" = 'RAYMAR & GENEE DUMAS';

-- Check income calculations
SELECT reportId, loanType, qualifiedIncome, backEndRatio, riskLevel
FROM "incomeCalculations"
WHERE loanId = (SELECT id FROM loans WHERE "borrowerName" = 'RAYMAR & GENEE DUMAS')
ORDER BY loanType;

-- Verify 5 calculations share same reportId
SELECT reportId, COUNT(*) as calculation_count
FROM "incomeCalculations"
GROUP BY reportId
HAVING COUNT(*) = 5;
```

---

## Notes & Observations

### Business Income Considerations
1. **Partnership Income Distribution**: Need to verify ownership percentage to calculate accurate K-1 income allocation
2. **2-Year Requirement**: Most guidelines require 2 years of tax returns for self-employment - applicant meets this for NEXT LEVEL LOUNGE
3. **Loss Year Treatment**: 2023 losses may be averaged with 2024 income or require explanation letter
4. **New Business**: DYNASTY HAIR SUPPLY income not qualifying (less than 2 years + current loss)

### Underwriting Red Flags
- ⚠️ Volatile income history
- ⚠️ Prior year individual negative AGI
- ⚠️ New business showing loss
- ✅ Improving business performance
- ✅ Multiple income streams (diversification)

### Strengths
- Business turned profitable in Year 2
- Multiple businesses show entrepreneurial capability
- Real estate investment (property ownership)
- Tax documents complete and filed timely

---

## Success Criteria

✅ System correctly identifies self-employment income  
✅ System analyzes 2-year income trends  
✅ System calculates partner/member share of income  
✅ System flags income stability concerns  
✅ System provides guideline-specific analysis  
✅ Report is professional and print-ready  
✅ All security protections work correctly  
✅ Database stores all 5 calculations with shared reportId  

---

**Test Date**: October 31, 2025  
**Tester**: Mortgage AI 360 System  
**Status**: Ready for execution
