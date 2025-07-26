import { PrismaClient } from '@prisma/client';

// Extend console.log to handle unknown error types
function logError(message: string, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.log(`${message}: ${errorMessage}`);
}

// Dual Database Configuration
const NEON_URL = process.env.DATABASE_URL_NEON || process.env.DATABASE_URL;
const LOCAL_URL = process.env.DATABASE_URL_LOCAL || `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

let activeConnection: 'neon' | 'local' = 'neon';
let db: PrismaClient;

async function testConnection(url: string): Promise<boolean> {
  try {
    const testClient = new PrismaClient({
      datasources: { db: { url } }
    });
    await testClient.$connect();
    await testClient.$queryRaw`SELECT 1`;
    await testClient.$disconnect();
    return true;
  } catch (error) {
    logError(`Database connection test failed for ${url}`, error);
    return false;
  }
}

async function initializeDatabase() {
  console.log('🔄 Initializing dual database system...');
  
  // First try Neon (primary online database)
  if (NEON_URL && await testConnection(NEON_URL)) {
    console.log('✅ Connected to Neon database (online mode)');
    db = new PrismaClient({
      datasources: { db: { url: NEON_URL } }
    });
    await db.$connect();
    activeConnection = 'neon';
    return db;
  }
  
  // Fallback to local database
  console.log('⚠️  Neon database unavailable, switching to local database...');
  if (LOCAL_URL && await testConnection(LOCAL_URL)) {
    console.log('✅ Connected to local database (offline mode)');
    db = new PrismaClient({
      datasources: { db: { url: LOCAL_URL } }
    });
    await db.$connect();
    activeConnection = 'local';
    return db;
  }
  
  throw new Error('❌ Both Neon and local databases are unavailable');
}

// Auto-switch database connection with retry logic
async function switchToBackup() {
  const backupUrl = activeConnection === 'neon' ? LOCAL_URL : NEON_URL;
  const backupMode = activeConnection === 'neon' ? 'local' : 'neon';
  
  if (backupUrl && await testConnection(backupUrl)) {
    console.log(`🔄 Switching from ${activeConnection} to ${backupMode} database`);
    // Disconnect current database
    await db.$disconnect();
    // Connect to backup database
    db = new PrismaClient({
      datasources: { db: { url: backupUrl } }
    });
    await db.$connect();
    activeConnection = backupMode as 'neon' | 'local';
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
initializeDatabase().catch(console.error);

export { db, executeWithFailover, activeConnection };
export function getActiveConnection() {
  return { connection: activeConnection, database: activeConnection === 'neon' ? 'Neon (Online)' : 'Local (Offline)' };
}