import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Dual Database Configuration
const NEON_URL = process.env.DATABASE_URL_NEON || process.env.DATABASE_URL;
const LOCAL_URL = process.env.DATABASE_URL_LOCAL || 'postgresql://postgres:postgres@localhost:5432/zebulon_local';

let activeConnection: 'neon' | 'local' = 'neon';
let db: ReturnType<typeof drizzle>;

async function testConnection(url: string): Promise<boolean> {
  try {
    const testPool = new Pool({ connectionString: url });
    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();
    await testPool.end();
    return true;
  } catch (error) {
    console.log(`Database connection test failed for ${url}:`, error.message);
    return false;
  }
}

async function initializeDatabase() {
  console.log('🔄 Initializing dual database system...');
  
  // First try Neon (primary online database)
  if (NEON_URL && await testConnection(NEON_URL)) {
    console.log('✅ Connected to Neon database (online mode)');
    const pool = new Pool({ connectionString: NEON_URL });
    db = drizzle({ client: pool, schema });
    activeConnection = 'neon';
    return db;
  }
  
  // Fallback to local database
  console.log('⚠️  Neon database unavailable, switching to local database...');
  if (await testConnection(LOCAL_URL)) {
    console.log('✅ Connected to local database (offline mode)');
    const pool = new Pool({ connectionString: LOCAL_URL });
    db = drizzle({ client: pool, schema });
    activeConnection = 'local';
    return db;
  }
  
  throw new Error('❌ Both Neon and local databases are unavailable');
}

// Auto-switch database connection with retry logic
async function switchToBackup() {
  const backupUrl = activeConnection === 'neon' ? LOCAL_URL : NEON_URL;
  const backupMode = activeConnection === 'neon' ? 'local' : 'neon';
  
  if (await testConnection(backupUrl)) {
    console.log(`🔄 Switching from ${activeConnection} to ${backupMode} database`);
    const pool = new Pool({ connectionString: backupUrl });
    db = drizzle({ client: pool, schema });
    activeConnection = backupMode;
    return true;
  }
  return false;
}

// Enhanced database wrapper with automatic failover
async function executeWithFailover<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.log(`Database operation failed on ${activeConnection}, attempting failover...`);
    
    if (await switchToBackup()) {
      try {
        return await operation();
      } catch (fallbackError) {
        console.error('Operation failed on both databases:', fallbackError);
        throw fallbackError;
      }
    } else {
      console.error('Failover unsuccessful, both databases unavailable');
      throw error;
    }
  }
}

// Initialize the database connection
await initializeDatabase();

export { db, executeWithFailover, activeConnection };
export function getActiveConnection() {
  return { connection: activeConnection, database: activeConnection === 'neon' ? 'Neon (Online)' : 'Local (Offline)' };
}