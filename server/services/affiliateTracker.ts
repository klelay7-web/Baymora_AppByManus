/**
 * AFFILIATE TRACKER — Auto-tracks venues recommended by the AI
 *
 * Pipeline: AI recommends → auto-tracked → appears in Atlas dashboard as draft
 *           → team reviews → publishes → becomes affiliate
 */

import { prisma } from '../db';

interface ParsedPlace {
  name: string;
  type: string;
  city: string;
  address?: string;
  priceLevel?: number;
  priceFrom?: number;
  currency?: string;
  rating?: number;
  description?: string;
  tags?: string[];
  bookingUrl?: string;
}

/**
 * Parses :::PLACES::: tags from an assistant message and returns an array of places.
 */
function parsePlacesFromMessage(assistantMessage: string): ParsedPlace[] {
  const places: ParsedPlace[] = [];
  const regex = /:::PLACES:::([\s\S]*?):::END:::/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(assistantMessage)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p.name && p.city && p.type) {
            places.push(p);
          }
        }
      }
    } catch {
      // Malformed JSON — skip silently
    }
  }

  return places;
}

/**
 * Tracks venues/hotels/restaurants recommended by the AI as potential affiliate partners.
 *
 * For each place found in :::PLACES::: tags:
 * - Checks if it already exists in AtlasVenue (by name + city)
 * - If not found, creates a DRAFT entry for team review
 */
export async function trackRecommendedVenues(
  assistantMessage: string,
  userId: string,
): Promise<void> {
  const places = parsePlacesFromMessage(assistantMessage);
  if (places.length === 0) return;

  for (const place of places) {
    try {
      // Check if venue already exists (case-insensitive match on name + city)
      const existing = await prisma.atlasVenue.findFirst({
        where: {
          name: { equals: place.name, mode: 'insensitive' },
          city: { equals: place.city, mode: 'insensitive' },
        },
      });

      if (existing) continue;

      // Create a draft venue entry for team review
      await prisma.atlasVenue.create({
        data: {
          name: place.name,
          type: place.type,
          city: place.city,
          country: 'FR',
          address: place.address ?? null,
          description: place.description ?? null,
          rating: place.rating ?? null,
          priceLevel: place.priceLevel ?? 2,
          priceFrom: place.priceFrom ?? null,
          currency: place.currency === '€' ? 'EUR' : (place.currency || 'EUR'),
          tags: place.tags ?? [],
          website: place.bookingUrl ?? null,
          status: 'draft',
          createdBy: 'auto-tracker',
          affiliateType: 'auto',
        },
      });

      console.log(
        `[AFFILIATE_TRACKER] New venue tracked: ${place.name} (${place.city})`,
      );
    } catch (e) {
      console.error(
        `[AFFILIATE_TRACKER] Error tracking venue ${place.name}:`,
        e,
      );
    }
  }
}
