# Remove Replit Dependencies - VS Code Transfer Guide

## Current Replit-Specific Dependencies to Remove/Replace

### 1. Database Dependencies
**Current**: `@neondatabase/serverless` (Replit/Neon specific)
**Replace with**: Standard PostgreSQL client

### 2. Files to Delete When Transferring
```bash
# Delete these Replit-specific files:
rm -rf .replit
rm -rf replit.nix
rm -rf .cache/
rm -rf .local/
```

### 3. Replace Database Connection
**File**: `server/db.ts`
**Current**: Uses Neon serverless with WebSocket constructor
**Replace with**: Standard PostgreSQL connection

```typescript
// REPLACE THIS (Replit/Neon specific):
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// WITH THIS (Standard PostgreSQL):
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
```

### 4. Update Package Dependencies
**Remove these Replit-specific packages:**
- `@neondatabase/serverless`
- `ws` (if only used for Neon)

**Add standard PostgreSQL:**
```bash
npm install pg drizzle-orm
npm install --save-dev @types/pg
```

### 5. Environment Variables
**Update `.env` from Replit format to standard:**
```env
# Remove Replit-specific variables:
REPL_ID=
REPLIT_DOMAINS=

# Keep only standard variables:
DATABASE_URL="postgresql://user:password@localhost:5432/zebulon"
SESSION_SECRET="your-secret-key"
NODE_ENV="development"
```

### 6. Updated Database Connection (server/db.ts)
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

## Steps for Clean VS Code Transfer

1. **Download/Clone** the current project
2. **Delete Replit files**: `.replit`, `replit.nix`, `.cache/`, `.local/`
3. **Replace database connection** as shown above
4. **Update dependencies** with standard PostgreSQL
5. **Set up local PostgreSQL** or use any cloud PostgreSQL provider
6. **Update `.env`** with your database connection string
7. **Run in VS Code**: `npm install && npm run dev`

## Benefits of Removal
- ✅ No Replit hosting dependencies
- ✅ Works with any PostgreSQL database
- ✅ Standard Node.js/Express stack
- ✅ Portable to any development environment
- ✅ No vendor lock-in

The project will be completely independent and transferable to any development environment!