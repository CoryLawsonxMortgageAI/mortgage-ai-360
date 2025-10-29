# Mortgage AI 360 - Project TODO

## Core Features

### Database Schema
- [x] Create loans table for storing loan applications
- [x] Create documents table for uploaded files
- [x] Create income_calculations table for storing calculation results
- [x] Create guideline_cache table for storing scraped guidelines
- [ ] Add indexes for performance optimization

### Backend API (tRPC Procedures)
- [x] Loan management procedures (create, list, get, update, delete)
- [x] Document upload and processing procedures
- [x] Income calculation procedure with AI integration
- [x] Guideline query procedures (FHA, VA, USDA, Fannie Mae, Freddie Mac)
- [x] Document classification procedure
- [x] Risk assessment procedure
- [x] Missing document detection procedure

### AI Integration
- [x] Integrate guideline data with AI model
- [x] Create AI prompt system for income calculation
- [x] Implement document analysis AI
- [x] Add fraud detection AI logic
- [x] Create DTI ratio calculation with AI validation

### Frontend Pages
- [x] Landing page with hero section and features
- [x] Dashboard for loan management
- [x] Loan creation/upload page
- [x] Income calculation results page
- [ ] Document verification page
- [ ] Guideline reference page
- [ ] Settings page

### Frontend Components
- [ ] File upload component with drag-and-drop
- [ ] Income calculator interface
- [ ] Document viewer component
- [ ] Loan status cards
- [ ] Income trend charts
- [ ] Risk indicator badges
- [ ] Guideline search component

### Guideline Scrapers
- [x] FHA scraper (HUD Handbook 4000.1)
- [x] VA scraper (Lenders Handbook & M26-1)
- [ ] USDA scraper (HB-1-3555) - needs retry
- [x] Fannie Mae scraper (Selling Guide)
- [x] Freddie Mac scraper (Seller/Servicer Guide)
- [ ] Automated update scheduler for guidelines

### Features Matching Prudent.AI
- [ ] Upfront income verification
- [ ] Bank statement analysis
- [ ] W2 and tax form processing
- [ ] Business return analysis
- [ ] Rental income calculation
- [ ] Overtime/bonus/commission analysis
- [ ] 2-minute QI calculation
- [ ] Risk and fraud detection
- [ ] Missing file notifications
- [ ] Income trend analysis (13.4% example)
- [ ] Debt-to-income ratio tracking
- [ ] Healthy month-start balance check
- [ ] Fluctuating income detection
- [ ] Prequal letter generation
- [ ] Fannie Mae Income Calculator integration

### Branding
- [x] Update app title to "Mortgage AI 360"
- [x] Add "Powered by The Lawson Group" branding
- [ ] Create custom logo
- [x] Design purple/blue gradient theme matching Prudent.AI

### Testing & Optimization
- [ ] Test all income calculation scenarios
- [ ] Test document upload and processing
- [ ] Test guideline queries
- [ ] Performance optimization for large PDFs
- [ ] Mobile responsiveness testing

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Deployment instructions
- [ ] Scraper maintenance guide

## New Feature Requests (User Requested)

### Document Upload & Multi-Guideline Calculation
- [x] Add drag-and-drop document upload interface to calculator
- [x] Implement automatic income extraction from uploaded documents (W2s, paystubs, tax returns, bank statements)
- [x] Calculate income for ALL loan types simultaneously (FHA, VA, USDA, Conventional Fannie Mae, Freddie Mac)
- [x] Generate unique report ID for each calculation
- [x] Display side-by-side comparison of income calculations for all 5 loan types
- [x] Include guideline citations for each calculation showing which specific guideline was used
- [x] Show document sources reviewed for each calculation
- [x] Allow loan officer to select best option for client
- [ ] Export comparison report with all calculations and citations (PDF export)


## Ocrolus-Style Professional Interface (User Requested)

- [x] Rebuild interface to match Ocrolus.com/mortgage professional dark theme design
- [x] Implement UPLOAD button with file picker (professional alternative to drag-drop)
- [x] Add document list with file preview and sizes
- [x] Create dark-themed dashboard with sidebar navigation
- [x] Display line-item income extraction from tax forms (Form 1120)
- [x] Implement year-over-year comparison tables (2024 vs 2023)
- [x] Add lock/unlock functionality for data verification
- [x] Create configuration panel with calculation settings
- [x] Show recommended calculation based on Fannie Mae guidelines
- [x] Display liquidity ratios (current ratio, quick ratio)
- [x] Add insights panel with discrepancy detection
- [x] Implement Ocrolus-style results visualization with multi-guideline comparison
- [x] Add professional tabs for different income types (Summary, Wage earner, Self-employed, Rental, Other)
- [ ] Add real-time OCR document processing (requires OCR API integration)
- [ ] Add document confidence scores from OCR
