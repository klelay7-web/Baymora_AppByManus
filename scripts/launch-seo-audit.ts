/**
 * launch-seo-audit.ts
 * Standalone script to launch the initial SEO competitive audit.
 *
 * Usage: npx tsx scripts/launch-seo-audit.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import {
  launchSeoAudit,
  type SeoTarget,
} from "../server/services/manusScoutService";

// ─── 14 CITIES ───────────────────────────────────────────────────────────────
const CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Bordeaux",
  "Nice",
  "Lille",
  "Strasbourg",
  "Toulouse",
  "Nantes",
  "Montpellier",
  "Cannes",
  "Saint-Tropez",
  "Deauville",
  "Biarritz",
];

// ─── 8 COMPETITOR TARGETS ────────────────────────────────────────────────────
const TARGETS: SeoTarget[] = [
  {
    siteUrl: "https://www.sortiraparis.com",
    siteName: "Sortir a Paris",
    cities: CITIES,
  },
  {
    siteUrl: "https://www.timeout.com/fr",
    siteName: "Time Out France",
    cities: CITIES,
  },
  {
    siteUrl: "https://www.thefork.fr",
    siteName: "TheFork",
    cities: CITIES,
  },
  {
    siteUrl: "https://www.petitfute.com",
    siteName: "Le Petit Fute",
    cities: CITIES,
  },
  {
    siteUrl: "https://www.lefooding.com",
    siteName: "Le Fooding",
    cities: CITIES,
  },
  {
    siteUrl: "https://guide.michelin.com/fr",
    siteName: "Guide Michelin",
    cities: CITIES,
  },
  {
    siteUrl: "https://www.condenasttraveller.com/fr",
    siteName: "Conde Nast Traveller",
    cities: CITIES,
  },
  {
    siteUrl: "https://www.elleatable.fr",
    siteName: "Elle a Table",
    cities: CITIES,
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("  Maison Baymora — SEO Competitive Audit");
  console.log("  Targets: " + TARGETS.length + " sites");
  console.log("  Cities: " + CITIES.length + " cities");
  console.log("=".repeat(60));
  console.log("");

  const startTime = Date.now();

  const findings = await launchSeoAudit(TARGETS);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("");
  console.log("=".repeat(60));
  console.log("  AUDIT SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Total findings: ${findings.length}`);
  console.log(`  Duration: ${durationSec}s`);
  console.log("");

  // Group by source
  const bySource = new Map<string, number>();
  for (const f of findings) {
    bySource.set(f.source, (bySource.get(f.source) ?? 0) + 1);
  }
  console.log("  Findings by source:");
  for (const [source, count] of Array.from(bySource.entries())) {
    console.log(`    - ${source}: ${count} pages`);
  }

  // Group by city
  const byCity = new Map<string, number>();
  for (const f of findings) {
    byCity.set(f.city, (byCity.get(f.city) ?? 0) + 1);
  }
  console.log("");
  console.log("  Findings by city:");
  for (const [city, count] of Array.from(byCity.entries())) {
    console.log(`    - ${city}: ${count} pages`);
  }

  // Group by category
  const byCategory = new Map<string, number>();
  for (const f of findings) {
    byCategory.set(f.category, (byCategory.get(f.category) ?? 0) + 1);
  }
  console.log("");
  console.log("  Findings by category:");
  for (const [category, count] of Array.from(byCategory.entries())) {
    console.log(`    - ${category}: ${count} pages`);
  }

  // Print first 5 findings as sample
  console.log("");
  console.log("  Sample findings (first 5):");
  for (const f of findings.slice(0, 5)) {
    console.log(`    [${f.source}] ${f.title}`);
    console.log(`      URL: ${f.url}`);
    console.log(`      City: ${f.city} | Category: ${f.category}`);
    console.log(`      Intent: ${f.searchIntent}`);
    console.log(
      `      Establishments: ${f.establishmentsMentioned.join(", ")}`
    );
    console.log("");
  }

  console.log("  Audit complete.");
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
