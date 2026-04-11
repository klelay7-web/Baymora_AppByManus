/**
 * establishmentService.ts
 * Service de création et récupération des fiches établissements.
 * Appelé par Maya à chaque création de parcours ou recherche radar.
 */

import { getDb } from "../db";
import { establishments } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export interface EstablishmentInput {
  name?: string;
  city: string;
  country?: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
}

export type EstablishmentRow = typeof establishments.$inferSelect;

/**
 * Cherche ou crée une fiche établissement.
 * 1. Cherche en DB par googlePlaceId ou (name + city)
 * 2. Si trouvé → retourne la fiche et incrémente timesRecommended
 * 3. Si non trouvé → crée la fiche via Google Places + description Claude
 */
export async function findOrCreateEstablishment(
  input: EstablishmentInput
): Promise<EstablishmentRow | null> {
  const db = await getDb();
  if (!db) return null;
  // ─── 1. Recherche en DB ─────────────────────────────────────────────
  let existing: EstablishmentRow | undefined;

  if (input.googlePlaceId) {
    const rows = await db
      .select()
      .from(establishments)
      .where(eq(establishments.googlePlaceId, input.googlePlaceId))
      .limit(1);
    existing = rows[0];
  }

  if (!existing && input.name && input.city) {
    const rows = await db
      .select()
      .from(establishments)
      .where(
        and(
          sql`LOWER(${establishments.name}) = LOWER(${input.name})`,
          sql`LOWER(${establishments.city}) = LOWER(${input.city})`
        )
      )
      .limit(1);
    existing = rows[0];
  }

  if (existing) {
    // Incrémenter timesRecommended
    await db
      .update(establishments)
      .set({
        timesRecommended: sql`${establishments.timesRecommended} + 1`,
        lastRecommended: new Date(),
      })
      .where(eq(establishments.id, existing.id));
    return existing;
  }

  // ─── 2. Création via Google Places ─────────────────────────────────
  if (!input.name || !input.city) return null;

  try {
    const created = await createEstablishmentFromGoogle(input);
    return created;
  } catch (e) {
    console.error("[EstablishmentService] Erreur création fiche:", e);
    return null;
  }
}

/**
 * Crée une fiche via Google Places API + description Claude
 */
async function createEstablishmentFromGoogle(
  input: EstablishmentInput
): Promise<EstablishmentRow | null> {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.warn("[EstablishmentService] GOOGLE_PLACES_API_KEY manquant, création fiche minimale");
    return createMinimalEstablishment(input);
  }

  // Text Search pour trouver le lieu
  const query = encodeURIComponent(`${input.name} ${input.city}`);
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}`;

  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json() as { results?: Array<{ place_id: string }> };
  const placeId = searchData.results?.[0]?.place_id;

  if (!placeId) return createMinimalEstablishment(input);

  // Place Details
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,photos,opening_hours,formatted_phone_number,website,reviews&key=${GOOGLE_API_KEY}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json() as { result?: Record<string, unknown> };
  const p = detailsData.result as {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    types?: string[];
    photos?: Array<{ photo_reference: string }>;
    formatted_phone_number?: string;
    website?: string;
    reviews?: Array<{ text: string; rating: number }>;
  } | undefined;
  if (!p) return createMinimalEstablishment(input);

  // Photos
  const photoUrls = (p.photos || [])
    .slice(0, 5)
    .map(
      (ph) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ph.photo_reference}&key=${GOOGLE_API_KEY}`
    );

  // Description Claude
  const description = await generateDescription(
    p.name || input.name || "",
    input.city,
    p.reviews || []
  );

  // Slug unique
  const slug = `${(p.name || input.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${input.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${placeId.substring(0, 8)}`;

  const insertData = {
    slug,
    name: p.name || input.name || "",
    category: mapType(p.types || []) as "restaurant" | "hotel" | "bar" | "spa" | "museum" | "park" | "beach" | "nightclub" | "shopping" | "transport" | "activity" | "experience" | "wellness",
    city: input.city,
    country: input.country || "France",
    address: p.formatted_address || "",
    lat: p.geometry?.location?.lat || input.lat || 0,
    lng: p.geometry?.location?.lng || input.lng || 0,
    rating: p.rating ? String(p.rating) : null,
    reviewCount: p.user_ratings_total || 0,
    priceLevel: p.price_level ? (["budget", "moderate", "upscale", "luxury"][Math.min(p.price_level - 1, 3)] as "budget" | "moderate" | "upscale" | "luxury") : "upscale" as const,
    description,
    ambiance: "chic",
    phone: p.formatted_phone_number || null,
    website: p.website || null,
    googlePlaceId: placeId,
    featuredPhoto: photoUrls[0] || null,
    photos: photoUrls,
    source: "google_places",
    verified: false,
    status: "published" as const,
    generatedBy: "ai" as const,
    createdBy: "establishment_service",
    timesRecommended: 1,
    lastRecommended: new Date(),
  };

  const db2 = await getDb();
  if (!db2) return null;
  const result = await db2.insert(establishments).values(insertData);
  const insertId = (result as unknown as { insertId: number }).insertId;
  const rows = await db2.select().from(establishments).where(eq(establishments.id, insertId)).limit(1);
  return rows[0] || null;
}
/**
 * Crée une fiche minimale sans Google Places (fallback)
 */
async function createMinimalEstablishment(
  input: EstablishmentInput
): Promise<EstablishmentRow | null> {
  const slug = `${(input.name || "lieu").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${input.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const description = await generateDescription(input.name || "", input.city, []);

  const insertData = {
    slug,
    name: input.name || "",
    category: "restaurant" as const,
    city: input.city,
    country: input.country || "France",
    lat: input.lat || 0,
    lng: input.lng || 0,
    description,
    source: "manual",
    verified: false,
    status: "published" as const,
    generatedBy: "ai" as const,
    createdBy: "establishment_service",
    timesRecommended: 1,
    lastRecommended: new Date(),
  };

  const db3 = await getDb();
  if (!db3) return null;
  const result = await db3.insert(establishments).values(insertData);
  const insertId = (result as unknown as { insertId: number }).insertId;
  const rows = await db3.select().from(establishments).where(eq(establishments.id, insertId)).limit(1);
  return rows[0] || null;
}
/**
 * Génère une description émotionnelle via Claude
 */
async function generateDescription(
  name: string,
  city: string,
  reviews: Array<{ text: string; rating: number }>
): Promise<string> {
  const topReviews = reviews
    .filter((r) => r.rating >= 4)
    .slice(0, 3)
    .map((r) => r.text.substring(0, 200))
    .join(" | ");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: `Écris 2 phrases maximum qui donnent envie de visiter ${name} à ${city}. Style magazine de luxe. Basé sur ces avis : ${topReviews || "Établissement d'exception"}. Mentionne l'ambiance, la spécialité, ce qui rend le lieu unique. Pas de guillemets.`,
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : `${name} — une adresse d'exception à ${city}.`;
  } catch {
    return `${name} est une adresse d'exception à ${city}, reconnue pour son atmosphère unique et son service irréprochable.`;
  }
}

/**
 * Retourne les établissements similaires (même ville, même catégorie)
 */
export async function getSimilarEstablishments(
  establishmentId: number,
  city: string,
  category: string,
  limit = 3
): Promise<EstablishmentRow[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(establishments)
    .where(
      and(
        sql`${establishments.id} != ${establishmentId}`,
        sql`LOWER(${establishments.city}) = LOWER(${city})`,
        eq(establishments.status, "published")
      )
    )
    .orderBy(sql`${establishments.timesRecommended} DESC`)
    .limit(limit);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mapType(types: string[]): string {
  if (types.includes("lodging")) return "hotel";
  if (types.includes("restaurant")) return "restaurant";
  if (types.includes("bar")) return "bar";
  if (types.includes("spa")) return "spa";
  if (types.includes("night_club")) return "nightclub";
  if (types.includes("tourist_attraction")) return "activity";
  return "experience";
}
