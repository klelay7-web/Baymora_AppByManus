/**
 * seedEstablishments.ts
 * Script de pré-seeding mondial des fiches établissements Maison Baymora
 * Usage: npx tsx scripts/seedEstablishments.ts [--city "Paris"] [--group france_grandes_villes]
 *
 * Prérequis :
 *   - GOOGLE_PLACES_API_KEY dans l'environnement
 *   - DATABASE_URL dans l'environnement
 *   - ANTHROPIC_API_KEY dans l'environnement (pour descriptions Claude)
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import mysql from "mysql2/promise";
import Anthropic from "@anthropic-ai/sdk";

// ─── Config ─────────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const MIN_RATING = 4.2;
const PLACE_TYPES = [
  "restaurant",
  "lodging",
  "bar",
  "spa",
  "night_club",
  "tourist_attraction",
];
const S3_BUCKET_PREFIX = "establishments"; // sous-dossier S3

// ─── Types ───────────────────────────────────────────────────────────────────
interface CityConfig {
  city: string;
  country: string;
  lat: number;
  lng: number;
  limit: number;
}

interface CitiesData {
  [group: string]: CityConfig[];
}

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: Array<{ photo_reference: string }>;
  opening_hours?: { weekday_text?: string[] };
  formatted_phone_number?: string;
  website?: string;
  reviews?: Array<{ text: string; rating: number }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapType(types: string[]): string {
  if (types.includes("lodging")) return "hotel";
  if (types.includes("restaurant")) return "restaurant";
  if (types.includes("bar")) return "bar";
  if (types.includes("spa")) return "spa";
  if (types.includes("night_club")) return "club";
  if (types.includes("tourist_attraction")) return "activite";
  return "lieu";
}

function mapCategory(types: string[], name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("palace") || nameLower.includes("ritz"))
    return "palace";
  if (nameLower.includes("rooftop") || nameLower.includes("roof"))
    return "rooftop";
  if (nameLower.includes("spa") || nameLower.includes("wellness"))
    return "spa-luxe";
  if (types.includes("night_club")) return "bar-cocktails";
  if (types.includes("lodging")) return "boutique-hotel";
  if (types.includes("restaurant")) return "gastronomique";
  return "experience";
}

// ─── Google Places API ───────────────────────────────────────────────────────
async function searchNearby(
  lat: number,
  lng: number,
  type: string,
  pageToken?: string
): Promise<{ results: GooglePlace[]; nextPageToken?: string }> {
  const base = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
  const params = pageToken
    ? `?pagetoken=${pageToken}&key=${GOOGLE_API_KEY}`
    : `?location=${lat},${lng}&radius=5000&type=${type}&minprice=2&key=${GOOGLE_API_KEY}`;
  const raw = await httpsGet(base + params);
  const data = JSON.parse(raw);
  return {
    results: data.results || [],
    nextPageToken: data.next_page_token,
  };
}

async function getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,photos,opening_hours,formatted_phone_number,website,reviews&key=${GOOGLE_API_KEY}`;
  try {
    const raw = await httpsGet(url);
    const data = JSON.parse(raw);
    return data.result || null;
  } catch {
    return null;
  }
}

function getPhotoUrl(photoReference: string, maxWidth = 800): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

// ─── Claude Description ──────────────────────────────────────────────────────
async function generateDescription(
  name: string,
  city: string,
  reviews: Array<{ text: string; rating: number }>
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return `${name} est une adresse d'exception à ${city}, reconnue pour son atmosphère unique et son service irréprochable.`;
  }
  const client = new Anthropic();
  const topReviews = reviews
    .filter((r) => r.rating >= 4)
    .slice(0, 3)
    .map((r) => r.text.substring(0, 200))
    .join(" | ");
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Écris 2 phrases maximum qui donnent envie de visiter ${name} à ${city}. Style magazine de luxe. Basé sur ces avis : ${topReviews || "Établissement d'exception"}. Mentionne l'ambiance, la spécialité, ce qui rend le lieu unique. Pas de guillemets.`,
        },
      ],
    });
    const block = msg.content[0];
    return block.type === "text" ? block.text : `${name} — une adresse d'exception à ${city}.`;
  } catch {
    return `${name} est une adresse d'exception à ${city}, reconnue pour son atmosphère unique et son service irréprochable.`;
  }
}

// ─── Main Seeding Logic ──────────────────────────────────────────────────────
async function seedCity(
  conn: mysql.Connection,
  cityConfig: CityConfig
): Promise<{ created: number; skipped: number; errors: number }> {
  const { city, country, lat, lng, limit } = cityConfig;
  let created = 0;
  let skipped = 0;
  let errors = 0;
  const allPlaces: GooglePlace[] = [];

  // Collect places for all types
  for (const type of PLACE_TYPES) {
    try {
      let { results, nextPageToken } = await searchNearby(lat, lng, type);
      allPlaces.push(...results);
      if (nextPageToken && allPlaces.length < limit) {
        await sleep(2000); // Google requires delay before using nextPageToken
        const more = await searchNearby(lat, lng, type, nextPageToken);
        allPlaces.push(...more.results);
      }
    } catch (e) {
      console.error(`  [Seed] Error fetching ${type} for ${city}:`, e);
    }
    await sleep(200);
  }

  // Filter by rating and deduplicate
  const filtered = allPlaces
    .filter((p) => (p.rating || 0) >= MIN_RATING)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const unique = new Map<string, GooglePlace>();
  for (const p of filtered) unique.set(p.place_id, p);
  const toProcess = Array.from(unique.values()).slice(0, limit);

  console.log(
    `  [Seed] ${city} — ${toProcess.length} établissements à traiter (sur ${unique.size} uniques)`
  );

  for (let i = 0; i < toProcess.length; i++) {
    const place = toProcess[i];
    try {
      // Check if already in DB
      const [existing] = await conn.execute(
        "SELECT id FROM establishments WHERE googlePlaceId = ?",
        [place.place_id]
      );
      if ((existing as unknown[]).length > 0) {
        skipped++;
        continue;
      }

      // Get full details
      const details = await getPlaceDetails(place.place_id);
      await sleep(100);
      const p = details || place;

      // Build photo URLs (Google Places CDN, no S3 upload needed for seeding)
      const photoUrls = (p.photos || [])
        .slice(0, 5)
        .map((ph) => getPhotoUrl(ph.photo_reference));
      const featuredPhoto = photoUrls[0] || null;

      // Generate description
      const description = await generateDescription(
        p.name,
        city,
        p.reviews || []
      );

      // Determine type/category
      const placeType = mapType(p.types || []);
      const category = mapCategory(p.types || [], p.name);

      // Insert
      await conn.execute(
        `INSERT INTO establishments (
          slug, name, category, city, country, address, lat, lng,
          rating, reviewCount, priceLevel, description, ambiance,
          phone, website, googlePlaceId, featuredPhoto, photos,
          source, verified, status, generatedBy, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${place.place_id.substring(0, 8)}`,
          p.name,
          placeType,
          city,
          country,
          p.formatted_address || p.vicinity || "",
          p.geometry?.location?.lat || lat,
          p.geometry?.location?.lng || lng,
          p.rating || null,
          p.user_ratings_total || 0,
          p.price_level || null,
          description,
          "chic",
          p.formatted_phone_number || null,
          p.website || null,
          place.place_id,
          featuredPhoto,
          JSON.stringify(photoUrls),
          "google_places",
          false,
          "published",
          "ai",
          "seed_script",
        ]
      );
      created++;
      if ((created + skipped) % 10 === 0) {
        console.log(
          `  [Seed] ${city} — ${created + skipped}/${toProcess.length} (${created} créées, ${skipped} skippées)`
        );
      }
    } catch (e: unknown) {
      errors++;
      const msg = e instanceof Error ? e.message : String(e);
      // Handle Google rate limit
      if (msg.includes("OVER_QUERY_LIMIT") || msg.includes("429")) {
        console.log(`  [Seed] Rate limit atteint pour ${city}, attente 60s...`);
        await sleep(60000);
        i--; // retry
      } else {
        console.error(`  [Seed] Erreur fiche ${place.name}:`, msg);
      }
    }
    await sleep(50);
  }

  return { created, skipped, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const cityFilter = args.includes("--city")
    ? args[args.indexOf("--city") + 1]
    : null;
  const groupFilter = args.includes("--group")
    ? args[args.indexOf("--group") + 1]
    : null;

  if (!GOOGLE_API_KEY) {
    console.error(
      "❌ GOOGLE_PLACES_API_KEY manquant. Ajoutez-le dans les secrets Manus."
    );
    process.exit(1);
  }

  const citiesData: CitiesData = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "data/cities.json"),
      "utf-8"
    )
  );

  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("✅ Connexion DB établie");

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [group, cities] of Object.entries(citiesData)) {
    if (groupFilter && group !== groupFilter) continue;
    console.log(`\n🌍 Groupe: ${group} (${cities.length} villes)`);

    for (const cityConfig of cities) {
      if (cityFilter && cityConfig.city !== cityFilter) continue;
      console.log(`\n📍 ${cityConfig.city}, ${cityConfig.country}`);
      const result = await seedCity(conn, cityConfig);
      totalCreated += result.created;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
      console.log(
        `  ✓ ${cityConfig.city} — ${result.created} créées, ${result.skipped} skippées, ${result.errors} erreurs`
      );
    }
  }

  await conn.end();
  console.log(`\n🎉 Seeding terminé !`);
  console.log(`   Total créées  : ${totalCreated}`);
  console.log(`   Total skippées: ${totalSkipped}`);
  console.log(`   Total erreurs : ${totalErrors}`);
}

main().catch((e) => {
  console.error("❌ Erreur fatale:", e);
  process.exit(1);
});
