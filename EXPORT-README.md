# Zebulon AI System - Export Package

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Development**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

5. **Production**
   ```bash
   npm run build
   npm start
   ```
   - Unified server: http://localhost:5000

## Environment Variables Required

Create `.env` file with:
```
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
NODE_ENV="development"
```

## System Requirements

- Node.js 18+ (tested with v20.19.3)
- PostgreSQL database (or Neon.tech serverless)
- 1GB RAM minimum

## Production Deployment

The system is completely self-contained with:
- Zero Replit dependencies
- Standard Node.js/React stack
- PostgreSQL with Prisma ORM
- Vite build system (no deprecated APIs)

Ready for deployment to any Node.js hosting platform.