/**
 * Script pour promouvoir un utilisateur en admin
 * Usage: node scripts/promote-admin.mjs
 */
import { createConnection } from "mysql2/promise";

const db = await createConnection(process.env.DATABASE_URL);

// Lister tous les users
const [users] = await db.execute("SELECT id, name, email, openId, role FROM users ORDER BY createdAt DESC LIMIT 20");
console.log("\n=== Utilisateurs enregistrés ===");
console.table(users);

// Promouvoir tous les users en admin (pour le fondateur)
const [result] = await db.execute("UPDATE users SET role = 'admin' WHERE name LIKE '%vin%' OR name LIKE '%Kevin%' OR name LIKE '%kevin%'");
console.log(`\n✅ ${result.affectedRows} utilisateur(s) promu(s) en admin`);

// Vérification
const [updated] = await db.execute("SELECT id, name, role FROM users WHERE role = 'admin'");
console.log("\n=== Admins actuels ===");
console.table(updated);

await db.end();
