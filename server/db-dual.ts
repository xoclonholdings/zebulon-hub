import { PrismaClient } from '@prisma/client';

const production = process.env.NODE_ENV === 'production';
const canonicalUrl = process.env.DATABASE_URL;
const localUrl = process.env.DATABASE_URL_LOCAL || (
  process.env.PGUSER && process.env.PGPASSWORD && process.env.PGHOST && process.env.PGPORT && process.env.PGDATABASE
    ? `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`
    : undefined
);

type ConnectionMode = 'canonical' | 'local-development' | 'unavailable';
let activeConnection: ConnectionMode = 'unavailable';
let db: PrismaClient | undefined;

async function connect(url: string): Promise<PrismaClient> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  await client.$connect();
  await client.$queryRaw`SELECT 1`;
  return client;
}

async function initializeDatabase(): Promise<PrismaClient> {
  if (canonicalUrl) {
    db = await connect(canonicalUrl);
    activeConnection = 'canonical';
    console.log('[DATABASE] Connected to canonical ZCOS PostgreSQL authority');
    return db;
  }

  if (production) {
    throw new Error('DATABASE_URL is required in production; ZCOS will not fail over to a second authority');
  }

  if (localUrl) {
    db = await connect(localUrl);
    activeConnection = 'local-development';
    console.log('[DATABASE] Using local PostgreSQL for development only');
    return db;
  }

  throw new Error('No development database is configured');
}

const ready = initializeDatabase().catch((error) => {
  console.error('[DATABASE] initialization failed:', error instanceof Error ? error.message : String(error));
  if (production) process.exitCode = 1;
  throw error;
});

export async function getDatabase(): Promise<PrismaClient> {
  return db ?? ready;
}

/**
 * Compatibility wrapper retained while legacy callers migrate. It never changes
 * the production database authority.
 */
export async function executeWithFailover<T>(operation: () => Promise<T>): Promise<T> {
  await getDatabase();
  return operation();
}

export { db, activeConnection };

export function getActiveConnection() {
  return {
    connection: activeConnection,
    database: activeConnection === 'canonical' ? 'Canonical PostgreSQL' : activeConnection === 'local-development' ? 'Local Development PostgreSQL' : 'Unavailable',
  };
}
