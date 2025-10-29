# Mortgage AI 360

**Powered by The Lawson Group**

AI-powered mortgage income verification and document classification system with integrated FHA, VA, USDA, Fannie Mae, and Freddie Mac guidelines.

## 🎯 Overview

Mortgage AI 360 is a complete clone of Prudent.AI, built to move lending decisions upfront. It verifies income, classifies documents, and flags missing files at origination — building consistency, confidence, and compliance into every loan before it hits underwriting.

## ✨ Key Features

### Core Functionality
- **AI-Powered Income Verification** - Calculate qualified income in 2 minutes using official mortgage guidelines
- **Multi-Guideline Support** - Integrated with FHA, VA, USDA, Fannie Mae & Freddie Mac
- **Risk & Fraud Detection** - Real-time assessment of loan applications
- **Document Classification** - Automatic categorization of W2s, paystubs, tax returns, bank statements
- **DTI Ratio Calculation** - Front-end and back-end debt-to-income ratios with AI validation
- **Missing Document Detection** - Automated notifications for incomplete applications
- **Income Trend Analysis** - Track month-over-month income patterns

### Loan Types Supported
- **FHA Loans** - HUD Handbook 4000.1 compliant
- **VA Loans** - VA Lenders Handbook (Pamphlet 26-7) integration
- **USDA Loans** - HB-1-3555 Single Family Housing Program
- **Conventional Loans** - Fannie Mae & Freddie Mac Selling Guide

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** with custom purple gradient theme
- **tRPC** for type-safe API calls
- **Wouter** for routing
- **shadcn/ui** components

### Backend
- **Express 4** with TypeScript
- **tRPC 11** for API layer
- **Drizzle ORM** with MySQL/TiDB
- **OpenAI GPT-4** for AI analysis
- **S3** for document storage

### Database Schema
- `users` - User authentication and profiles
- `loans` - Loan applications and status
- `documents` - Uploaded mortgage documents
- `incomeCalculations` - Calculation history and results
- `guidelineCache` - Scraped mortgage guidelines

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- pnpm
- MySQL/TiDB database
- S3-compatible storage

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (automatically configured in Manus platform)

4. Push database schema:
   ```bash
   pnpm db:push
   ```

5. Run guideline scrapers:
   ```bash
   cd scrapers
   python3 run_all_scrapers.py --force
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

## 📊 Guideline Scrapers

The application includes automated web scrapers that download and parse official mortgage guidelines:

### Implemented Scrapers
- ✅ **FHA Scraper** - HUD Handbook 4000.1 (672 income requirements, 1,620 credit requirements)
- ✅ **VA Scraper** - Lenders Handbook & M26-1 Manual (203 income requirements, 356 credit requirements)
- ✅ **Fannie Mae Scraper** - Selling Guide (31 income requirements, 15 credit requirements)
- ✅ **Freddie Mac Scraper** - Seller/Servicer Guide (PDF-based extraction)
- ⏳ **USDA Scraper** - HB-1-3555 (pending server availability)

### Running Scrapers

```bash
cd scrapers

# Run all scrapers
python3 run_all_scrapers.py

# Force update (re-download all)
python3 run_all_scrapers.py --force

# Run individual scraper
python3 fha_scraper.py
```

Scraped data is stored in `/guidelines/combined_guidelines.json` and automatically loaded by the application.

## 🎨 Design

The application features a modern, professional design inspired by Prudent.AI:

- **Color Scheme**: Purple gradient (#667eea to #764ba2)
- **Typography**: Inter font family
- **Layout**: Responsive, mobile-first design
- **Components**: shadcn/ui with custom styling

## 🔐 Authentication

Built-in Manus OAuth integration provides:
- Secure user authentication
- Session management
- Role-based access control (admin/user)

## 📝 API Endpoints

### Loans
- `loans.list` - Get all loans for current user
- `loans.get` - Get single loan by ID
- `loans.create` - Create new loan
- `loans.update` - Update loan details
- `loans.delete` - Delete loan

### Documents
- `documents.list` - Get documents for a loan
- `documents.upload` - Upload document to S3
- `documents.delete` - Delete document

### Income Calculation
- `income.calculate` - AI-powered income calculation
- `income.history` - Get calculation history

### Guidelines
- `guidelines.search` - Search guidelines by source

## 🤖 AI Integration

The application uses OpenAI GPT-4 for:

1. **Income Verification** - Analyzes income sources against official guidelines
2. **Risk Assessment** - Evaluates loan risk (low/medium/high)
3. **Fraud Detection** - Identifies potential fraudulent applications
4. **Missing Document Detection** - Determines required documentation
5. **DTI Analysis** - Validates debt-to-income ratios

### AI Prompt System

The AI receives:
- Official guideline excerpts (FHA/VA/USDA/Fannie Mae/Freddie Mac)
- Income data from all sources
- Loan type and amount
- Monthly debt obligations

And returns structured JSON with:
- Qualified income amount
- DTI analysis
- Risk level
- Missing documents list
- Recommendations
- Warnings

## 📦 Deployment

The application is ready for deployment on the Manus platform:

1. Create a checkpoint:
   ```bash
   # Checkpoint is already created
   ```

2. Click "Publish" in the Manus UI

3. Configure custom domain (optional)

## 🔧 Development

### Project Structure

```
mortgage-ai-360/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── index.css      # Global styles
├── server/                # Backend Express application
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database queries
│   └── _core/             # Framework code
├── drizzle/               # Database schema
├── scrapers/              # Guideline scrapers
│   ├── fha_scraper.py
│   ├── va_scraper.py
│   ├── usda_scraper.py
│   ├── fannie_mae_scraper.py
│   ├── freddie_mac_scraper.py
│   └── run_all_scrapers.py
├── guidelines/            # Scraped guideline data
└── todo.md               # Feature tracking
```

### Key Files

- `drizzle/schema.ts` - Database schema definitions
- `server/routers.ts` - API endpoints and business logic
- `server/db.ts` - Database query helpers
- `client/src/pages/Home.tsx` - Landing page
- `client/src/pages/Dashboard.tsx` - Loan management
- `client/src/pages/Calculator.tsx` - Income calculator

## 📋 Feature Checklist

### Completed ✅
- Database schema (loans, documents, calculations, guidelines)
- Backend API (tRPC procedures for all operations)
- AI integration (income calculation, risk assessment, fraud detection)
- Landing page with Prudent.AI-inspired design
- Dashboard for loan management
- Income calculator interface
- Guideline scrapers (FHA, VA, Fannie Mae, Freddie Mac)
- Purple/blue gradient theme
- "Powered by The Lawson Group" branding

### Pending ⏳
- USDA scraper (server connectivity issues)
- Document upload UI with drag-and-drop
- Guideline reference page
- Performance optimization for large PDFs
- Mobile responsiveness testing

## 🐛 Known Issues

1. **USDA Scraper** - The USDA server (www.rd.usda.gov) is experiencing connectivity issues. The scraper will automatically retry when the server becomes available.

2. **Guideline Loading Warning** - Console shows warning about guideline data path. This is harmless and will be resolved on server restart.

## 📄 License

© 2025 Mortgage AI 360. Powered by The Lawson Group. All rights reserved.

## 🤝 Support

For questions or issues, please contact The Lawson Group.

---

**Note**: This application integrates with official FHA, VA, USDA, Fannie Mae, and Freddie Mac guidelines. All calculations and recommendations should be verified by qualified mortgage professionals before making lending decisions.
