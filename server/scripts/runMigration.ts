/**
 * runMigration.ts
 * Applies drizzle/0024_outbound_clicks.sql to the TiDB database.
 *
 * Usage: npx tsx server/scripts/runMigration.ts
 *
 * Requires DATABASE_URL. SSL is forced when the URL contains tidbcloud.
 * The migration file uses CREATE TABLE IF NOT EXISTS so re-running is safe.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_FILE = path.resolve(__dirname, "..", "..", "drizzle", "0024_outbound_clicks.sql");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[migration] DATABASE_URL is required");
    process.exit(1);
  }

  const isTiDB = url.includes("tidbcloud");
  console.log(`[migration] Connecting to ${isTiDB ? "TiDB Cloud (SSL)" : "MySQL"}…`);

  const conn = await mysql.createConnection({
    uri: url,
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
    multipleStatements: true,
  });

  try {
    console.log(`[migration] Reading ${MIGRATION_FILE}`);
    const sql = fs.readFileSync(MIGRATION_FILE, "utf8");

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`[migration] Executing ${statements.length} statement(s)…`);

    let ok = 0;
    let skipped = 0;

    for (const stmt of statements) {
      const preview = stmt.substring(0, 80).replace(/\s+/g, " ");
      try {
        await conn.query(stmt);
        ok++;
        const tableMatch = stmt.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+[`"]?(\w+)[`"]?/i);
        if (tableMatch) {
          console.log(`[migration] ✓ Table ready: ${tableMatch[1]}`);
        } else {
          console.log(`[migration] ✓ ${preview}`);
        }
      } catch (err: any) {
        if (
          err.code === "ER_TABLE_EXISTS_ERROR" ||
          err.code === "ER_DUP_KEYNAME" ||
          err.code === "ER_DUP_FIELDNAME"
        ) {
          skipped++;
          console.log(`[migration] ⊘ already exists: ${preview}`);
          continue;
        }
        console.error(`[migration] ✗ ${preview}`);
        console.error(`            ${err.code || ""}: ${err.message}`);
        throw err;
      }
    }

    console.log(`\n[migration] Done: ${ok} ok, ${skipped} skipped`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[migration] Fatal error:", err);
  process.exit(1);
});
