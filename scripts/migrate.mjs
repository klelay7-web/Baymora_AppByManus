import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const isTiDB = url.includes("tidbcloud");

console.log(`[migrate] Connecting to ${isTiDB ? "TiDB Cloud (SSL)" : "MySQL"}...`);

const conn = await mysql.createConnection({
  uri: url,
  ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
  multipleStatements: true,
});

const sqlPath = path.resolve(__dirname, "..", "full-migration.sql");
console.log(`[migrate] Reading ${sqlPath}`);
const sqlContent = fs.readFileSync(sqlPath, "utf8");

const statements = sqlContent
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

console.log(`[migrate] Found ${statements.length} statements`);

let ok = 0;
let skipped = 0;
let errors = 0;

for (const stmt of statements) {
  const preview = stmt.substring(0, 80).replace(/\s+/g, " ");
  try {
    await conn.query(stmt);
    ok++;
    const tableMatch = stmt.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+[`"]?(\w+)[`"]?/i);
    if (tableMatch) {
      console.log(`[migrate] ✓ Created table: ${tableMatch[1]}`);
    } else {
      console.log(`[migrate] ✓ ${preview}`);
    }
  } catch (e) {
    if (
      e.code === "ER_TABLE_EXISTS_ERROR" ||
      e.code === "ER_DUP_FIELDNAME" ||
      e.code === "ER_DUP_KEYNAME" ||
      e.code === "ER_CANT_DROP_FIELD_OR_KEY"
    ) {
      skipped++;
      continue;
    }
    errors++;
    console.error(`[migrate] ✗ ${preview}`);
    console.error(`          ${e.code || ""}: ${e.message}`);
  }
}

await conn.end();

console.log(`\n[migrate] Done: ${ok} ok, ${skipped} skipped, ${errors} errors`);
process.exit(errors > 0 ? 1 : 0);
