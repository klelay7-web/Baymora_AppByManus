import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = fs.readFileSync("drizzle/0015_sloppy_spencer_smythe.sql", "utf8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database");
  
  for (let i = 0; i < statements.length; i++) {
    try {
      await connection.execute(statements[i]);
      console.log(`✓ Statement ${i + 1} executed successfully`);
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log(`⊘ Statement ${i + 1} skipped (table already exists)`);
      } else {
        console.error(`✗ Statement ${i + 1} failed:`, err.message);
      }
    }
  }
  
  await connection.end();
  console.log("Migration complete!");
}

main().catch(console.error);
