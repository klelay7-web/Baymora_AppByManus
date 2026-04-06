import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = readFileSync('./migrate-profiles.sql', 'utf-8');
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

const conn = await mysql.createConnection(url);
let success = 0;
let skipped = 0;

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    success++;
    console.log(`✅ ${stmt.substring(0, 80)}...`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.message?.includes('Duplicate column')) {
      skipped++;
      console.log(`⏭️ Skipped (already exists): ${stmt.substring(0, 60)}...`);
    } else {
      console.error(`❌ Error: ${err.message} — ${stmt.substring(0, 60)}...`);
    }
  }
}

console.log(`\n✅ Migration done: ${success} applied, ${skipped} skipped`);
await conn.end();
