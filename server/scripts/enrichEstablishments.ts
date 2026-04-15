/**
 * enrichEstablishments.ts
 * Enriches published establishments with real Google Places data + Claude-generated
 * editorial content. Processes 5 rows per run.
 *
 * Usage: npx tsx server/scripts/enrichEstablishments.ts
 *
 * Env vars required:
 *   - DATABASE_URL
 *   - GOOGLE_PLACES_API_KEY
 *   - ANTHROPIC_API_KEY
 *
 * The script auto-creates missing columns (editorialContent, secretTip, enrichedAt)
 * on first run via INFORMATION_SCHEMA check, so it's idempotent with the schema.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import Anthropic from "@anthropic-ai/sdk";

const BATCH_SIZE = 5;
const CLAUDE_MODEL = "claude-sonnet-4-5";

interface Establishment {
  id: number;
  slug: string;
  name: string;
  city: string;
  country: string;
  category: string;
  subcategory: string | null;
  address: string | null;
  description: string | null;
}

interface GooglePlaceData {
  placeId?: string;
  formattedAddress?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string[];
  photoUris: string[];
}

interface EditorialContent {
  editorialContent: string;
  signature: string;
  secretTip: string;
}

async function ensureSchema(conn: mysql.Connection, dbName: string) {
  const cols: Array<{ name: string; ddl: string }> = [
    { name: "editorialContent", ddl: "ALTER TABLE `establishments` ADD COLUMN `editorialContent` text" },
    { name: "secretTip", ddl: "ALTER TABLE `establishments` ADD COLUMN `secretTip` text" },
    { name: "enrichedAt", ddl: "ALTER TABLE `establishments` ADD COLUMN `enrichedAt` timestamp NULL" },
    { name: "enrichStatus", ddl: "ALTER TABLE `establishments` ADD COLUMN `enrichStatus` varchar(20) DEFAULT 'pending'" },
  ];
  for (const { name, ddl } of cols) {
    const [rows] = (await conn.execute(
      `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'establishments' AND COLUMN_NAME = ?`,
      [dbName, name]
    )) as any[];
    if (!rows || rows[0].c === 0) {
      console.log(`[enrich] Adding missing column: ${name}`);
      await conn.query(ddl);
    }
  }
}

// ─── Google Places API (New) ────────────────────────────────────────────
async function searchGooglePlace(
  name: string,
  city: string,
  apiKey: string
): Promise<GooglePlaceData | null> {
  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.rating",
    "places.userRatingCount",
    "places.regularOpeningHours.weekdayDescriptions",
    "places.photos",
  ].join(",");

  const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({ textQuery: `${name} ${city}`, languageCode: "fr" }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Google Places search failed: ${resp.status} ${body}`);
  }

  const data = (await resp.json()) as any;
  const place = data?.places?.[0];
  if (!place) return null;

  // Resolve photo URIs (up to 5)
  const photoNames: string[] = (place.photos || []).slice(0, 5).map((p: any) => p.name);
  const photoUris: string[] = [];
  for (const name of photoNames) {
    try {
      const photoResp = await fetch(
        `https://places.googleapis.com/v1/${name}/media?maxHeightPx=1200&skipHttpRedirect=true&key=${apiKey}`
      );
      if (photoResp.ok) {
        const pd = (await photoResp.json()) as any;
        if (pd?.photoUri) photoUris.push(pd.photoUri);
      }
    } catch (err) {
      console.warn(`[enrich] photo fetch failed:`, err);
    }
  }

  return {
    placeId: place.id,
    formattedAddress: place.formattedAddress,
    phone: place.internationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    openingHours: place.regularOpeningHours?.weekdayDescriptions,
    photoUris,
  };
}

// ─── Claude editorial generation ────────────────────────────────────────
async function generateEditorial(
  est: Establishment,
  google: GooglePlaceData,
  anthropic: Anthropic
): Promise<EditorialContent> {
  const prompt = `Tu es rédacteur en chef d'un magazine de luxe, mandaté par Maison Baymora pour enrichir une fiche établissement. Utilise UNIQUEMENT les informations factuelles fournies — n'invente AUCUN détail.

Nom : ${est.name}
Ville : ${est.city}, ${est.country}
Catégorie : ${est.category}${est.subcategory ? ` / ${est.subcategory}` : ""}
Adresse : ${google.formattedAddress || est.address || "non précisée"}
Note Google : ${google.rating ?? "n/a"}/5 (${google.reviewCount ?? 0} avis)
Téléphone : ${google.phone || "n/a"}
Site web : ${google.website || "n/a"}
Horaires : ${google.openingHours?.join(" · ") || "n/a"}
Description existante : ${est.description || "n/a"}

Génère un JSON strict avec ces trois champs, sans balises markdown, sans préambule :

{
  "editorialContent": "3 à 4 paragraphes (300-500 mots) : histoire du lieu, ambiance, ce qui le rend unique. Ton magazine de luxe émotionnel mais factuel. Pas de superlatifs creux. Pas de puces ni markdown. Français.",
  "signature": "une phrase d'accroche maximum 15 mots, le pitch du lieu",
  "secretTip": "un tip exclusif Maison Baymora, une seule phrase actionnable : 'Demandez X', 'Le jeudi soir Y', 'Avant 19h Z'..."
}

Réponds UNIQUEMENT avec le JSON.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b: any) => b.type === "text") as any;
  const raw = textBlock?.text?.trim() || "";
  // Strip possible markdown fences
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      editorialContent: String(parsed.editorialContent || "").trim(),
      signature: String(parsed.signature || "").trim().slice(0, 255),
      secretTip: String(parsed.secretTip || "").trim(),
    };
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  const url = process.env.DATABASE_URL;
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!url) { console.error("[enrich] DATABASE_URL required"); process.exit(1); }
  if (!googleKey) { console.error("[enrich] GOOGLE_PLACES_API_KEY required"); process.exit(1); }
  if (!anthropicKey) { console.error("[enrich] ANTHROPIC_API_KEY required"); process.exit(1); }

  const isTiDB = url.includes("tidbcloud");
  console.log(`[enrich] Connecting to ${isTiDB ? "TiDB Cloud (SSL)" : "MySQL"}…`);

  const conn = await mysql.createConnection({
    uri: url,
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
  });

  // Extract DB name from URL (e.g. ".../baymora" → "baymora")
  const dbNameMatch = url.match(/\/([^/?]+)(?:\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : "baymora";

  await ensureSchema(conn, dbName);

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const [rows] = (await conn.execute(
    `SELECT id, slug, name, city, country, category, subcategory, address, description
     FROM establishments
     WHERE status = 'published' AND enrichedAt IS NULL
     ORDER BY id ASC
     LIMIT ${BATCH_SIZE}`
  )) as any[];

  if (!rows || rows.length === 0) {
    console.log("[enrich] No establishments to enrich. Done.");
    await conn.end();
    return;
  }

  console.log(`[enrich] Processing ${rows.length} establishment(s)…\n`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const est of rows as Establishment[]) {
    console.log(`[enrich] → ${est.name} (${est.city})`);
    try {
      // 1. Google Places
      const google = await searchGooglePlace(est.name, est.city, googleKey);
      if (!google) {
        // BUG FIX : mark as skipped so the row is not re-processed forever
        console.warn(`[enrich]   ⚠️  No Google Places match — marking as skipped`);
        await conn.execute(
          "UPDATE establishments SET enrichStatus = 'skipped', enrichedAt = NOW() WHERE id = ?",
          [est.id]
        );
        skipped++;
        continue;
      }
      console.log(
        `[enrich]   Google: rating=${google.rating ?? "?"} reviews=${google.reviewCount ?? 0} photos=${google.photoUris.length}`
      );

      // 2. Claude editorial
      const editorial = await generateEditorial(est, google, anthropic);
      console.log(`[enrich]   Claude: signature="${editorial.signature.substring(0, 60)}…"`);

      // 3. Update DB
      await conn.execute(
        `UPDATE establishments SET
           photos = ?,
           phone = COALESCE(?, phone),
           website = COALESCE(?, website),
           openingHours = COALESCE(?, openingHours),
           googlePlaceId = COALESCE(?, googlePlaceId),
           rating = COALESCE(?, rating),
           reviewCount = COALESCE(?, reviewCount),
           editorialContent = ?,
           signature = ?,
           secretTip = ?,
           enrichedAt = NOW(),
           enrichStatus = 'enriched'
         WHERE id = ?`,
        [
          JSON.stringify(google.photoUris),
          google.phone || null,
          google.website || null,
          google.openingHours ? JSON.stringify(google.openingHours) : null,
          google.placeId || null,
          google.rating ?? null,
          google.reviewCount ?? null,
          editorial.editorialContent,
          editorial.signature,
          editorial.secretTip,
          est.id,
        ]
      );
      ok++;
      console.log(`[enrich]   ✓ enriched\n`);
    } catch (err: any) {
      // Mark as error — still stamp enrichedAt so it's not retried in tight loops.
      // Manual reset (UPDATE establishments SET enrichStatus='pending', enrichedAt=NULL WHERE id=?)
      // can be used to re-queue an errored row.
      try {
        await conn.execute(
          "UPDATE establishments SET enrichStatus = 'error', enrichedAt = NOW() WHERE id = ?",
          [est.id]
        );
      } catch { /* ignore secondary failure */ }
      errors++;
      console.error(`[enrich]   ✗ ${err.message}\n`);
    }
  }

  await conn.end();
  console.log(`[enrich] Done: ${ok} ok, ${skipped} skipped, ${errors} errors (batch size ${BATCH_SIZE})`);
  process.exit(errors > 0 && ok === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[enrich] Fatal error:", err);
  process.exit(1);
});
