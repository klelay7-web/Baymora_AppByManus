/**
 * enrichCron.ts
 * Periodic batch enrichment of published establishments using Google Places + Claude.
 * Exports runEnrichBatch() which processes up to 5 unenriched published rows.
 *
 * Triggered automatically every 2h from server/_core/index.ts and on-demand via
 * GET /api/admin/enrich (admin only).
 */
import mysql from "mysql2/promise";
import Anthropic from "@anthropic-ai/sdk";

const BATCH_SIZE = 20;
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

export interface EnrichBatchResult {
  ok: number;
  errors: number;
  skipped: number;
  processed: Array<{ id: number; name: string; city: string; status: "ok" | "error" | "skipped"; message?: string }>;
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
      console.log(`[cron-enrich] Adding missing column: ${name}`);
      await conn.query(ddl);
    }
  }
}

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

  const photoNames: string[] = (place.photos || []).slice(0, 5).map((p: any) => p.name);
  const photoUris: string[] = [];
  for (const pn of photoNames) {
    try {
      const photoResp = await fetch(
        `https://places.googleapis.com/v1/${pn}/media?maxHeightPx=1200&skipHttpRedirect=true&key=${apiKey}`
      );
      if (photoResp.ok) {
        const pd = (await photoResp.json()) as any;
        if (pd?.photoUri) photoUris.push(pd.photoUri);
      }
    } catch (err) {
      console.warn(`[cron-enrich] photo fetch failed:`, err);
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
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      editorialContent: String(parsed.editorialContent || "").trim(),
      signature: String(parsed.signature || "").trim().slice(0, 255),
      secretTip: String(parsed.secretTip || "").trim(),
    };
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }
}

/**
 * Run a single enrichment batch. Processes up to BATCH_SIZE (5) published
 * establishments where enrichedAt IS NULL, using Google Places + Claude.
 * Safe to call concurrently multiple times — the rows selected are
 * already-unenriched and each run re-selects from scratch.
 */
export async function runEnrichBatch(): Promise<EnrichBatchResult> {
  const url = process.env.DATABASE_URL;
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!url || !googleKey || !anthropicKey) {
    console.warn(
      `[cron-enrich] Missing env — DATABASE_URL:${!!url} GOOGLE_PLACES_API_KEY:${!!googleKey} ANTHROPIC_API_KEY:${!!anthropicKey}`
    );
    return { ok: 0, errors: 0, skipped: 0, processed: [] };
  }

  const isTiDB = url.includes("tidbcloud");
  const conn = await mysql.createConnection({
    uri: url,
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
  });

  const dbNameMatch = url.match(/\/([^/?]+)(?:\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : "baymora";

  const result: EnrichBatchResult = { ok: 0, errors: 0, skipped: 0, processed: [] };

  try {
    await ensureSchema(conn, dbName);

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const [rows] = (await conn.execute(
      `SELECT id, slug, name, city, country, category, subcategory, address, description, enrichStatus
       FROM establishments
       WHERE (enrichStatus IN ('discovered', 'pending') OR (enrichStatus IS NULL AND enrichedAt IS NULL))
       ORDER BY CASE WHEN enrichStatus = 'discovered' THEN 0 ELSE 1 END, createdAt DESC
       LIMIT ${BATCH_SIZE}`
    )) as any[];

    if (!rows || rows.length === 0) {
      console.log("[cron-enrich] No establishments to enrich");
      return result;
    }

    console.log(`[cron-enrich] Processing ${rows.length} establishment(s)`);

    for (const est of rows as Establishment[]) {
      console.log(`[cron-enrich] → ${est.name} (${est.city})`);
      try {
        const google = await searchGooglePlace(est.name, est.city, googleKey);
        if (!google) {
          console.warn(`[cron-enrich]   ⚠️  No Google Places match — marking as skipped`);
          // Persist the skip so the row isn't re-processed forever
          try {
            await conn.execute(
              "UPDATE establishments SET enrichStatus = 'skipped', enrichedAt = NOW() WHERE id = ?",
              [est.id]
            );
          } catch { /* ignore */ }
          result.skipped++;
          result.processed.push({ id: est.id, name: est.name, city: est.city, status: "skipped", message: "no Google match" });
          continue;
        }
        console.log(
          `[cron-enrich]   Google: rating=${google.rating ?? "?"} reviews=${google.reviewCount ?? 0} photos=${google.photoUris.length}`
        );

        const editorial = await generateEditorial(est, google, anthropic);
        console.log(`[cron-enrich]   Claude: signature="${editorial.signature.substring(0, 60)}"`);

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
             enrichStatus = 'completed'
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
        result.ok++;
        result.processed.push({ id: est.id, name: est.name, city: est.city, status: "ok" });
        console.log(`[cron-enrich]   ✓ enriched`);
      } catch (err: any) {
        // Persist the error so the row isn't retried until manually reset
        try {
          await conn.execute(
            "UPDATE establishments SET enrichStatus = 'error', enrichedAt = NOW() WHERE id = ?",
            [est.id]
          );
        } catch { /* ignore secondary failure */ }
        result.errors++;
        result.processed.push({ id: est.id, name: est.name, city: est.city, status: "error", message: err.message });
        console.error(`[cron-enrich]   ✗ ${err.message}`);
      }
    }

    console.log(
      `[cron-enrich] Done: ${result.ok} ok, ${result.skipped} skipped, ${result.errors} errors`
    );

    // Auto-generate content pages for cities that crossed the 5-establishment threshold
    if (result.ok > 0) {
      try {
        await autoGenerateContentForNewCities(conn);
      } catch (err) {
        console.error("[cron-enrich] Auto content generation failed:", err);
      }
    }

    return result;
  } finally {
    await conn.end();
  }
}

async function autoGenerateContentForNewCities(conn: mysql.Connection) {
  // Find cities with 5+ enriched/completed establishments but no content pages
  const [cities] = (await conn.execute(
    `SELECT e.city, COUNT(*) as cnt
     FROM establishments e
     WHERE e.enrichStatus IN ('enriched', 'completed')
     GROUP BY e.city
     HAVING cnt >= 5`
  )) as any[];

  let generated = 0;
  for (const row of (cities || []).slice(0, 3)) {
    const city = row.city;
    // Check if content pages already exist for this city
    const [existing] = (await conn.execute(
      `SELECT COUNT(*) as c FROM content_pages WHERE LOWER(city) = LOWER(?)`,
      [city]
    )) as any[];
    if (existing?.[0]?.c > 0) continue;

    console.log(`[cron-content] Generating guides for ${city} (${row.cnt} establishments)`);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) break;

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const intents = [`Meilleurs restaurants ${city}`, `Où sortir ${city}`, `Que faire ce week-end à ${city}`];

    const [estRows] = (await conn.execute(
      `SELECT slug, name, CAST(description AS CHAR) as description, category, city FROM establishments WHERE LOWER(city) = LOWER(?) AND enrichStatus IN ('enriched', 'completed') LIMIT 15`,
      [city]
    )) as any[];

    for (const intent of intents) {
      try {
        const estContext = (estRows as any[]).slice(0, 8).map((e: any) => `- ${e.name} (${e.category}, ${e.city}): ${(e.description || "").slice(0, 100)}`).join("\n");
        const resp = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: "Tu es le rédacteur en chef de Maison Baymora. Réponds UNIQUEMENT en JSON valide.",
          messages: [{ role: "user", content: `Rédige un guide SEO. Ville: ${city}. Requête: "${intent}". Établissements:\n${estContext}\n\nJSON: { "slug": "kebab-case", "title": "max 60 car", "metaTitle": "max 60 car", "metaDescription": "max 155 car", "introText": "2-3 phrases", "content": "markdown 800 mots", "category": "string", "season": "toute_annee", "establishmentSlugs": [${(estRows as any[]).slice(0, 6).map((e: any) => `"${e.slug}"`).join(",")}] }` }],
        });
        const text = resp.content[0].type === "text" ? resp.content[0].text : "";
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) continue;
        const page = JSON.parse(match[0]);
        await conn.execute(
          `INSERT INTO content_pages (slug, title, metaTitle, metaDescription, city, category, searchIntent, introText, content, establishmentSlugs, season, generatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'claude')`,
          [page.slug, page.title, page.metaTitle, page.metaDescription, city, page.category || "", intent, page.introText, page.content, JSON.stringify(page.establishmentSlugs || []), page.season || "toute_annee"]
        );
        console.log(`[cron-content]   ✓ ${page.slug}`);
        generated++;
      } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") continue;
        console.error(`[cron-content]   ✗ ${intent}: ${err?.message}`);
      }
      // Rate limit
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (generated > 0) console.log(`[cron-content] Generated ${generated} content pages`);
}

/**
 * Start the periodic enrichment cron. Runs every 2 hours. First execution
 * is delayed by 5 minutes to avoid hammering APIs at server startup.
 */
export function startEnrichCron() {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const FIVE_MINUTES = 5 * 60 * 1000;

  console.log("[cron-enrich] Scheduling batch every 2h (first run in 5min)");

  setTimeout(() => {
    runEnrichBatch().catch((err) => console.error("[cron-enrich] Initial run failed:", err));
    setInterval(() => {
      runEnrichBatch().catch((err) => console.error("[cron-enrich] Scheduled run failed:", err));
    }, TWO_HOURS);
  }, FIVE_MINUTES);
}
