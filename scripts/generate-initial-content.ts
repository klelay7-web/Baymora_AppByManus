/**
 * Generate initial content pages from seo_intelligence findings.
 * Run: npx tsx scripts/generate-initial-content.ts
 *
 * For each finding where contentPageGenerated = false AND 3+ establishments
 * match the city+category, calls Claude Sonnet to generate a content page.
 * Rate limit: 2 seconds between API calls.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { generateContentPage, type SeoFinding } from "../server/services/manusScoutService";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const isTiDB = DATABASE_URL.includes("tidbcloud");

async function main() {
  const conn = await mysql.createConnection({
    uri: DATABASE_URL!,
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
  });

  // Ensure content_pages table exists
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

  // Read all unprocessed findings
  const [findings] = await conn.execute(
    "SELECT * FROM seo_intelligence WHERE contentPageGenerated = FALSE ORDER BY id"
  ) as any[];

  console.log(`Found ${findings.length} unprocessed findings.`);

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    const city = f.city || "";
    const category = f.category || "";

    if (!city) {
      console.log(`  [${i + 1}/${findings.length}] SKIP: "${f.pageTitle}" — no city`);
      skipped++;
      continue;
    }

    // Find matching establishments
    const [estRows] = await conn.execute(
      "SELECT slug, name, CAST(description AS CHAR) as description, category, city FROM establishments WHERE LOWER(city) = LOWER(?) LIMIT 20",
      [city]
    ) as any[];

    if (estRows.length < 3) {
      console.log(`  [${i + 1}/${findings.length}] SKIP: "${f.pageTitle}" (${city}/${category}) — only ${estRows.length} establishments (need 3+)`);
      skipped++;
      continue;
    }

    console.log(`  [${i + 1}/${findings.length}] Generating: "${f.pageTitle}" (${city}/${category}) — ${estRows.length} establishments available`);

    const finding: SeoFinding = {
      source: f.source,
      url: f.pageUrl || f.sourceUrl || "",
      title: f.pageTitle || "",
      city,
      category,
      searchIntent: f.searchIntent || "",
      establishmentsMentioned: (() => {
        try { return JSON.parse(f.establishmentsMentioned || "[]"); } catch { return []; }
      })(),
    };

    const page = await generateContentPage(finding, estRows);

    if (!page) {
      console.log(`    → Generation returned null, skipping.`);
      skipped++;
      continue;
    }

    try {
      await conn.execute(
        `INSERT INTO content_pages (slug, title, metaTitle, metaDescription, type, city, category, searchIntent, introText, content, establishmentSlugs, season, seoIntelligenceId, generatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'claude')`,
        [
          page.slug, page.title, page.metaTitle, page.metaDescription,
          page.type || "guide", city, page.category || category,
          finding.searchIntent, page.introText, page.content,
          JSON.stringify(page.establishmentSlugs || []),
          page.season || "toute_annee", f.id,
        ]
      );

      await conn.execute(
        "UPDATE seo_intelligence SET contentPageGenerated = TRUE WHERE id = ?",
        [f.id]
      );

      console.log(`    ✓ Created: /guide/${page.slug} — "${page.title}"`);
      generated++;
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log(`    ⊘ Slug already exists: ${page.slug}`);
        await conn.execute(
          "UPDATE seo_intelligence SET contentPageGenerated = TRUE WHERE id = ?",
          [f.id]
        );
      } else {
        console.error(`    ✗ Insert failed: ${err.message}`);
      }
      skipped++;
    }

    // Rate limit: 2s between Claude calls
    if (i < findings.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Summary
  const [cpCount] = await conn.execute("SELECT COUNT(*) as c FROM content_pages") as any[];
  const [siCount] = await conn.execute("SELECT COUNT(*) as c FROM seo_intelligence") as any[];
  const [pmCount] = await conn.execute("SELECT COUNT(*) as c FROM parcours_maison") as any[];

  console.log("\n══════════════════════════════════════");
  console.log("  GENERATION SUMMARY");
  console.log("══════════════════════════════════════");
  console.log(`  Findings processed: ${findings.length}`);
  console.log(`  Pages generated:    ${generated}`);
  console.log(`  Skipped:            ${skipped}`);
  console.log("──────────────────────────────────────");
  console.log(`  Total parcours_maison:    ${pmCount[0].c}`);
  console.log(`  Total seo_intelligence:   ${siCount[0].c}`);
  console.log(`  Total content_pages:      ${cpCount[0].c}`);
  console.log("══════════════════════════════════════\n");

  await conn.end();
}

main().catch(console.error);
