import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Do not throw at module load — allow bundling on environments without DATABASE_URL
// (e.g. Cyberfolks shared hosting). Code that uses `db` is always guarded
// by a DATABASE_URL check before calling any db method.
const DATABASE_URL = process.env.DATABASE_URL ?? "";

export const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL })
  : (null as unknown as InstanceType<typeof Pool>);

export const db = DATABASE_URL
  ? drizzle(pool, { schema })
  : (null as unknown as NodePgDatabase<typeof schema>);

export * from "./schema";
