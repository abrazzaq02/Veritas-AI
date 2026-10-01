import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import {
  drizzle as drizzlePostgres,
  type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __veritasDbPromise?: Promise<NodePgDatabase>;
  __veritasPglite?: PGlite;
};

async function ensureUserRoleColumnForDb(
  database: NodePgDatabase | { execute: (query: unknown) => Promise<unknown> },
): Promise<void> {
  try {
    await (database as { execute: (query: unknown) => Promise<unknown> }).execute(
      sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'student';`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('does not exist') && !message.includes('already exists')) {
      throw error;
    }
  }
}

async function createDatabase(): Promise<NodePgDatabase> {
  if (databaseUrl) {
    const pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({ connectionString: databaseUrl });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }

    const database = drizzlePostgres(pool);

    await migrate(database, {
      migrationsFolder: resolve(process.cwd(), "drizzle"),
    });

    await ensureUserRoleColumnForDb(database);

    return database;
  }

  const dataDirectory = resolve(process.cwd(), ".local-data");
  await mkdir(dataDirectory, { recursive: true });

  const client =
    globalForDb.__veritasPglite ??
    new PGlite(resolve(dataDirectory, "veritas"));
  globalForDb.__veritasPglite = client;
  await client.waitReady;

  const embeddedDb = drizzlePglite(client);
  await migratePglite(embeddedDb, {
    migrationsFolder: resolve(process.cwd(), "drizzle"),
  });

  await ensureUserRoleColumnForDb(embeddedDb as unknown as NodePgDatabase);

  return embeddedDb as unknown as NodePgDatabase;
}

async function getDatabase(): Promise<NodePgDatabase> {
  if (!globalForDb.__veritasDbPromise) {
    globalForDb.__veritasDbPromise = createDatabase();
  }

  try {
    return await globalForDb.__veritasDbPromise;
  } catch (error) {
    globalForDb.__veritasDbPromise = undefined;
    throw error;
  }
}

export const db = await getDatabase();
