import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DATABASE_URL);

console.log("Creating teamInvitations table...");
await db.execute(`
  CREATE TABLE IF NOT EXISTS \`teamInvitations\` (
    \`id\` int AUTO_INCREMENT PRIMARY KEY,
    \`token\` varchar(64) NOT NULL,
    \`invitedBy\` int NOT NULL,
    \`recipientName\` varchar(128),
    \`recipientEmail\` varchar(320),
    \`recipientPhone\` varchar(32),
    \`role\` enum('team','admin') NOT NULL DEFAULT 'team',
    \`grantedTier\` enum('free','explorer','premium') NOT NULL DEFAULT 'explorer',
    \`status\` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
    \`acceptedByUserId\` int,
    \`message\` text,
    \`expiresAt\` timestamp NOT NULL,
    \`acceptedAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY \`teamInvitations_token_unique\` (\`token\`)
  )
`);
console.log("✅ teamInvitations table created");

await db.end();
