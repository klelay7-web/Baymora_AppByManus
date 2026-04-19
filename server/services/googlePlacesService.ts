/**
 * googlePlacesService.ts
 * Search-focused Google Places API wrapper.
 * Uses the same GOOGLE_PLACES_API_KEY as establishmentService.ts.
 *
 * For auto-creation of establishment records, use findOrCreateEstablishment
 * from establishmentService.ts — it already handles the full flow.
 */

const GOOGLE_API_KEY = () => process.env.GOOGLE_PLACES_API_KEY || "";

export interface PlaceResult {
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  ratingCount: number;
  priceLevel: number;
  priceRange: string;
  category: string;
  website: string | null;
  photoUrl: string | null;
  placeId: string;
  isOpenNow: boolean | null;
}

const TYPE_MAP: Record<string, string> = {
  restaurant: "restaurant",
  bar: "bar",
  cafe: "cafe",
  night_club: "nightclub",
  lodging: "hotel",
  spa: "spa",
  museum: "museum",
  art_gallery: "gallery",
  park: "park",
  tourist_attraction: "experience",
};

const PRICE_LABELS = ["€", "€", "€€", "€€€", "€€€€"];

function mapCategory(types: string[]): string {
  for (const t of types) {
    if (TYPE_MAP[t]) return TYPE_MAP[t];
  }
  return "experience";
}

export async function searchPlaces(query: string, city: string, category?: string): Promise<PlaceResult[]> {
  const key = GOOGLE_API_KEY();
  if (!key) {
    console.warn("[GooglePlaces] GOOGLE_PLACES_API_KEY not set");
    return [];
  }

  const q = encodeURIComponent(`${category || ""} ${query} ${city}`.trim());
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${key}&language=fr`;

  try {
    const resp = await fetch(url);
    const data = await resp.json() as {
      results?: Array<{
        place_id: string;
        name: string;
        formatted_address: string;
        geometry?: { location?: { lat: number; lng: number } };
        rating?: number;
        user_ratings_total?: number;
        price_level?: number;
        types?: string[];
        photos?: Array<{ photo_reference: string }>;
        opening_hours?: { open_now?: boolean };
      }>;
    };

    if (!data.results) return [];

    return data.results
      .filter((r) => (r.rating || 0) >= 3.5)
      .slice(0, 10)
      .map((r) => {
        const photoRef = r.photos?.[0]?.photo_reference;
        return {
          name: r.name,
          address: r.formatted_address || "",
          city,
          country: "France",
          latitude: r.geometry?.location?.lat || 0,
          longitude: r.geometry?.location?.lng || 0,
          rating: r.rating || 0,
          ratingCount: r.user_ratings_total || 0,
          priceLevel: r.price_level || 2,
          priceRange: PRICE_LABELS[r.price_level || 2] || "€€",
          category: mapCategory(r.types || []),
          website: null,
          photoUrl: photoRef ? getPlacePhoto(photoRef) : null,
          placeId: r.place_id,
          isOpenNow: r.opening_hours?.open_now ?? null,
        };
      });
  } catch (err) {
    console.error("[GooglePlaces] Search failed:", err);
    return [];
  }
}

export function getPlacePhoto(photoReference: string, maxWidth: number = 800): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY()}`;
}
