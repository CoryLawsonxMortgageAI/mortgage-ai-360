# Mortgage AI 360 - Replit Setup

## Project Overview
AI-powered mortgage income verification and document classification system with integrated FHA, VA, USDA, Fannie Mae, and Freddie Mac guidelines.

## Recent Changes
- **Date**: 2025-10-31
- **MAJOR**: Implemented Professional Report Generation with Unique Report IDs
  - Black & white print-ready reports for mortgage underwriters
  - Unique Report ID system (format: RPT-{timestamp}-{random})
  - Multi-guideline analysis (FHA, VA, USDA, Fannie Mae, Freddie Mac) in single report
  - XSS protection via HTML escaping on all user inputs
  - Schema optimized: reportId VARCHAR(50), removed UNIQUE constraint for multi-guideline support
- **MAJOR**: Implemented Replit Auth (OpenID Connect) for enterprise-grade authentication
- Added financial-grade security features (HSTS, CSP, XSS protection, audit logging)
- Created sessions and auditLogs tables for compliance tracking
- Implemented role-based access control (admin/user roles)
- Added comprehensive audit logging for PII access (SSNs, DOBs, financial data)
- Migrated database schema from MySQL to PostgreSQL
- Configured Vite dev server to run on port 5000 with 0.0.0.0 host
- Applied all database migrations successfully (7 tables total)

## Project Architecture

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** with custom purple gradient theme
- **tRPC** for type-safe API calls
- **Wouter** for routing
- **shadcn/ui** components
- Runs on port 5000 via Vite dev server

### Backend
- **Express 4** with TypeScript
- **tRPC 11** for API layer
- **Drizzle ORM** with PostgreSQL
- **Built-in AI services** for analysis (via BUILT_IN_FORGE_API_URL)
- **Built-in Storage** for document storage
- Integrated with frontend on same port (5000)

### Database
- PostgreSQL (Replit's built-in database)
- Tables: users, loans, documents, incomeCalculations, guidelineCache, sessions, auditLogs
- **Security**: Database-backed session storage (not memory-based)
- **Compliance**: Audit logging for all sensitive data access

## Environment Configuration

### Required Environment Variables

#### Authentication (Automatic - Managed by Replit)
- `REPL_ID` - Application ID (automatically configured by Replit)
- `SESSION_SECRET` - Session encryption secret (automatically configured)
- `ISSUER_URL` - OpenID Connect issuer URL (defaults to https://replit.com/oidc)

#### AI & Storage (Automatic - Managed by Replit)
- `BUILT_IN_FORGE_API_URL` - URL for AI services (automatically configured)
- `BUILT_IN_FORGE_API_KEY` - API key for AI services (automatically configured)
- `DATABASE_URL` - PostgreSQL connection string (automatically configured)

#### Optional Branding
- `VITE_APP_TITLE` - Application title (optional, defaults to "App")
- `VITE_APP_LOGO` - Application logo URL (optional)
- `VITE_ANALYTICS_ENDPOINT` - Analytics endpoint (optional)
- `VITE_ANALYTICS_WEBSITE_ID` - Analytics website ID (optional)

### Current Status
- ✅ Database configured and migrations applied (7 tables)
- ✅ Server running on port 5000 with enterprise security headers
- ✅ **Replit Auth (OpenID Connect) fully implemented and tested**
- ✅ Session management with PostgreSQL storage
- ✅ Audit logging active for compliance
- ✅ Role-based access control (RBAC) ready
- ✅ Vite configured for Replit proxy
- ✅ Workflow configured and running

## Authentication & Security

### Replit Auth Implementation
- **Protocol**: OpenID Connect (industry standard for financial services)
- **Login Methods**: Google, GitHub, Apple, X (Twitter), Email/Password
- **Session Storage**: PostgreSQL (secure, persistent, multi-instance compatible)
- **Session Duration**: 7 days (configurable)
- **Token Refresh**: Automatic refresh token handling

### Security Features
- **HSTS**: HTTP Strict Transport Security (production only)
- **XSS Protection**: X-Content-Type-Options: nosniff
- **Clickjacking Protection**: X-Frame-Options: DENY
- **CSP**: Content Security Policy configured for PII protection
- **Referrer Policy**: strict-origin-when-cross-origin
- **Audit Logging**: All PII access logged with IP, user agent, timestamp

### Compliance Features (SOC 2, GLBA, Financial Services)
- **Audit Trail**: Complete logging of sensitive data access
  - Login/logout events
  - Loan creation/updates/deletion
  - Document viewing/uploading
  - PII access tracking
- **Role-Based Access**: Admin and User roles
- **Session Security**: Database-backed, encrypted sessions
- **Data Protection**: Security headers prevent common attacks

## Development Workflow
- **Dev Server**: `pnpm dev` (runs on port 5000)
- **Build**: `pnpm build`
- **Database Migrations**: `pnpm db:push`
- **Type Check**: `pnpm check`

## Deployment Notes
- Frontend and backend are served from the same Express server
- Port 5000 is used for both frontend and backend
- Static files are served from `dist/public` in production
- Database migrations should be run before deployment

## Feature Overview

### Core Functionality
- **AI-Powered Income Verification**
- **Multi-Guideline Support** (FHA, VA, USDA, Fannie Mae & Freddie Mac)
- **Professional Report Generation** with Unique Report IDs
  - Black & white print-ready format (8.5" x 11")
  - Comprehensive multi-guideline analysis
  - Compliance disclaimers and guideline citations
  - XSS-protected HTML output
  - Print button for easy printing
- Risk & Fraud Detection
- Document Classification (W2s, paystubs, tax returns, bank statements)
- DTI Ratio Calculation
- Missing Document Detection
- Income Trend Analysis

### Loan Types Supported
- FHA Loans - HUD Handbook 4000.1 compliant
- VA Loans - VA Lenders Handbook integration
- USDA Loans - HB-1-3555 Single Family Housing Program
- Conventional Loans - Fannie Mae & Freddie Mac Selling Guide

## How to Use

### First Time Setup
1. **Login**: Click "Sign In" or "Get Started" on the homepage
2. **Choose Provider**: Select Google, GitHub, Apple, X, or Email
3. **Authorize**: Grant permission to access your profile
4. **Auto-Created Account**: Your account is created automatically
5. **First User = Admin**: The first user to log in becomes the admin

### Authentication Flow
- Click "Sign In" → Redirected to Replit Auth → Choose provider → Redirected back logged in
- Sessions last 7 days before requiring re-login
- Logout via POST to `/api/logout`

### Admin Access
- First user to register automatically gets `admin` role
- Admins have full access to all features and data
- Regular users have restricted access based on role

## Report Generation

### Professional Reports for Underwriters
- **Endpoint**: `/api/reports/:reportId`
- **Format**: Black & white HTML (print-ready)
- **Security**: 
  - Authentication required
  - Loan ownership verified
  - XSS protection via HTML escaping
- **Features**:
  - Unique Report ID (RPT-{timestamp}-{random})
  - Multi-guideline analysis (5 loan types per report)
  - Qualified income, DTI ratios, risk levels
  - Warnings and detailed analysis
  - Official guideline citations
  - Compliance disclaimer
  - Print button for easy printing

### How to Generate a Report
1. Create a loan
2. Call `/api/trpc/income.calculateMultiGuideline` with loanId and document names
3. Receive reportId in response
4. View report at `/api/reports/{reportId}`
5. Print or save report for underwriter review

## Testing

### Test Guide
See `test-income-report.md` for comprehensive testing instructions including:
- Income calculation flow
- Report generation and viewing
- Security testing (auth, XSS protection)
- Report quality checks
- Database verification

## Next Steps
1. ✅ Authentication fully configured (Replit Auth)
2. ✅ Professional report generation implemented
3. Test loan creation and income calculation features (see test-income-report.md)
4. Test document upload and OCR processing
5. Configure deployment settings for production
6. Review audit logs for compliance verification
