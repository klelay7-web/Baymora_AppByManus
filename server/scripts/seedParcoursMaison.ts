/**
 * Seed 5 Parcours Maison for Bordeaux
 * Run: npx tsx server/scripts/seedParcoursMaison.ts
 *
 * First queries existing Bordeaux establishments, then inserts parcours
 * using real slugs from the DB.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const isTiDB = DATABASE_URL.includes("tidbcloud");

async function main() {
  const conn = await mysql.createConnection({
    uri: DATABASE_URL!,
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
  });

  // Query existing Bordeaux establishments
  const [estRows] = await conn.execute(
    `SELECT slug, name, category FROM establishments WHERE LOWER(city) = 'bordeaux' ORDER BY category, name`
  ) as any[];

  console.log(`Found ${estRows.length} Bordeaux establishments:`);
  for (const e of estRows) console.log(`  [${e.category}] ${e.name} → ${e.slug}`);

  // Group by category for easy lookup
  const byCategory: Record<string, any[]> = {};
  for (const e of estRows) {
    const cat = (e.category || "other").toLowerCase();
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(e);
  }

  const pick = (cats: string[], count: number): any[] => {
    const pool: any[] = [];
    for (const c of cats) pool.push(...(byCategory[c] || []));
    return pool.slice(0, count);
  };

  const barWine = pick(["bar", "wine_bar", "cocktail_bar"], 4);
  const restaurants = pick(["restaurant", "bistro", "gastronomie"], 4);
  const nightlife = pick(["bar", "nightclub", "club", "cocktail_bar"], 4);
  const all = estRows.slice(0, 5);
  const brunch = pick(["restaurant", "cafe", "brunch", "bistro"], 4);

  const makeStep = (e: any, timeSlot: string, price: number, travel?: string) => ({
    slug: e.slug,
    name: e.name,
    category: e.category,
    timeSlot,
    priceEstimate: price,
    travelFromPrevious: travel || "",
    description: "",
  });

  const parcours = [
    {
      slug: "caves-secretes-bordeaux",
      title: "Les caves secrètes de Bordeaux",
      subtitle: "Un parcours oenologique dans les meilleurs bars à vin du centre-ville",
      city: "Bordeaux",
      coverPhoto: null,
      duration: "3h",
      budgetEstimate: "60-90€/pers",
      tags: JSON.stringify(["vin", "nightlife", "bordeaux", "couple", "amis"]),
      steps: JSON.stringify(barWine.length > 0 ? barWine.map((e, i) => makeStep(e, `${18 + i}h - ${19 + i}h`, 20, i > 0 ? "8 min à pied" : "")) : []),
      isPublished: true,
    },
    {
      slug: "soiree-parfaite-chartrons",
      title: "Soirée parfaite Chartrons",
      subtitle: "Apéro rooftop, dîner bistro, bar cocktail — le trio gagnant",
      city: "Bordeaux",
      coverPhoto: null,
      duration: "4h",
      budgetEstimate: "80-130€/pers",
      tags: JSON.stringify(["gastronomie", "sortir", "bordeaux", "couple"]),
      steps: JSON.stringify(restaurants.length > 0 ? restaurants.slice(0, 3).map((e, i) => makeStep(e, `${19 + i}h - ${20 + i}h`, 40, i > 0 ? "10 min à pied" : "")) : []),
      isPublished: true,
    },
    {
      slug: "bordeaux-en-3-heures",
      title: "Bordeaux en 3 heures",
      subtitle: "Parcours express pour visiteur pressé — 5 étapes courtes",
      city: "Bordeaux",
      coverPhoto: null,
      duration: "3h",
      budgetEstimate: "30-50€/pers",
      tags: JSON.stringify(["culture", "decouverte", "bordeaux", "solo", "amis"]),
      steps: JSON.stringify(all.map((e: any, i: number) => makeStep(e, `${14 + Math.floor(i * 0.6)}h`, 10, i > 0 ? "5 min à pied" : ""))),
      isPublished: true,
    },
    {
      slug: "brunch-balades-dimanche-bordeaux",
      title: "Brunch & balades dimanche",
      subtitle: "Brunch gourmand, balade quais de la Garonne, terrasse au soleil",
      city: "Bordeaux",
      coverPhoto: null,
      duration: "4h",
      budgetEstimate: "40-70€/pers",
      tags: JSON.stringify(["gastronomie", "nature", "bordeaux", "couple", "famille"]),
      steps: JSON.stringify(brunch.length > 0 ? brunch.map((e, i) => makeStep(e, `${10 + i}h - ${11 + i}h`, 18, i > 0 ? "12 min à pied" : "")) : []),
      isPublished: true,
    },
    {
      slug: "bordeaux-by-night",
      title: "Bordeaux by Night",
      subtitle: "Apéro, dîner, speakeasy, club — la soirée complète",
      city: "Bordeaux",
      coverPhoto: null,
      duration: "5h",
      budgetEstimate: "100-180€/pers",
      tags: JSON.stringify(["nightlife", "gastronomie", "bordeaux", "amis"]),
      steps: JSON.stringify(nightlife.length > 0 ? nightlife.map((e, i) => makeStep(e, `${20 + i}h - ${21 + i}h`, 35, i > 0 ? "6 min en VTC" : "")) : []),
      isPublished: true,
    },
  ];

  // Ensure table exists
  await conn.query(`CREATE TABLE IF NOT EXISTS \`parcours_maison\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`slug\` varchar(100) NOT NULL,
    \`title\` varchar(200) NOT NULL,
    \`subtitle\` varchar(300),
    \`city\` varchar(100) NOT NULL,
    \`coverPhoto\` varchar(500),
    \`duration\` varchar(50),
    \`budgetEstimate\` varchar(50),
    \`tags\` json DEFAULT NULL,
    \`steps\` json NOT NULL,
    \`isPublished\` boolean DEFAULT TRUE,
    \`viewCount\` int DEFAULT 0,
    \`saveCount\` int DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`idx_slug\` (\`slug\`),
    KEY \`idx_city\` (\`city\`)
  )`);

  for (const p of parcours) {
    try {
      await conn.execute(
        `INSERT INTO parcours_maison (slug, title, subtitle, city, coverPhoto, duration, budgetEstimate, tags, steps, isPublished) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.slug, p.title, p.subtitle, p.city, p.coverPhoto, p.duration, p.budgetEstimate, p.tags, p.steps, p.isPublished]
      );
      console.log(`✓ Inserted: ${p.title}`);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") console.log(`⊘ Skipped (exists): ${p.title}`);
      else console.error(`✗ Failed: ${p.title}`, err.message);
    }
  }

  await conn.end();
  console.log("\nDone.");
}

main().catch(console.error);
