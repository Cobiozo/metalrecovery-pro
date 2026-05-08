import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function ensureSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      is_active BOOLEAN NOT NULL DEFAULT true,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      ai_usage_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS system_stats (
      date TEXT NOT NULL,
      metric TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (date, metric)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_analysis_logs (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip TEXT NOT NULL,
      user_id INTEGER,
      user_email TEXT,
      materials_detected TEXT,
      item_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS visit_logs (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT ''
    )
  `);

  // Add date column if missing (for existing installations)
  await db.execute(sql`
    ALTER TABLE visit_logs ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT ''
  `);

  // Backfill date from created_at for existing rows
  await db.execute(sql`
    UPDATE visit_logs SET date = to_char(created_at, 'YYYY-MM-DD') WHERE date = ''
  `);

  // Remove duplicate (ip, date) pairs — keep only the oldest entry per pair
  await db.execute(sql`
    DELETE FROM visit_logs
    WHERE id NOT IN (
      SELECT MIN(id) FROM visit_logs GROUP BY ip, date
    )
  `);

  // Add unique index to prevent future duplicates
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS visit_logs_ip_date_uidx ON visit_logs (ip, date)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vision_corrections (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ai_material_type TEXT NOT NULL,
      correct_material_type TEXT NOT NULL,
      correction_note TEXT,
      image_description TEXT,
      user_id INTEGER,
      user_email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      promoted_rule_id INTEGER
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vision_prompt_rules (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      title TEXT NOT NULL,
      rule_text TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analysis_shares (
      id TEXT PRIMARY KEY,
      result_json TEXT NOT NULL,
      photo_data_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    )
  `);

  console.log("[migrate] Schema OK");
}
