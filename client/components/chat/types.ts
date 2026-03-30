/**
 * Chat types, interfaces et fonctions de parsing.
 * Extrait de Chat.tsx pour modularité.
 */

// ─── Plan de voyage ───────────────────────────────────────────────────────────

export interface TripPlanItem {
  name: string;
  note?: string;
  stars?: number;
  bookingUrl?: string;
  price?: string;
  status?: 'suggestion' | 'selected';
}

export interface TripPlanFlight {
  from: string;
  to: string;
  date?: string;
  time?: string;
  operator?: string;
  price?: string;
  status?: 'suggestion' | 'selected';
}

export interface TripPlanTransport {
  toAirport?: { needed: boolean; mode?: string; departureTime?: string; price?: string };
  onSite?: { needed: boolean; mode?: string; note?: string };
  return?: { needed: boolean; mode?: string; note?: string };
  eatAtAirport?: boolean;
  flightDeparture?: string;
  returnFlightDeparture?: string;
}

export interface TripPlan {
  destination?: string;
  dates?: string;
  duration?: string;
  travelers?: number;
  travelerNames?: string[];
  budget?: string;
  hotels?: TripPlanItem[];
  flights?: TripPlanFlight[];
  activities?: TripPlanItem[];
  restaurants?: TripPlanItem[];
  notes?: string[];
  transport?: TripPlanTransport;
  logistiqueComplete?: boolean;
}

export interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  duration?: number;
  location?: string;
  notes?: string;
}

export interface PlaceItem {
  name: string;
  type: 'hotel' | 'restaurant' | 'activity' | 'beach' | 'city' | 'bar' | 'spa' | 'other';
  city: string;
  address?: string;
  priceLevel?: 1 | 2 | 3 | 4;
  priceFrom?: number;
  currency?: string;
  priceUnit?: string;
  rating?: number;
  description?: string;
  tags?: string[];
  bookingUrl?: string;
  mapsUrl?: string;
  baymoraPartner?: boolean;
  affiliateCode?: string;
  baymoraPrice?: string;
}

export interface MapView {
  query: string;
  zoom?: number;
}

export interface JourneyStep {
  type: 'car' | 'train' | 'plane' | 'taxi' | 'metro' | 'uber' | 'boat' | 'walk' | 'helicopter';
  from: string;
  to: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  cost?: string;
  operator?: string;
  note?: string;
}

export interface Journey {
  from: string;
  to: string;
  travelDate?: string;
  steps: JourneyStep[];
  totalCost?: string;
  totalDuration?: string;
}

// ─── Merge helpers ───────────────────────────────────────────────────────────

function mergeByName<T extends { name: string }>(prev?: T[], next?: T[]): T[] | undefined {
  if (!next?.length) return prev;
  if (!prev?.length) return next;
  const map = new Map(prev.map(i => [i.name, i]));
  for (const item of next) map.set(item.name, { ...map.get(item.name), ...item });
  return Array.from(map.values());
}

export function mergeTripPlan(prev: TripPlan | null, update: TripPlan): TripPlan {
  const base = prev ?? {};
  return {
    ...base,
    ...update,
    hotels: mergeByName(base.hotels, update.hotels),
    flights: update.flights ?? base.flights,
    activities: mergeByName(base.activities, update.activities),
    restaurants: mergeByName(base.restaurants, update.restaurants),
    notes: update.notes ?? base.notes,
    transport: {
      ...base.transport,
      ...update.transport,
      toAirport: update.transport?.toAirport
        ? { ...base.transport?.toAirport, ...update.transport.toAirport }
        : base.transport?.toAirport,
      onSite: update.transport?.onSite
        ? { ...base.transport?.onSite, ...update.transport.onSite }
        : base.transport?.onSite,
      return: update.transport?.return
        ? { ...base.transport?.return, ...update.transport.return }
        : base.transport?.return,
    },
  };
}

// ─── Google Calendar URL builder ─────────────────────────────────────────────

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const dateStr = event.date.replace(/-/g, '');
  let startStr: string;
  let endStr: string;

  if (event.time) {
    const durationMin = event.duration || 60;
    const startDate = new Date(`${event.date}T${event.time}:00`);
    const endDate = new Date(startDate.getTime() + durationMin * 60000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    startStr = fmt(startDate);
    endStr = fmt(endDate);
  } else {
    const next = new Date(event.date);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().split('T')[0].replace(/-/g, '');
    startStr = dateStr;
    endStr = nextStr;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startStr}/${endStr}`,
    ctz: 'Europe/Paris',
  });
  if (event.location) params.set('location', event.location);
  if (event.notes) params.set('details', event.notes);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Message parser ──────────────────────────────────────────────────────────

export function parseMessage(content: string): {
  text: string;
  quickReplies: string[];
  showContacts: boolean;
  calendarEvents: CalendarEvent[];
  planUpdate: TripPlan | null;
  places: PlaceItem[];
  mapView: MapView | null;
  journey: Journey | null;
} {
  let working = content;

  const showContacts = working.includes(':::CONTACTS:::');
  working = working.replace(':::CONTACTS:::', '').trim();

  const calendarEvents: CalendarEvent[] = [];
  working = working.replace(/:::GCAL:::([\s\S]*?):::END:::/g, (_, json) => {
    try {
      const ev = JSON.parse(json.trim()) as CalendarEvent;
      if (ev.title && ev.date) calendarEvents.push(ev);
    } catch {}
    return '';
  });

  let planUpdate: TripPlan | null = null;
  working = working.replace(/:::PLAN:::([\s\S]*?):::END:::/g, (_, json) => {
    try { planUpdate = JSON.parse(json.trim()) as TripPlan; } catch {}
    return '';
  });

  const places: PlaceItem[] = [];
  working = working.replace(/:::PLACES:::([\s\S]*?):::END:::/g, (_, json) => {
    try {
      const parsed = JSON.parse(json.trim());
      if (Array.isArray(parsed)) places.push(...parsed);
    } catch {}
    return '';
  });

  let mapView: MapView | null = null;
  working = working.replace(/:::MAP:::([\s\S]*?):::END:::/g, (_, json) => {
    try { mapView = JSON.parse(json.trim()) as MapView; } catch {}
    return '';
  });

  let journey: Journey | null = null;
  working = working.replace(/:::JOURNEY:::([\s\S]*?):::END:::/g, (_, json) => {
    try { journey = JSON.parse(json.trim()) as Journey; } catch {}
    return '';
  });

  const qrMatch = working.match(/:::QR:::([\s\S]*?):::END:::/);
  const quickReplies = qrMatch
    ? qrMatch[1].split('|').map(s => s.trim()).filter(Boolean)
    : [];
  working = working.replace(/:::QR:::[\s\S]*?:::END:::/, '').trim();

  return { text: working, quickReplies, showContacts, calendarEvents, planUpdate, places, mapView, journey };
}

// ─── Plan helpers ────────────────────────────────────────────────────────────

export const TYPE_EMOJI: Record<string, string> = {
  hotel: '🏨', restaurant: '🍽️', activity: '⚡', beach: '🏖️',
  city: '🏙️', bar: '🍸', spa: '💆', other: '📍',
};

export const TRANSPORT_MODE_LABELS: Record<string, string> = {
  vtc: 'VTC', chauffeur: 'Chauffeur privé', metro: 'Transport en commun',
  self: 'Personnel', location: 'Location voiture', vtc_demand: 'VTC à la demande',
  walk: 'À pied', same: 'Identique à l\'aller', taxi: 'Taxi',
};

export function formatPlanAsText(plan: TripPlan): string {
  const lines: string[] = [`BAYMORA — Plan de voyage\n${plan.destination || 'Voyage'}`, ''];
  if (plan.dates) lines.push(`📅 ${plan.dates}${plan.duration ? ` · ${plan.duration}` : ''}`);
  if (plan.travelers) lines.push(`👥 ${plan.travelers} voyageur${plan.travelers > 1 ? 's' : ''}${plan.travelerNames?.length ? ` : ${plan.travelerNames.join(', ')}` : ''}`);
  if (plan.budget) lines.push(`💰 ${plan.budget}`);
  lines.push('');
  if (plan.flights?.length) { lines.push('✈️ VOLS'); plan.flights.forEach(f => lines.push(`  ${f.from} → ${f.to}${f.date ? ` · ${f.date}` : ''}${f.time ? ` ${f.time}` : ''}${f.operator ? ` · ${f.operator}` : ''}${f.price ? ` · ${f.price}` : ''}`)); lines.push(''); }
  if (plan.hotels?.length) { lines.push('🏨 HÉBERGEMENTS'); plan.hotels.forEach(h => lines.push(`  ${h.name}${h.note ? ` · ${h.note}` : ''}${h.price ? ` · ${h.price}` : ''}`)); lines.push(''); }
  if (plan.restaurants?.length) { lines.push('🍽️ RESTAURANTS'); plan.restaurants.forEach(r => lines.push(`  ${r.name}${r.stars ? ` ${'★'.repeat(Math.min(r.stars, 3))}` : ''}${r.price ? ` · ${r.price}` : ''}`)); lines.push(''); }
  if (plan.activities?.length) { lines.push('⚡ ACTIVITÉS'); plan.activities.forEach(a => lines.push(`  ${a.name}${(a as any).day ? ` · ${(a as any).day}` : ''}${a.price ? ` · ${a.price}` : ''}`)); lines.push(''); }
  if (plan.notes?.length) { lines.push('📋 NOTES'); plan.notes.forEach(n => lines.push(`  • ${n}`)); }
  return lines.join('\n');
}

// ─── Welcome chips ───────────────────────────────────────────────────────────

export const INSPIRATION_CHIPS = [
  { label: 'Week-end', msg: 'Je cherche un week-end, propose-moi' },
  { label: 'Gastronomie', msg: 'Je veux un voyage axé gastronomie et bons restaurants' },
  { label: 'Plage & îles', msg: 'Plage et îles, quelque chose d\'exceptionnel' },
  { label: 'Chill & détente', msg: 'Quelque chose de calme, spa, nature, ressourcement total' },
  { label: 'Fête & nightlife', msg: 'Je veux de la fête, du nightlife premium' },
  { label: 'Découverte & culture', msg: 'Voyage culturel, découverte, immersion locale' },
  { label: 'Romantique', msg: 'Séjour romantique pour deux, je veux quelque chose d\'inoubliable' },
  { label: 'Avec mon animal 🐾', msg: 'Je voyage avec mon animal de compagnie (chien, chat, etc.), tout doit être pet-friendly' },
  { label: 'En famille', msg: 'Voyage en famille avec enfants' },
  { label: 'Surprends-moi ✨', msg: 'Surprends-moi totalement, je te fais confiance' },
];

export const DESTINATION_CHIPS = [
  { label: 'France', msg: 'Je veux rester en France' },
  { label: 'Europe', msg: 'Quelque part en Europe' },
  { label: 'USA', msg: 'Je veux aller aux États-Unis' },
  { label: 'Asie', msg: 'Je veux partir en Asie' },
  { label: 'Îles', msg: 'Je veux une île, mer turquoise et soleil' },
  { label: 'Moyen-Orient', msg: 'Je veux découvrir le Moyen-Orient, Dubaï, etc.' },
];
