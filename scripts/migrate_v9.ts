/**
 * Migration V9 — affiliate_programs table + radar fields in users
 * Run: npx tsx scripts/migrate_v9.ts
 */
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  const db = await getDb();
  console.log("[migrate_v9] Starting migration...");

  // 1. Add radar fields to users table
  const radarAlters = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS radar_unlocked_until TIMESTAMP NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS radar_trial_end TIMESTAMP NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS radar_searches_used INT NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS radar_subscribed TINYINT(1) NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS radar_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly'`,
  ];

  for (const alter of radarAlters) {
    try {
      await db.execute(sql.raw(alter));
      console.log(`[migrate_v9] ✓ ${alter.substring(0, 60)}...`);
    } catch (e: any) {
      if (e.message?.includes("Duplicate column")) {
        console.log(`[migrate_v9] ⚠ Column already exists, skipping`);
      } else {
        console.error(`[migrate_v9] ✗ Error: ${e.message}`);
      }
    }
  }

  // 2. Create affiliate_programs table
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS affiliate_programs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        category VARCHAR(50) NOT NULL,
        base_url VARCHAR(500),
        affiliate_id VARCHAR(255),
        commission_rate VARCHAR(50),
        cookie_duration VARCHAR(50),
        url_template TEXT,
        is_active TINYINT(1) NOT NULL DEFAULT 0,
        priority INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `));
    console.log("[migrate_v9] ✓ affiliate_programs table created");
  } catch (e: any) {
    console.error(`[migrate_v9] ✗ affiliate_programs: ${e.message}`);
  }

  console.log("[migrate_v9] Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
