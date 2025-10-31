# Mortgage AI 360 - Replit Setup

## Project Overview
AI-powered mortgage income verification and document classification system with integrated FHA, VA, USDA, Fannie Mae, and Freddie Mac guidelines.

## Recent Changes
- **Date**: 2025-10-31
- Migrated database schema from MySQL to PostgreSQL to match Replit's database offering
- Configured Vite dev server to run on port 5000 with 0.0.0.0 host for Replit proxy
- Added Replit domains (.replit.dev, .repl.co) to allowed hosts in Vite config
- Updated workflow to run on port 5000
- Applied database migrations successfully

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
- Tables: users, loans, documents, incomeCalculations, guidelineCache

## Environment Configuration

### Required Environment Variables
The following environment variables need to be configured for full functionality:

#### OAuth Configuration (Required for Authentication)
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL for user authentication
- `VITE_APP_ID` - Application ID for OAuth
- `OAUTH_SERVER_URL` - OAuth server URL for backend
- `JWT_SECRET` - Secret for session token security
- `OWNER_OPEN_ID` - Open ID of the application owner (for admin access)

#### AI & Storage (Managed by Replit)
- `BUILT_IN_FORGE_API_URL` - URL for AI services (automatically configured)
- `BUILT_IN_FORGE_API_KEY` - API key for AI services (automatically configured)
- `DATABASE_URL` - PostgreSQL connection string (automatically configured)

### Current Status
- ✅ Database configured and migrations applied
- ✅ Server running on port 5000
- ⚠️ OAuth not configured - authentication will not work until OAuth environment variables are set
- ✅ Vite configured for Replit proxy
- ✅ Workflow configured and running

## Known Issues
1. **OAuth Configuration Required**: The application requires OAuth environment variables to be set for user authentication. Until these are configured, users will see an error when trying to access the application.

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
- AI-Powered Income Verification
- Multi-Guideline Support (FHA, VA, USDA, Fannie Mae & Freddie Mac)
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

## Next Steps
1. Configure OAuth environment variables for authentication
2. Test all features with OAuth enabled
3. Configure deployment settings
4. Test document upload and processing features
