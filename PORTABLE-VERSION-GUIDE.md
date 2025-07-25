# Zebulon AI System - Fully Portable Version Guide

## 🎯 Objective: Remove ALL Replit Dependencies

This guide ensures your Zebulon AI System is completely portable and works in any development environment, including VS Code, without any Replit-specific dependencies.

## 🗑️ Step 1: Remove Replit Files

When transferring to VS Code, delete these files/folders:
```bash
# Replit configuration files
rm -f .replit
rm -f replit.nix

# Replit cache and state directories  
rm -rf .cache/
rm -rf .local/

# Optional: Remove Replit-specific docs (keep if helpful)
# rm -f README.md (contains Replit references)
```

## 📦 Step 2: Replace Dependencies

### Current Replit-Specific Dependencies:
- `@neondatabase/serverless` - Neon/Replit serverless database
- `ws` - WebSocket for Neon configuration
- `openid-client` - May reference Replit OIDC (if using Replit auth)

### Standard Replacements:
```bash
# Remove Replit-specific packages
npm uninstall @neondatabase/serverless ws openid-client

# Install standard PostgreSQL and session packages
npm install pg drizzle-orm connect-pg-simple
npm install --save-dev @types/pg
```

## 🔧 Step 3: Update Database Connection

Replace `server/db.ts` entirely:

**FROM** (Replit/Neon specific):
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;
// ... rest of Neon config
```

**TO** (Standard PostgreSQL):
```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
```

## 🔐 Step 4: Update Authentication (Optional)

If using Replit auth, replace with standard authentication:

### Remove Replit OAuth:
- Delete `server/replitAuth.ts` (if exists)
- Remove any `REPL_ID`, `REPLIT_DOMAINS` environment variables

### Keep Standard Session Auth:
The current bcrypt + session-based auth is already portable and works everywhere.

## 🌍 Step 5: Environment Variables

Update `.env` to remove Replit-specific variables:

**Remove these:**
```env
REPL_ID=
REPLIT_DOMAINS=
ISSUER_URL=
```

**Keep these standard ones:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/zebulon"
SESSION_SECRET="your-strong-secret-key-here"
NODE_ENV="development"
PORT=5000
```

## 🛠️ Step 6: Database Options

### Option A: Local PostgreSQL
```bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql
# Windows: Download from postgresql.org

# Create database
createdb zebulon
```

### Option B: Cloud PostgreSQL (Free Options)
- **Supabase**: Free tier with 500MB
- **Railway**: Free tier with PostgreSQL
- **Neon.tech**: Keep using Neon but with standard `pg` client
- **ElephantSQL**: Free 20MB PostgreSQL

## 🚀 Step 7: VS Code Setup

1. **Open in VS Code**
2. **Install recommended extensions** (from `.vscode/extensions.json`)
3. **Set up database** (local or cloud)
4. **Update environment** (`.env` file)
5. **Install dependencies**: `npm install`
6. **Initialize database**: `npm run db:push`
7. **Start development**: `npm run dev`

## ✅ Verification Checklist

After transfer, verify no Replit dependencies remain:

- [ ] No `.replit` or `replit.nix` files
- [ ] No `@neondatabase/serverless` in package.json
- [ ] No `ws` package (unless needed for other features)
- [ ] No `REPL_ID` or `REPLIT_DOMAINS` in .env
- [ ] Database connection uses standard `pg` package
- [ ] Application starts with `npm run dev`
- [ ] All features work (login, chat, database)

## 🎉 Result

Your Zebulon AI System will be:
- ✅ **Completely portable** - Works in any Node.js environment
- ✅ **No vendor lock-in** - Use any PostgreSQL database
- ✅ **Standard stack** - Express + React + PostgreSQL
- ✅ **VS Code ready** - Full development environment configured
- ✅ **Production ready** - Deploy anywhere (Vercel, Heroku, Railway, etc.)

## 📞 Deployment Question

Regarding your question about undeploying: I don't have access to deployment controls, but here's what you can do:

1. **In Replit**: Go to your Repl → Deployments tab → Stop/Delete deployment
2. **Transfer the code**: Download/clone your project files
3. **Set up locally**: Follow this guide to make it portable
4. **Deploy elsewhere**: Use Vercel, Railway, or any hosting service

The project will be completely independent of Replit after following this guide!