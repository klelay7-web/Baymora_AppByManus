/**
 * migrations.ts — Auto-migration helpers for tables added after the initial schema.
 * Each function uses CREATE TABLE IF NOT EXISTS — safe to call multiple times.
 */

async function getConnection() {
  const mysql = await import("mysql2/promise");
  const { getMysqlConnOpts } = await import("./db");
  return mysql.default.createConnection(getMysqlConnOpts());
}

export async function ensureSeoIntelligenceSchema(): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS \`seo_intelligence\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`source\` varchar(100) NOT NULL,
      \`sourceUrl\` varchar(500),
      \`pageUrl\` varchar(500),
      \`pageTitle\` varchar(300),
      \`city\` varchar(100),
      \`country\` varchar(100) DEFAULT 'France',
      \`category\` varchar(50),
      \`searchIntent\` varchar(300),
      \`establishmentsMentioned\` json DEFAULT NULL,
      \`contentPageGenerated\` boolean DEFAULT FALSE,
      \`scrapedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_city\` (\`city\`),
      KEY \`idx_source\` (\`source\`)
    )`);
  } finally { await conn.end(); }
}

export async function ensureContentPagesSchema(): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS \`content_pages\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`slug\` varchar(200) NOT NULL,
      \`title\` varchar(300) NOT NULL,
      \`metaTitle\` varchar(200),
      \`metaDescription\` varchar(320),
      \`type\` enum('guide','inspiration','parcours','evenement','secret') DEFAULT 'guide',
      \`city\` varchar(100) NOT NULL,
      \`country\` varchar(100) DEFAULT 'France',
      \`category\` varchar(50),
      \`searchIntent\` varchar(300),
      \`heroImage\` varchar(500),
      \`introText\` text,
      \`content\` longtext,
      \`establishmentSlugs\` json DEFAULT NULL,
      \`season\` enum('toute_annee','printemps','ete','automne','hiver') DEFAULT 'toute_annee',
      \`isPublished\` boolean DEFAULT TRUE,
      \`viewCount\` int DEFAULT 0,
      \`saveCount\` int DEFAULT 0,
      \`seoIntelligenceId\` int NULL,
      \`generatedBy\` enum('claude','manual','manus') DEFAULT 'claude',
      \`verifiedAt\` timestamp NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`idx_slug\` (\`slug\`),
      KEY \`idx_city\` (\`city\`),
      KEY \`idx_type\` (\`type\`)
    )`);
  } finally { await conn.end(); }
}

export async function ensureMemberSignaturesSchema(): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS \`member_signatures\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`userId\` int NOT NULL,
      \`name\` varchar(100) NOT NULL,
      \`transportDoor\` enum('chauffeur_prive','vtc','taxi','transport_public','voiture_perso','marche','velo'),
      \`transportLong\` enum('train','avion','voiture_perso','chauffeur_longue_distance','bus','jet_prive'),
      \`contextSocial\` enum('solo','couple','famille','amis','pro'),
      \`envies\` json DEFAULT NULL,
      \`energie\` enum('farniente','equilibre','actif','tres_actif'),
      \`budgetMode\` enum('illimite','haut_maitrise','equilibre','serre'),
      \`budgetRepartition\` json,
      \`companionIds\` json DEFAULT NULL,
      \`intentionType\` enum('ce_soir','cette_semaine','voyage','cadeau','surprends_moi') DEFAULT 'ce_soir',
      \`usageCount\` int DEFAULT 0,
      \`lastUsedAt\` timestamp NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_user\` (\`userId\`)
    )`);
  } finally { await conn.end(); }
}

export async function ensureConversationLastActivity(): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.query(`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS lastActivityAt TIMESTAMP NULL`);
  } catch { /* column may already exist */ }
  finally { await conn.end(); }
}

export async function runAllMigrations(): Promise<{ table: string; status: string; error?: string }[]> {
  const results: { table: string; status: string; error?: string }[] = [];
  const migrations = [
    { name: "seo_intelligence", fn: ensureSeoIntelligenceSchema },
    { name: "content_pages", fn: ensureContentPagesSchema },
    { name: "member_signatures", fn: ensureMemberSignaturesSchema },
    { name: "conversations_lastActivity", fn: ensureConversationLastActivity },
  ];

  for (const m of migrations) {
    try {
      await m.fn();
      results.push({ table: m.name, status: "ok" });
    } catch (err: any) {
      results.push({ table: m.name, status: "error", error: err?.message || String(err) });
    }
  }
  return results;
}
