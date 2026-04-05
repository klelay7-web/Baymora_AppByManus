/**
 * GOOGLE MAPS SERVICE — Intelligence logistique Baymora
 *
 * Capacités :
 * - Calcul temps de trajet domicile → aéroport (trafic temps réel)
 * - Analyse de quartier (restaurants, expériences, POI)
 * - Distance et transport optimal (taxi, Uber, RER, navette)
 * - Géocodage d'adresses
 */

export interface TravelTimeResult {
  durationMin: number;         // Temps de trajet estimé en minutes
  durationText: string;        // "45 minutes"
  distanceKm: number;
  distanceText: string;        // "38 km"
  trafficDelayMin: number;     // Délai dû au trafic
  summary: string;             // "Via A1 / Autoroute du Nord"
  departureTime: Date;
}

export interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;         // 1-4
  openNow?: boolean;
  types: string[];
  placeId: string;
  website?: string;
  phoneNumber?: string;
  googleMapsUrl: string;
}

export interface AirportLogistics {
  travelTimeMin: number;
  travelTimeText: string;
  recommendedDepartureMin: number; // Total buffer avant décollage
  breakdown: {
    transit: number;        // Trajet domicile→aéroport
    checkin: number;        // Enregistrement / bagages
    security: number;       // Contrôle sécurité / passeport
    lounge: number;         // Temps salon (si applicable)
    boarding: number;       // Accès porte d'embarquement
    buffer: number;         // Marge de sécurité
  };
  advice: string;           // Conseil personnalisé
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapsApiKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY || null;
}

// ─── Calcul du temps de trajet ────────────────────────────────────────────────

export async function getTravelTime(
  origin: string,
  destination: string,
  departureTime?: Date
): Promise<TravelTimeResult | null> {
  const key = mapsApiKey();
  if (!key) {
    console.warn('[MAPS] GOOGLE_MAPS_API_KEY non configurée');
    return null;
  }

  try {
    const params = new URLSearchParams({
      origin,
      destination,
      key,
      mode: 'driving',
      language: 'fr',
      traffic_model: 'best_guess',
      departure_time: departureTime
        ? String(Math.floor(departureTime.getTime() / 1000))
        : 'now',
    });

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.routes?.[0]) {
      console.error('[MAPS] Directions API:', data.status);
      return null;
    }

    const leg = data.routes[0].legs[0];
    const normalDuration = leg.duration.value / 60;
    const trafficDuration = (leg.duration_in_traffic?.value || leg.duration.value) / 60;
    const trafficDelay = Math.max(0, trafficDuration - normalDuration);

    return {
      durationMin: Math.ceil(trafficDuration),
      durationText: leg.duration_in_traffic?.text || leg.duration.text,
      distanceKm: Math.round(leg.distance.value / 100) / 10,
      distanceText: leg.distance.text,
      trafficDelayMin: Math.ceil(trafficDelay),
      summary: data.routes[0].summary || '',
      departureTime: departureTime || new Date(),
    };
  } catch (error) {
    console.error('[MAPS] Erreur getTravelTime:', error);
    return null;
  }
}

// ─── Calcul logistique aéroport complet ──────────────────────────────────────

export interface FlightProfile {
  flightType: 'domestic' | 'schengen' | 'international';
  hasLounge: boolean;           // Priority Pass, Centurion, statut compagnie
  hasTSAPrecheck: boolean;      // TSA PreCheck, CLEAR, Global Entry, Priority Lane
  checkedLuggage: boolean;
  flightTime: Date;
  homeAddress: string;
  airport: string;
}

export async function calculateAirportLogistics(profile: FlightProfile): Promise<AirportLogistics> {
  // Calculer le temps de départ recommandé 3h avant le vol
  const suggestedDeparture = new Date(profile.flightTime.getTime() - 3 * 60 * 60 * 1000);
  const travel = await getTravelTime(profile.homeAddress, profile.airport, suggestedDeparture);

  const transitMin = travel?.durationMin || 45; // Fallback estimé

  // Calcul des buffers selon profil client
  const breakdown = {
    transit: transitMin,
    checkin: profile.checkedLuggage
      ? (profile.hasLounge ? 15 : 30)    // Comptoir dédié VIP vs standard
      : 5,                                // Check-in online, pas de bagage
    security: profile.hasTSAPrecheck
      ? 10                               // Priority Lane / PreCheck : 10min
      : (profile.flightType === 'international' ? 35 : 20), // Standard
    lounge: profile.hasLounge ? 30 : 0,  // Déjeuner/café au salon
    boarding: profile.flightType === 'international' ? 20 : 15,
    buffer: profile.hasLounge ? 10 : 20, // Marge : moindre si VIP (moins de stress)
  };

  const totalMin = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Génère le conseil personnalisé
  const adviceParts: string[] = [];
  if (travel?.trafficDelayMin && travel.trafficDelayMin > 15) {
    adviceParts.push(`trafic dense prévu (+${travel.trafficDelayMin} min)`);
  }
  if (profile.hasLounge) {
    adviceParts.push('accès salon inclus dans le calcul');
  }
  if (profile.hasTSAPrecheck) {
    adviceParts.push('Priority Lane pour la sécurité');
  }
  if (profile.flightType === 'international') {
    adviceParts.push('contrôle passeport inclus');
  }

  const advice = adviceParts.length > 0
    ? `Calculé en tenant compte : ${adviceParts.join(', ')}.`
    : 'Temps standard calculé.';

  return {
    travelTimeMin: transitMin,
    travelTimeText: travel?.durationText || `~${transitMin} min`,
    recommendedDepartureMin: totalMin,
    breakdown,
    advice,
  };
}

// ─── Recherche de lieux / expériences ────────────────────────────────────────

export async function searchPlaces(
  query: string,
  location: string,
  type?: 'restaurant' | 'bar' | 'cafe' | 'tourist_attraction' | 'spa' | 'night_club',
  radius: number = 2000
): Promise<PlaceResult[]> {
  const key = mapsApiKey();
  if (!key) return [];

  try {
    const params = new URLSearchParams({
      query: `${query} ${location}`,
      key,
      language: 'fr',
    });
    if (type) params.set('type', type);

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') return [];

    return (data.results || []).slice(0, 8).map((p: any): PlaceResult => ({
      name: p.name,
      address: p.formatted_address,
      rating: p.rating,
      priceLevel: p.price_level,
      openNow: p.opening_hours?.open_now,
      types: p.types || [],
      placeId: p.place_id,
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }));
  } catch (error) {
    console.error('[MAPS] Erreur searchPlaces:', error);
    return [];
  }
}

// ─── Géocodage ────────────────────────────────────────────────────────────────

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formatted: string } | null> {
  const key = mapsApiKey();
  if (!key) return null;

  try {
    const params = new URLSearchParams({ address, key, language: 'fr' });
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) return null;

    const r = data.results[0];
    return {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      formatted: r.formatted_address,
    };
  } catch {
    return null;
  }
}

// ─── Formater pour Claude ────────────────────────────────────────────────────

export function formatLogisticsForClaude(logistics: AirportLogistics, flightTime: Date): string {
  const departureTime = new Date(flightTime.getTime() - logistics.recommendedDepartureMin * 60000);
  const timeStr = departureTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return `## Logistique aéroport (calculé)
Départ recommandé du domicile : **${timeStr}**
Détail : trajet ${logistics.breakdown.transit}min + enregistrement ${logistics.breakdown.checkin}min + sécurité ${logistics.breakdown.security}min${logistics.breakdown.lounge ? ` + salon ${logistics.breakdown.lounge}min` : ''} + embarquement ${logistics.breakdown.boarding}min + marge ${logistics.breakdown.buffer}min
${logistics.advice}`;
}
