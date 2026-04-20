/**
 * autoCreateEstablishment.ts
 * Thin wrapper around establishmentService.findOrCreateEstablishment.
 * Provides a slug-focused API for auto-creation from Google Places results
 * or Maya-generated place data.
 */

import { findOrCreateEstablishment } from "./establishmentService";
import type { PlaceResult } from "./googlePlacesService";
import { getDb } from "../db";
import { establishments } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function autoCreateFromPlaceResult(
  place: PlaceResult,
  source: string = "maya_live"
): Promise<{ id: number; slug: string; isNew: boolean } | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if already exists by name+city
  const existing = await db
    .select({ id: establishments.id, slug: establishments.slug })
    .from(establishments)
    .where(
      and(
        sql`LOWER(${establishments.name}) = LOWER(${place.name})`,
        sql`LOWER(${establishments.city}) = LOWER(${place.city})`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { id: existing[0].id, slug: existing[0].slug, isNew: false };
  }

  // Delegate to the existing service which handles Google Places details + Claude description
  const row = await findOrCreateEstablishment({
    name: place.name,
    city: place.city,
    country: place.country || "France",
    lat: place.latitude,
    lng: place.longitude,
    googlePlaceId: place.placeId,
  });

  if (!row) return null;
  return { id: row.id, slug: row.slug, isNew: true };
}

export async function autoCreateFromMayaPlace(
  place: { name: string; city?: string; country?: string; coordinates?: { lat: number; lng: number } },
  userCity: string,
  source: string = "maya_live"
): Promise<{ id: number; slug: string; isNew: boolean } | null> {
  const city = place.city || userCity;
  if (!place.name || !city) return null;

  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select({ id: establishments.id, slug: establishments.slug })
    .from(establishments)
    .where(
      and(
        sql`LOWER(${establishments.name}) = LOWER(${place.name})`,
        sql`LOWER(${establishments.city}) = LOWER(${city})`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { id: existing[0].id, slug: existing[0].slug, isNew: false };
  }

  const row = await findOrCreateEstablishment({
    name: place.name,
    city,
    country: place.country || "France",
    lat: place.coordinates?.lat,
    lng: place.coordinates?.lng,
  });

  if (!row) return null;
  return { id: row.id, slug: row.slug, isNew: true };
}
