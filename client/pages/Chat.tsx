import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, Trash2, User, MapPin, Calendar, Users, Wallet, Hotel, Utensils, Zap, Plane, StickyNote, ChevronRight, Star, ExternalLink, Navigation, Car, Mail, Download, Printer, ExternalLink as LinkIcon, Bookmark } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth, getGuestMessageCount, incrementGuestMessageCount, FREE_MESSAGES_LIMIT, FREE_CREDITS_LIMIT } from '@/hooks/useAuth';
import ConversionModal from '@/components/ConversionModal';
import CreditGate from '@/components/CreditGate';
import ContactPicker from '@/components/ContactPicker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Parseur de message complet ───────────────────────────────────────────────
// Tags supportés :
//   :::QR::: A | B | C :::END:::          → suggestions rapides
//   :::CONTACTS:::                          → sélecteur de contacts
//   :::GCAL:::{"title":...}:::END:::        → bouton Google Calendar

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

// Deep merge for trip plan (preserves existing items, updates by name)
function mergeByName<T extends { name: string }>(prev?: T[], next?: T[]): T[] | undefined {
  if (!next?.length) return prev;
  if (!prev?.length) return next;
  const map = new Map(prev.map(i => [i.name, i]));
  for (const item of next) map.set(item.name, { ...map.get(item.name), ...item });
  return Array.from(map.values());
}

function mergeTripPlan(prev: TripPlan | null, update: TripPlan): TripPlan {
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

export interface CalendarEvent {
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM
  duration?: number;  // minutes
  location?: string;
  notes?: string;
}

// ─── Carte lieu (Staycation-style) ───────────────────────────────────────────

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
  // Partenaire Baymora
  baymoraPartner?: boolean;
  affiliateCode?: string;
  baymoraPrice?: string;
}

// ─── Vue carte géographique ───────────────────────────────────────────────────

export interface MapView {
  query: string;
  zoom?: number;
}

// ─── Parcours complet ─────────────────────────────────────────────────────────

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

function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const dateStr = event.date.replace(/-/g, '');
  let startStr: string;
  let endStr: string;

  if (event.time) {
    const [h, m] = event.time.split(':').map(Number);
    const durationMin = event.duration || 60;
    const startDate = new Date(`${event.date}T${event.time}:00`);
    const endDate = new Date(startDate.getTime() + durationMin * 60000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    startStr = fmt(startDate);
    endStr = fmt(endDate);
  } else {
    // All-day event
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

function parseMessage(content: string): {
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

  // Extract :::CONTACTS:::
  const showContacts = working.includes(':::CONTACTS:::');
  working = working.replace(':::CONTACTS:::', '').trim();

  // Extract :::GCAL::: events
  const calendarEvents: CalendarEvent[] = [];
  working = working.replace(/:::GCAL:::([\s\S]*?):::END:::/g, (_, json) => {
    try {
      const ev = JSON.parse(json.trim()) as CalendarEvent;
      if (ev.title && ev.date) calendarEvents.push(ev);
    } catch {}
    return '';
  });

  // Extract :::PLAN:::
  let planUpdate: TripPlan | null = null;
  working = working.replace(/:::PLAN:::([\s\S]*?):::END:::/g, (_, json) => {
    try { planUpdate = JSON.parse(json.trim()) as TripPlan; } catch {}
    return '';
  });

  // Extract :::PLACES:::
  const places: PlaceItem[] = [];
  working = working.replace(/:::PLACES:::([\s\S]*?):::END:::/g, (_, json) => {
    try {
      const parsed = JSON.parse(json.trim());
      if (Array.isArray(parsed)) places.push(...parsed);
    } catch {}
    return '';
  });

  // Extract :::MAP:::
  let mapView: MapView | null = null;
  working = working.replace(/:::MAP:::([\s\S]*?):::END:::/g, (_, json) => {
    try { mapView = JSON.parse(json.trim()) as MapView; } catch {}
    return '';
  });

  // Extract :::JOURNEY:::
  let journey: Journey | null = null;
  working = working.replace(/:::JOURNEY:::([\s\S]*?):::END:::/g, (_, json) => {
    try { journey = JSON.parse(json.trim()) as Journey; } catch {}
    return '';
  });

  // Extract :::QR:::
  const qrMatch = working.match(/:::QR:::([\s\S]*?):::END:::/);
  const quickReplies = qrMatch
    ? qrMatch[1].split('|').map(s => s.trim()).filter(Boolean)
    : [];
  working = working.replace(/:::QR:::[\s\S]*?:::END:::/, '').trim();

  return { text: working, quickReplies, showContacts, calendarEvents, planUpdate, places, mapView, journey };
}

// ─── Carte Google Calendar ────────────────────────────────────────────────────

function CalendarCard({ event }: { event: CalendarEvent }) {
  const url = buildGoogleCalendarUrl(event);
  const dateLabel = event.date
    ? new Date(event.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  return (
    <div className="mt-2 bg-secondary/8 border border-secondary/25 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-white/80 text-xs font-semibold truncate">📅 {event.title}</p>
        <p className="text-white/35 text-xs mt-0.5">
          {dateLabel}{event.time ? ` à ${event.time}` : ''}{event.location ? ` · ${event.location}` : ''}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 bg-secondary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-secondary/90 transition-all whitespace-nowrap"
      >
        + Agenda
      </a>
    </div>
  );
}

// ─── Carte lieu (style Staycation) ───────────────────────────────────────────

const PLACE_TYPE_CONFIG: Record<string, { emoji: string; gradient: string; badge: string }> = {
  hotel:      { emoji: '🏨', gradient: 'from-amber-950 via-amber-900/80 to-amber-950',   badge: 'Hôtel' },
  restaurant: { emoji: '🍽️', gradient: 'from-rose-950 via-rose-900/80 to-rose-950',      badge: 'Restaurant' },
  activity:   { emoji: '⚡', gradient: 'from-emerald-950 via-emerald-900/80 to-emerald-950', badge: 'Activité' },
  beach:      { emoji: '🏖️', gradient: 'from-sky-950 via-sky-900/80 to-sky-950',          badge: 'Plage' },
  city:       { emoji: '🌆', gradient: 'from-violet-950 via-violet-900/80 to-violet-950', badge: 'Destination' },
  bar:        { emoji: '🍸', gradient: 'from-purple-950 via-purple-900/80 to-purple-950', badge: 'Bar & Cocktail' },
  spa:        { emoji: '🧖', gradient: 'from-teal-950 via-teal-900/80 to-teal-950',       badge: 'Spa & Bien-être' },
  other:      { emoji: '📍', gradient: 'from-slate-800 via-slate-700/80 to-slate-800',    badge: 'Lieu' },
};

function PlaceCard({ place }: { place: PlaceItem }) {
  const config = PLACE_TYPE_CONFIG[place.type] || PLACE_TYPE_CONFIG.other;
  const priceStr = place.priceLevel ? '€'.repeat(place.priceLevel) : null;
  const bookingHref = place.baymoraPartner && place.affiliateCode
    ? `/api/partners/track/${place.affiliateCode}${place.bookingUrl ? `?redirect=${encodeURIComponent(place.bookingUrl)}` : ''}`
    : place.bookingUrl
    ? `/go?url=${encodeURIComponent(place.bookingUrl)}&ref=baymora`
    : place.mapsUrl;

  return (
    <div className={`flex-shrink-0 w-52 rounded-2xl overflow-hidden border transition-all group ${place.baymoraPartner ? 'border-secondary/40 bg-slate-900 hover:border-secondary/70' : 'border-white/10 bg-slate-900 hover:border-white/20'}`}>
      {/* Visual header */}
      <div className={`relative h-28 bg-gradient-to-br ${config.gradient} flex items-center justify-center overflow-hidden`}>
        <span className="text-5xl opacity-50 group-hover:scale-110 transition-transform duration-500">{config.emoji}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <div className="absolute top-2 left-2 bg-black/55 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 rounded-full font-medium">
          {config.badge}
        </div>
        {place.baymoraPartner ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-secondary/25 backdrop-blur-sm border border-secondary/50 text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">
            🤝 Partenaire
          </div>
        ) : priceStr ? (
          <div className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">
            {priceStr}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <div>
          <p className="text-white font-semibold text-sm leading-tight line-clamp-1">{place.name}</p>
          <p className="text-white/45 text-xs mt-0.5 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{place.city}{place.address ? `, ${place.address}` : ''}</span>
          </p>
        </div>

        {/* Rating */}
        {place.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-white/75 text-xs font-medium">{place.rating}</span>
          </div>
        )}

        {/* Description */}
        {place.description && (
          <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{place.description}</p>
        )}

        {/* Tarif exclusif Baymora */}
        {place.baymoraPartner && place.baymoraPrice && (
          <p className="text-secondary text-xs font-bold">
            🏷️ Tarif exclusif : {place.baymoraPrice}
          </p>
        )}

        {/* Price from */}
        {!place.baymoraPrice && place.priceFrom && (
          <p className="text-secondary text-xs font-semibold">
            À partir de {place.priceFrom}{place.currency || '€'}{place.priceUnit ? `/${place.priceUnit}` : ''}
          </p>
        )}

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {place.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="bg-white/6 text-white/45 text-[10px] px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        {bookingHref && (
          <a
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-1.5 rounded-xl transition-all mt-1 ${place.baymoraPartner ? 'bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/35' : 'bg-secondary/12 border border-secondary/30 text-secondary hover:bg-secondary/22'}`}
          >
            {place.baymoraPartner ? '🤝 Réserver via Baymora' : 'Voir & réserver'} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function PlacesCarousel({ places }: { places: PlaceItem[] }) {
  if (!places.length) return null;
  return (
    <div className="mt-2 -mr-4">
      <div className="flex gap-3 overflow-x-auto pb-2 pr-4" style={{ scrollbarWidth: 'none' }}>
        {places.map((place, i) => <PlaceCard key={i} place={place} />)}
      </div>
    </div>
  );
}

// ─── Carte géographique embedded ──────────────────────────────────────────────

function MapEmbed({ mapView }: { mapView: MapView }) {
  const query = encodeURIComponent(mapView.query);
  const zoom = mapView.zoom || 13;
  const src = `https://maps.google.com/maps?q=${query}&z=${zoom}&output=embed&hl=fr`;
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 h-44 relative">
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.1)' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Carte ${mapView.query}`}
        className="w-full h-full"
      />
      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white/70 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1">
        <MapPin className="h-2.5 w-2.5 text-secondary" /> {mapView.query}
      </div>
    </div>
  );
}

// ─── Parcours complet ─────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, string> = {
  car: '🚗', train: '🚄', plane: '✈️', taxi: '🚕',
  metro: '🚇', uber: '🚙', boat: '⛵', walk: '🚶', helicopter: '🚁',
};

function JourneyView({ journey }: { journey: Journey }) {
  return (
    <div className="mt-2 bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-secondary" />
          <span className="text-white/80 text-xs font-semibold">Votre trajet complet</span>
        </div>
        <div className="flex items-center gap-2">
          {journey.totalDuration && <span className="text-white/45 text-xs">{journey.totalDuration}</span>}
          {journey.totalCost && <span className="text-secondary text-xs font-bold">{journey.totalCost}</span>}
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-0">
        {journey.steps.map((step, i) => (
          <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line */}
            {i < journey.steps.length - 1 && (
              <div className="absolute left-4 top-8 w-px bg-white/10" style={{ height: 'calc(100% - 1rem)' }} />
            )}
            {/* Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-white/12 flex items-center justify-center text-sm z-10">
              {STEP_ICONS[step.type] || '📍'}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/85 text-xs font-medium leading-tight">{step.from} → {step.to}</p>
                  {step.operator && <p className="text-white/40 text-xs mt-0.5">{step.operator}</p>}
                  {step.note && <p className="text-amber-400/70 text-xs mt-0.5">⚠️ {step.note}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  {(step.departure || step.arrival) && (
                    <p className="text-white/50 text-xs whitespace-nowrap">
                      {step.departure}{step.arrival ? ` → ${step.arrival}` : ''}
                    </p>
                  )}
                  {step.duration && <p className="text-white/35 text-xs">{step.duration}</p>}
                  {step.cost && <p className="text-secondary text-xs font-semibold">{step.cost}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-white/3 border-t border-white/6 flex items-center gap-2 text-xs text-white/35">
        <span className="truncate">🏠 {journey.from}</span>
        <span className="flex-shrink-0 text-secondary">→→→</span>
        <span className="truncate text-right">📍 {journey.to}</span>
      </div>
    </div>
  );
}

// ─── Welcome chips ─────────────────────────────────────────────────────────────

const INSPIRATION_CHIPS = [
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

const DESTINATION_CHIPS = [
  { label: 'France', msg: 'Je veux rester en France' },
  { label: 'Europe', msg: 'Quelque part en Europe' },
  { label: 'USA', msg: 'Je veux aller aux États-Unis' },
  { label: 'Asie', msg: 'Je veux partir en Asie' },
  { label: 'Îles', msg: 'Je veux une île, mer turquoise et soleil' },
  { label: 'Moyen-Orient', msg: 'Je veux découvrir le Moyen-Orient, Dubaï, etc.' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = {
  hotel: '🏨', restaurant: '🍽️', activity: '⚡', beach: '🏖️',
  city: '🏙️', bar: '🍸', spa: '💆', other: '📍',
};

const TRANSPORT_MODE_LABELS: Record<string, string> = {
  vtc: 'VTC', chauffeur: 'Chauffeur privé', metro: 'Transport en commun',
  self: 'Personnel', location: 'Location voiture', vtc_demand: 'VTC à la demande',
  walk: 'À pied', same: 'Identique à l\'aller', taxi: 'Taxi',
};

type ReservationMode = 'self' | 'assistant' | 'baymora';

function formatPlanAsText(plan: TripPlan): string {
  const lines: string[] = [`BAYMORA — Plan de voyage\n${plan.destination || 'Voyage'}`, ''];
  if (plan.dates) lines.push(`📅 ${plan.dates}${plan.duration ? ` · ${plan.duration}` : ''}`);
  if (plan.travelers) lines.push(`👥 ${plan.travelers} voyageur${plan.travelers > 1 ? 's' : ''}${plan.travelerNames?.length ? ` : ${plan.travelerNames.join(', ')}` : ''}`);
  if (plan.budget) lines.push(`💰 ${plan.budget}`);
  lines.push('');
  if (plan.flights?.length) { lines.push('✈️ VOLS'); plan.flights.forEach(f => lines.push(`  ${f.from} → ${f.to}${f.date ? ` · ${f.date}` : ''}${f.time ? ` ${f.time}` : ''}${f.operator ? ` · ${f.operator}` : ''}${f.price ? ` · ${f.price}` : ''}`)); lines.push(''); }
  if (plan.transport) { lines.push('🚗 LOGISTIQUE'); if (plan.transport.toAirport) lines.push(`  Aller aéroport : ${TRANSPORT_MODE_LABELS[plan.transport.toAirport.mode || ''] || plan.transport.toAirport.mode || ''}${plan.transport.toAirport.departureTime ? ` · Départ ${plan.transport.toAirport.departureTime}` : ''}${plan.transport.toAirport.price ? ` · ${plan.transport.toAirport.price}` : ''}`); if (plan.transport.eatAtAirport !== undefined) lines.push(`  Repas aéroport : ${plan.transport.eatAtAirport ? 'Oui' : 'Non'}`); if (plan.transport.onSite) lines.push(`  Sur place : ${TRANSPORT_MODE_LABELS[plan.transport.onSite.mode || ''] || plan.transport.onSite.mode || ''}`); if (plan.transport.return) lines.push(`  Retour : ${TRANSPORT_MODE_LABELS[plan.transport.return.mode || ''] || plan.transport.return.mode || ''}`); lines.push(''); }
  if (plan.hotels?.length) { lines.push('🏨 HÉBERGEMENTS'); plan.hotels.forEach(h => lines.push(`  ${h.name}${h.note ? ` · ${h.note}` : ''}${h.price ? ` · ${h.price}` : ''}${h.bookingUrl ? `\n  Réserver : ${h.bookingUrl}` : ''}`)); lines.push(''); }
  if (plan.restaurants?.length) { lines.push('🍽️ RESTAURANTS'); plan.restaurants.forEach(r => lines.push(`  ${r.name}${r.stars ? ` ${'★'.repeat(r.stars)}` : ''}${r.note ? ` · ${r.note}` : ''}${r.price ? ` · ${r.price}` : ''}${r.bookingUrl ? `\n  Réserver : ${r.bookingUrl}` : ''}`)); lines.push(''); }
  if (plan.activities?.length) { lines.push('⚡ ACTIVITÉS'); plan.activities.forEach(a => lines.push(`  ${a.name}${(a as any).day ? ` · ${(a as any).day}` : ''}${a.price ? ` · ${a.price}` : ''}${a.bookingUrl ? `\n  Réserver : ${a.bookingUrl}` : ''}`)); lines.push(''); }
  if (plan.notes?.length) { lines.push('📋 NOTES'); plan.notes.forEach(n => lines.push(`  • ${n}`)); }
  return lines.join('\n');
}

// ─── Panneau Plan de voyage — redesigné ──────────────────────────────────────

function TripPlanPanel({ plan, allPlaces, onClose }: { plan: TripPlan; allPlaces: PlaceItem[]; onClose?: () => void }) {
  const [reservationMode, setReservationMode] = useState<ReservationMode>('self');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSaveTrip = async () => {
    if (!user) return; // bouton non rendu sans auth
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('baymora_token');
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTripId(data.trip.id);
      }
    } catch {}
    setSaveLoading(false);
  };

  const hasContent = plan.destination || plan.hotels?.length || plan.flights?.length ||
    plan.activities?.length || plan.restaurants?.length || plan.notes?.length || plan.transport;

  if (!hasContent) return null;

  // Sections visible dans la nav
  const navSections = [
    { id: 'plan-map',        emoji: '🗺️', label: 'Carte',       visible: !!plan.destination },
    { id: 'plan-transport',  emoji: '🚗', label: 'Transport',   visible: !!(plan.flights?.length || plan.transport) },
    { id: 'plan-hotels',     emoji: '🏨', label: 'Séjour',      visible: !!(plan.hotels?.length) },
    { id: 'plan-restaurants',emoji: '🍽️', label: 'Table',       visible: !!(plan.restaurants?.length) },
    { id: 'plan-activities', emoji: '⚡', label: 'Activités',   visible: !!(plan.activities?.length) },
    { id: 'plan-notes',      emoji: '📋', label: 'Notes',       visible: !!(plan.notes?.length) },
  ].filter(s => s.visible);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Grouper les places par type
  const placesByType = allPlaces.reduce<Record<string, PlaceItem[]>>((acc, p) => {
    acc[p.type] = acc[p.type] ? [...acc[p.type], p] : [p];
    return acc;
  }, {});

  const handleEmailExport = async () => {
    const email = prompt('Votre adresse email pour recevoir le plan :');
    if (!email) return;
    setExportLoading(true);
    setExportMsg('');
    try {
      const res = await fetch('/api/chat/export-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan }),
      });
      setExportMsg(res.ok ? '✓ Email envoyé !' : '✗ Erreur envoi');
    } catch { setExportMsg('✗ Erreur réseau'); }
    setExportLoading(false);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><title>Plan Baymora — ${plan.destination || 'Voyage'}</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#111;max-width:600px;margin:0 auto}
h1{font-size:22px;color:#c8a94a;margin-bottom:4px}h2{font-size:13px;color:#666;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:4px;margin-top:20px}
.item{margin:6px 0;padding:8px 12px;border:1px solid #eee;border-radius:6px;font-size:13px}
.badge{background:#f0e6c8;color:#8a6a00;border-radius:99px;padding:1px 8px;font-size:11px;margin-left:8px}
a{color:#c8a94a}p{margin:2px 0;font-size:13px;color:#444}footer{margin-top:32px;font-size:11px;color:#999}
</style></head><body>
<h1>${plan.destination || 'Votre voyage'}</h1>
${plan.dates ? `<p>📅 ${plan.dates}${plan.duration ? ` · ${plan.duration}` : ''}</p>` : ''}
${plan.travelers ? `<p>👥 ${plan.travelers} voyageur${plan.travelers > 1 ? 's' : ''}${plan.travelerNames?.length ? ` : ${plan.travelerNames.join(', ')}` : ''}</p>` : ''}
${plan.budget ? `<p>💰 ${plan.budget}</p>` : ''}
${plan.flights?.length ? `<h2>✈️ Vols</h2>${plan.flights.map(f => `<div class="item">${f.from} → ${f.to}${f.date ? ` · ${f.date}` : ''}${f.time ? ` ${f.time}` : ''}${f.operator ? ` · ${f.operator}` : ''}${f.price ? `<span class="badge">${f.price}</span>` : ''}</div>`).join('')}` : ''}
${plan.transport ? `<h2>🚗 Logistique</h2>${plan.transport.toAirport ? `<div class="item">Aller aéroport : ${TRANSPORT_MODE_LABELS[plan.transport.toAirport.mode || ''] || plan.transport.toAirport.mode || ''}${plan.transport.toAirport.departureTime ? ` · Départ ${plan.transport.toAirport.departureTime}` : ''}${plan.transport.toAirport.price ? `<span class="badge">${plan.transport.toAirport.price}</span>` : ''}</div>` : ''}${plan.transport.eatAtAirport !== undefined ? `<div class="item">Repas aéroport : ${plan.transport.eatAtAirport ? 'Oui' : 'Non'}</div>` : ''}${plan.transport.onSite ? `<div class="item">Sur place : ${TRANSPORT_MODE_LABELS[plan.transport.onSite.mode || ''] || plan.transport.onSite.mode || ''}</div>` : ''}${plan.transport.return ? `<div class="item">Retour : ${TRANSPORT_MODE_LABELS[plan.transport.return.mode || ''] || plan.transport.return.mode || ''}</div>` : ''}` : ''}
${plan.hotels?.length ? `<h2>🏨 Hébergements</h2>${plan.hotels.map(h => `<div class="item"><b>${h.name}</b>${h.note ? ` · ${h.note}` : ''}${h.price ? `<span class="badge">${h.price}</span>` : ''}${h.bookingUrl ? ` · <a href="${h.bookingUrl}">Réserver</a>` : ''}</div>`).join('')}` : ''}
${plan.restaurants?.length ? `<h2>🍽️ Restaurants</h2>${plan.restaurants.map(r => `<div class="item"><b>${r.name}</b>${r.stars ? ` ${'★'.repeat(r.stars)}` : ''}${r.note ? ` · ${r.note}` : ''}${r.price ? `<span class="badge">${r.price}</span>` : ''}${r.bookingUrl ? ` · <a href="${r.bookingUrl}">Réserver</a>` : ''}</div>`).join('')}` : ''}
${plan.activities?.length ? `<h2>⚡ Activités</h2>${plan.activities.map(a => `<div class="item">${a.name}${(a as any).day ? ` · ${(a as any).day}` : ''}${a.price ? `<span class="badge">${a.price}</span>` : ''}${a.bookingUrl ? ` · <a href="${a.bookingUrl}">Réserver</a>` : ''}</div>`).join('')}` : ''}
${plan.notes?.length ? `<h2>📋 Notes</h2>${plan.notes.map(n => `<div class="item">${n}</div>`).join('')}` : ''}
<footer>Plan généré par Baymora · baymora.com</footer>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `baymora-plan-${(plan.destination || 'voyage').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleCopyForAssistant = () => {
    navigator.clipboard.writeText(formatPlanAsText(plan));
    setExportMsg('✓ Copié ! Envoyez-le à : contact@baymora.com');
    setTimeout(() => setExportMsg(''), 5000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Compte-rendu</span>
        </div>
        {onClose && <button onClick={onClose} className="text-white/30 hover:text-white text-xs px-1">✕</button>}
      </div>

      {/* Mini navigation sticky */}
      {navSections.length > 1 && (
        <div className="flex gap-1 px-3 py-2 border-b border-white/6 overflow-x-auto scrollbar-hide flex-shrink-0">
          {navSections.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className="flex items-center gap-1 text-white/50 hover:text-secondary text-xs px-2.5 py-1 rounded-full bg-white/4 hover:bg-secondary/10 transition-all whitespace-nowrap flex-shrink-0">
              <span>{s.emoji}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto">

        {/* ── Infos destination ── */}
        {(plan.destination || plan.dates || plan.budget) && (
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-b border-secondary/10 px-4 py-3 space-y-1.5">
            {plan.destination && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                <span className="text-white font-semibold text-sm">{plan.destination}</span>
              </div>
            )}
            {plan.dates && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-secondary/60 flex-shrink-0" />
                <span className="text-white/70 text-xs">{plan.dates}{plan.duration ? ` · ${plan.duration}` : ''}</span>
              </div>
            )}
            {(plan.travelers || plan.travelerNames?.length) && (
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-secondary/60 flex-shrink-0" />
                <span className="text-white/70 text-xs">
                  {plan.travelerNames?.length ? plan.travelerNames.join(', ') : `${plan.travelers} voyageur${(plan.travelers || 0) > 1 ? 's' : ''}`}
                </span>
              </div>
            )}
            {plan.budget && (
              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-secondary/60 flex-shrink-0" />
                <span className="text-white/70 text-xs">{plan.budget}</span>
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-3 space-y-5 pb-4">

          {/* ── Section Carte ── */}
          {plan.destination && (
            <div id="plan-map">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Carte
              </p>
              <div className="rounded-xl overflow-hidden border border-white/8">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(plan.destination)}&output=embed`}
                  className="w-full h-40"
                  style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.1)', border: 'none' }}
                  loading="lazy"
                  title="Carte destination"
                />
              </div>
              {/* Place chips regroupées par catégorie */}
              {Object.entries(placesByType).map(([type, places]) => (
                <div key={type} className="mt-2">
                  <p className="text-white/25 text-xs mb-1">{TYPE_EMOJI[type] || '📍'} {type}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {places.map((p, i) => (
                      <a key={i}
                        href={`https://www.google.com/maps/search/?q=${encodeURIComponent(p.name + ' ' + p.city)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-white/5 border border-white/10 text-white/60 hover:text-secondary hover:border-secondary/30 px-2.5 py-1 rounded-full transition-all flex items-center gap-1">
                        {p.name}
                        <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Section Transport ── */}
          {(plan.flights?.length || plan.transport) && (
            <div id="plan-transport">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Plane className="h-3 w-3" /> Transport
              </p>
              <div className="space-y-1.5">
                {plan.flights?.map((f, i) => (
                  <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 text-xs font-medium">{f.from}</span>
                        <ChevronRight className="h-3 w-3 text-secondary/60" />
                        <span className="text-white/80 text-xs font-medium">{f.to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(f.date || f.time) && <span className="text-white/40 text-xs">{f.date}{f.time ? ` ${f.time}` : ''}</span>}
                        {f.status === 'selected' && <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">✓</span>}
                      </div>
                    </div>
                    {f.operator && <p className="text-white/35 text-xs mt-1">{f.operator}</p>}
                    {f.price && <p className="text-secondary/60 text-xs mt-0.5">{f.price}</p>}
                  </div>
                ))}
                {plan.transport?.toAirport && (
                  <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="h-3 w-3 text-secondary/60" />
                      <span className="text-white/60 text-xs font-medium">Aller aéroport</span>
                    </div>
                    <p className="text-white/80 text-xs">{TRANSPORT_MODE_LABELS[plan.transport.toAirport.mode || ''] || plan.transport.toAirport.mode || 'À définir'}</p>
                    {plan.transport.toAirport.departureTime && <p className="text-secondary/60 text-xs mt-0.5">Départ : {plan.transport.toAirport.departureTime}</p>}
                    {plan.transport.toAirport.price && <p className="text-white/40 text-xs mt-0.5">{plan.transport.toAirport.price}</p>}
                  </div>
                )}
                {plan.transport?.eatAtAirport !== undefined && (
                  <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <Utensils className="h-3 w-3 text-secondary/60" />
                    <span className="text-white/60 text-xs">Repas aéroport :</span>
                    <span className="text-white/80 text-xs">{plan.transport.eatAtAirport ? 'Oui — voir recommandations lounge' : 'Non'}</span>
                  </div>
                )}
                {plan.transport?.onSite && (
                  <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="h-3 w-3 text-secondary/60" />
                      <span className="text-white/60 text-xs font-medium">Sur place</span>
                    </div>
                    <p className="text-white/80 text-xs">{TRANSPORT_MODE_LABELS[plan.transport.onSite.mode || ''] || plan.transport.onSite.mode || 'À définir'}</p>
                    {plan.transport.onSite.note && <p className="text-white/40 text-xs mt-0.5">{plan.transport.onSite.note}</p>}
                  </div>
                )}
                {plan.transport?.return && (
                  <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Navigation className="h-3 w-3 text-secondary/60" />
                      <span className="text-white/60 text-xs font-medium">Retour</span>
                    </div>
                    <p className="text-white/80 text-xs">{TRANSPORT_MODE_LABELS[plan.transport.return.mode || ''] || plan.transport.return.mode || 'À définir'}</p>
                    {plan.transport.return.note && <p className="text-white/40 text-xs mt-0.5">{plan.transport.return.note}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Hébergements ── */}
          {plan.hotels && plan.hotels.length > 0 && (
            <div id="plan-hotels">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Hotel className="h-3 w-3" /> Hébergements
              </p>
              <div className="space-y-1.5">
                {plan.hotels.map((h, i) => (
                  <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/85 text-xs font-medium truncate">{h.name}</p>
                        {h.note && <p className="text-white/40 text-xs mt-0.5">{h.note}</p>}
                        {h.price && <p className="text-secondary/60 text-xs mt-0.5">{h.price}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {h.status === 'selected'
                          ? <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">✓ Choisi</span>
                          : <span className="text-xs bg-white/6 text-white/30 px-2 py-0.5 rounded-full whitespace-nowrap">Suggestion</span>}
                        {reservationMode === 'self' && h.bookingUrl && (
                          <a href={h.bookingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-secondary/60 hover:text-secondary"><ExternalLink className="h-3 w-3" /></a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Restaurants ── */}
          {plan.restaurants && plan.restaurants.length > 0 && (
            <div id="plan-restaurants">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Utensils className="h-3 w-3" /> Restaurants
              </p>
              <div className="space-y-1.5">
                {plan.restaurants.map((r, i) => (
                  <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white/85 text-xs font-medium truncate">{r.name}</p>
                          {r.stars && <span className="text-secondary text-xs flex-shrink-0">{'★'.repeat(Math.min(r.stars, 3))}</span>}
                        </div>
                        {r.note && <p className="text-white/40 text-xs mt-0.5">{r.note}</p>}
                        {r.price && <p className="text-secondary/60 text-xs mt-0.5">{r.price}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {r.status === 'selected'
                          ? <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">✓ Choisi</span>
                          : <span className="text-xs bg-white/6 text-white/30 px-2 py-0.5 rounded-full whitespace-nowrap">Suggestion</span>}
                        {reservationMode === 'self' && r.bookingUrl && (
                          <a href={r.bookingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-secondary/60 hover:text-secondary"><ExternalLink className="h-3 w-3" /></a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Activités ── */}
          {plan.activities && plan.activities.length > 0 && (
            <div id="plan-activities">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Activités
              </p>
              <div className="space-y-1.5">
                {plan.activities.map((a, i) => (
                  <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs truncate">{a.name}</p>
                        {(a as any).day && <p className="text-secondary/60 text-xs mt-0.5">{(a as any).day}</p>}
                        {a.price && <p className="text-secondary/60 text-xs mt-0.5">{a.price}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {a.status === 'selected'
                          ? <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">✓ Choisi</span>
                          : <span className="text-xs bg-white/6 text-white/30 px-2 py-0.5 rounded-full whitespace-nowrap">Suggestion</span>}
                        {reservationMode === 'self' && a.bookingUrl && (
                          <a href={a.bookingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-secondary/60 hover:text-secondary"><ExternalLink className="h-3 w-3" /></a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          {plan.notes && plan.notes.length > 0 && (
            <div id="plan-notes">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <StickyNote className="h-3 w-3" /> Notes
              </p>
              <div className="space-y-1.5">
                {plan.notes.map((n, i) => (
                  <div key={i} className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
                    <p className="text-white/60 text-xs">{n}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Mode de réservation ── */}
        <div className="border-t border-white/8 px-4 py-3">
          <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Mode de réservation</p>
          <div className="flex gap-1.5">
            {([
              { mode: 'self' as const, emoji: '👤', label: 'Moi-même' },
              { mode: 'assistant' as const, emoji: '💬', label: 'Assistant' },
              { mode: 'baymora' as const, emoji: '👑', label: 'Baymora' },
            ]).map(({ mode, emoji, label }) => (
              <button key={mode} onClick={() => setReservationMode(mode)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${reservationMode === mode
                  ? 'bg-secondary/20 border border-secondary/40 text-secondary'
                  : 'bg-white/4 border border-white/8 text-white/40 hover:text-white/70'}`}>
                {emoji} {label}
              </button>
            ))}
          </div>
          {reservationMode === 'assistant' && (
            <div className="mt-2 p-2.5 bg-white/4 rounded-lg">
              <p className="text-white/50 text-xs mb-1.5">Copiez le plan pour l'envoyer à notre équipe :</p>
              <button onClick={handleCopyForAssistant}
                className="w-full text-xs py-1.5 bg-secondary/15 border border-secondary/30 text-secondary rounded-lg hover:bg-secondary/25 transition-all">
                Copier le récapitulatif
              </button>
              <p className="text-white/25 text-xs mt-1 text-center">contact@baymora.com</p>
            </div>
          )}
          {reservationMode === 'baymora' && (
            <div className="mt-2 p-2.5 bg-secondary/5 border border-secondary/15 rounded-lg">
              <p className="text-secondary/80 text-xs font-medium">👑 Service conciergerie Baymora</p>
              <p className="text-white/40 text-xs mt-1">Notre équipe gère toutes vos réservations. Disponible pour les membres Elite, Privé et Fondateur.</p>
            </div>
          )}
        </div>

        {/* ── Export ── */}
        <div className="border-t border-white/8 px-4 py-3 pb-5">
          <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Exporter</p>
          {exportMsg && (
            <div className={`text-xs px-3 py-2 rounded-lg mb-2 ${exportMsg.startsWith('✓') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {exportMsg}
            </div>
          )}
          <div className="flex gap-1.5">
            <button onClick={handleEmailExport} disabled={exportLoading}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-white/4 border border-white/8 text-white/50 hover:text-secondary hover:border-secondary/30 rounded-lg transition-all disabled:opacity-50">
              <Mail className="h-3 w-3" /> Email
            </button>
            <button onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-white/4 border border-white/8 text-white/50 hover:text-secondary hover:border-secondary/30 rounded-lg transition-all">
              <Printer className="h-3 w-3" /> PDF
            </button>
            <button onClick={handleDownloadJSON}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-white/4 border border-white/8 text-white/50 hover:text-secondary hover:border-secondary/30 rounded-lg transition-all">
              <Download className="h-3 w-3" /> JSON
            </button>
          </div>
          {user && (
            <div className="space-y-1.5">
              <button
                onClick={handleSaveTrip}
                disabled={saveLoading || !!savedTripId}
                className="w-full flex items-center justify-center gap-2 text-xs py-2.5 bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 rounded-lg transition-all disabled:opacity-60 font-medium"
              >
                <Bookmark className="h-3.5 w-3.5" />
                {savedTripId ? '✓ Voyage sauvegardé (+25 Crystals)' : saveLoading ? 'Sauvegarde...' : 'Sauvegarder ce voyage'}
              </button>
              {savedTripId && (
                <Link to="/voyages" className="block text-center text-secondary/60 text-xs hover:text-secondary transition-colors">
                  Voir dans Mes Voyages →
                </Link>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Composant ─────────────────────────────────────────────────────────────────

export default function Chat() {
  const [input, setInput] = useState('');
  const [showConversion, setShowConversion] = useState(false);
  const [showSoftConversion, setShowSoftConversion] = useState(false);
  const [softModalDismissed, setSoftModalDismissed] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [guestMsgCount, setGuestMsgCount] = useState(() => getGuestMessageCount());
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [allPlaces, setAllPlaces] = useState<PlaceItem[]>([]);
  const [showPlanMobile, setShowPlanMobile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { messages, isLoading, error, conversationId, startChat, sendMessage, deleteConversation, credits, creditsExhausted, upgradeOptions, resetCreditsGate } = useChat();

  useEffect(() => { startChat('fr'); }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isLoading) inputRef.current?.focus();
  }, [messages, isLoading]);

  // Auto-show ContactPicker + accumulate trip plan + places from messages
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        if (last.content.includes(':::CONTACTS:::')) setShowContactPicker(true);
        const parsed = parseMessage(last.content);
        if (parsed.planUpdate) {
          setTripPlan(prev => mergeTripPlan(prev, parsed.planUpdate!));
        }
        if (parsed.places.length > 0) {
          setAllPlaces(prev => {
            const existing = new Set(prev.map(p => p.name));
            const newOnes = parsed.places.filter(p => !existing.has(p.name));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        }
      }
    }
  }, [messages, isLoading]);

  // Crédits : utiliser les données serveur si disponibles, sinon localStorage legacy
  const creditsRemaining = credits ? credits.remaining : (FREE_CREDITS_LIMIT - guestMsgCount);
  const isCreditsExhausted = creditsExhausted || (!authLoading && !isAuthenticated && creditsRemaining <= 0);

  const SOFT_HINT_AT = 6;
  const SOFT_MODAL_AT = 7;

  const canSend = () => {
    if (authLoading) return false;
    // Bloqué par le serveur (HTTP 402)
    if (creditsExhausted) return false;
    // Legacy guest limit (avant que le serveur ne réponde)
    if (!isAuthenticated && !credits) {
      const newCount = incrementGuestMessageCount();
      setGuestMsgCount(newCount);
      if (newCount >= SOFT_MODAL_AT && newCount < FREE_CREDITS_LIMIT && !softModalDismissed) {
        setShowSoftConversion(true);
        return false;
      }
    }
    return true;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!canSend()) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleChip = async (msg: string) => {
    if (isLoading) return;
    if (!canSend()) return;
    await sendMessage(msg);
  };

  const handleContactConfirm = async (selected: { name: string }[], newContact?: { name: string }) => {
    setShowContactPicker(false);
    const all = [...selected];
    if (newContact) all.push(newContact);
    if (all.length === 0) return;

    const names = all.map(c => c.name);
    let msg: string;
    if (names.length === 1) {
      msg = `Je pars avec ${names[0]}`;
    } else {
      const last = names.pop();
      msg = `Je pars avec ${names.join(', ')} et ${last}`;
    }
    if (!canSend()) return;
    await sendMessage(msg);
  };

  const handleClear = async () => {
    if (!conversationId) return;
    await deleteConversation(conversationId);
    setTripPlan(null);
    setAllPlaces([]);
    await startChat('fr');
  };

  const circleBadge = user
    ? ({ decouverte: '○', voyageur: '✦', explorateur: '✦✦', prive: '✦✦✦', fondateur: '✦✦✦✦' } as Record<string, string>)[user.circle]
    : null;

  const hasPlan = tripPlan && (tripPlan.destination || tripPlan.hotels?.length || tripPlan.flights?.length || tripPlan.activities?.length || tripPlan.restaurants?.length);

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">

      {/* Porte dorée — quand les crédits sont épuisés */}
      {isCreditsExhausted && (
        <CreditGate
          isAuthenticated={isAuthenticated}
          currentCircle={user?.circle || 'decouverte'}
          credits={credits}
          upgradeOptions={upgradeOptions}
          conversationId={conversationId || undefined}
          onClose={() => resetCreditsGate()}
          onSignup={() => { resetCreditsGate(); setShowConversion(true); }}
        />
      )}

      {/* Conversion classique (inscription) — soft modal au message 7 */}
      {showConversion && !isCreditsExhausted && (
        <ConversionModal
          onClose={() => setShowConversion(false)}
          onSuccess={() => setShowConversion(false)}
          conversationId={conversationId || undefined}
        />
      )}

      {showSoftConversion && !isAuthenticated && !isCreditsExhausted && (
        <ConversionModal
          onClose={() => { setShowSoftConversion(false); setSoftModalDismissed(true); }}
          onSuccess={() => { setShowSoftConversion(false); setShowConversion(false); }}
          conversationId={conversationId || undefined}
        />
      )}

      {/* Mobile plan overlay */}
      {showPlanMobile && hasPlan && (
        <div className="fixed inset-0 z-40 bg-slate-950 lg:hidden">
          <div className="h-full">
            <TripPlanPanel plan={tripPlan!} allPlaces={allPlaces} onClose={() => setShowPlanMobile(false)} />
          </div>
        </div>
      )}

      {/* ── Left: Chat ── */}
      <div className={`flex flex-col flex-1 min-w-0 ${hasPlan ? 'lg:max-w-[60%]' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white px-2"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center text-white font-bold text-sm">B</div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">Baymora</p>
              <p className="text-white/40 text-xs mt-0.5">Conciergerie de voyage</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <Link to="/dashboard">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 hover:bg-white/10 transition-colors">
                <span className="text-secondary text-xs">{circleBadge}</span>
                <span className="text-white/70 text-xs font-medium">{user.prenom || user.pseudo}</span>
                {user.mode === 'fantome' && <span className="text-white/30 text-xs">👻</span>}
              </div>
            </Link>
          ) : (
            <Link to="/auth?returnTo=/chat">
              <button className="flex items-center gap-1.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs font-medium px-3 py-1.5 rounded-full hover:bg-secondary/25 transition-all">
                <User className="h-3 w-3" />Créer mon profil
              </button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading} className="text-white/40 hover:text-white/80">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bannière crédits restants */}
      {credits && credits.remaining > 0 && credits.remaining <= 5 && (
        <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
          <p className="text-amber-400/80 text-xs">
            {credits.remaining === 1
              ? 'Dernier crédit disponible'
              : `${credits.remaining} crédits restants`
            }
            {credits.cost ? ` · Dernier échange : ${credits.cost} crédit${credits.cost > 1 ? 's' : ''}` : ''}
          </p>
          {!isAuthenticated ? (
            <button onClick={() => setShowConversion(true)} className="text-secondary text-xs font-medium hover:underline">Créer un compte →</button>
          ) : (
            <button onClick={() => resetCreditsGate()} className="text-secondary text-xs font-medium hover:underline">Recharger →</button>
          )}
        </div>
      )}
      {!isAuthenticated && !credits && guestMsgCount > 0 && guestMsgCount < FREE_CREDITS_LIMIT && (
        <div className="flex-shrink-0 bg-secondary/10 border-b border-secondary/20 px-4 py-2 flex items-center justify-between">
          <p className="text-secondary/80 text-xs">{creditsRemaining <= 1 ? 'Plus qu\'un échange gratuit' : `${creditsRemaining} échanges gratuits restants`}</p>
          <button onClick={() => setShowConversion(true)} className="text-secondary text-xs font-medium hover:underline">Créer un compte →</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6">

        {/* ── Welcome screen ── */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-full gap-6 animate-fade-in py-4">

            {/* Logo + tagline */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-secondary">B</span>
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 40%, #c8bfa8 70%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 8px rgba(255,245,220,0.4))'}}>
                {user?.prenom ? `Bonjour ${user.prenom}` : 'Bonjour'}
              </h2>
              {/* La phrase iconique */}
              <p className="text-sm font-medium tracking-wide" style={{background: 'linear-gradient(135deg, #c8a94a 0%, #f5d87a 35%, #e4c057 65%, #f5d87a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 10px rgba(212,168,80,0.5))'}}>
                L'expérience de votre vie commence ici.
              </p>
              <p className="text-white/40 text-xs mt-2 max-w-xs mx-auto">
                Dites-nous n'importe quoi — même si ce n'est pas clair. Baymora s'occupe du reste.
              </p>
            </div>

            {/* Chips d'inspiration */}
            <div className="w-full max-w-lg">
              <p className="text-xs uppercase tracking-widest mb-2 text-center" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 45%, #c8bfa8 75%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 6px rgba(255,245,220,0.35))'}}>Quelle envie ?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {INSPIRATION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChip(chip.msg)}
                    disabled={isLoading || isCreditsExhausted}
                    className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/65 text-xs hover:bg-secondary/15 hover:border-secondary/40 hover:text-white transition-all disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chips destination */}
            <div className="w-full max-w-lg">
              <p className="text-xs uppercase tracking-widest mb-2 text-center" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 45%, #c8bfa8 75%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 6px rgba(255,245,220,0.35))'}}>Quelle destination ?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {DESTINATION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChip(chip.msg)}
                    disabled={isLoading || isCreditsExhausted}
                    className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/65 text-xs hover:bg-secondary/15 hover:border-secondary/40 hover:text-white transition-all disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidentialité */}
            <div className="w-full max-w-lg bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-center">
              <p className="text-white/50 text-xs leading-relaxed">
                🔒 <span className="font-medium" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 40%, #d0c8b8 70%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 6px rgba(255,245,220,0.4))'}}>Vos données restent privées.</span><br />
                Baymora mémorise vos préférences, vos proches et leurs habitudes pour personnaliser chaque conseil — anniversaires, régimes alimentaires, dress codes...<br />
                <span className="text-white/35">Rien n'est partagé. Tout s'efface si vous ne créez pas de compte.</span>
              </p>
            </div>
            <p className="text-white/25 text-xs text-center -mt-2">
              Ou écrivez directement — week-end, soirée, gastro, US, chill...
              {!isAuthenticated && <><br /><span className="text-secondary/50">{FREE_CREDITS_LIMIT} échanges gratuits · Créez un compte pour continuer</span></>}
            </p>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1;
            const parsed = msg.role === 'assistant' ? parseMessage(msg.content) : null;

            return (
              <div key={msg.id || i}>
                <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0 text-secondary font-bold text-xs mt-1">B</div>
                  )}
                  <div className={`max-w-sm md:max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-slate-800/60 border border-white/10 text-white/90 rounded-bl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold text-secondary mb-2 mt-3 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-white/90 mb-1 mt-2">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-none space-y-1 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="text-white/85">{children}</li>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-white/70 italic">{children}</em>,
                          hr: () => <hr className="border-white/10 my-3" />,
                          table: ({ children }) => <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse">{children}</table></div>,
                          thead: ({ children }) => <thead className="border-b border-white/20">{children}</thead>,
                          th: ({ children }) => <th className="text-left py-1.5 px-2 text-white/60 font-medium">{children}</th>,
                          td: ({ children }) => <td className="py-1.5 px-2 border-b border-white/5 text-white/80">{children}</td>,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-secondary underline underline-offset-2 hover:text-secondary/80">{children}</a>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-secondary/50 pl-3 my-2 text-white/60 italic">{children}</blockquote>,
                          code: ({ children }) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-secondary">{children}</code>,
                        }}
                      >
                        {parsed?.text ?? msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>

                {/* Cartes Google Calendar (tous les messages assistant) */}
                {msg.role === 'assistant' && parsed && parsed.calendarEvents.length > 0 && (
                  <div className="ml-11 space-y-1.5 mt-1">
                    {parsed.calendarEvents.map((ev, ei) => (
                      <CalendarCard key={ei} event={ev} />
                    ))}
                  </div>
                )}

                {/* Carousel de lieux style Staycation */}
                {msg.role === 'assistant' && parsed && parsed.places.length > 0 && (
                  <div className="ml-11 mt-2">
                    <PlacesCarousel places={parsed.places} />
                  </div>
                )}

                {/* Carte géographique */}
                {msg.role === 'assistant' && parsed && parsed.mapView && (
                  <div className="ml-11 mt-2">
                    <MapEmbed mapView={parsed.mapView} />
                  </div>
                )}

                {/* Parcours complet */}
                {msg.role === 'assistant' && parsed && parsed.journey && (
                  <div className="ml-11 mt-2">
                    <JourneyView journey={parsed.journey} />
                  </div>
                )}

                {/* Quick-reply chips après le dernier message assistant */}
                {msg.role === 'assistant' && isLast && parsed && parsed.quickReplies.length > 0 && !isLoading && !showContactPicker && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-11">
                    {parsed.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleChip(reply)}
                        disabled={isCreditsExhausted}
                        className="px-3 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/25 hover:border-secondary/60 transition-all disabled:opacity-40"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* ContactPicker après le dernier message assistant */}
                {msg.role === 'assistant' && isLast && showContactPicker && !isLoading && (
                  <ContactPicker
                    onConfirm={handleContactConfirm}
                    onDismiss={() => setShowContactPicker(false)}
                  />
                )}

                {/* Soft hint pill après le 6e message user (invités seulement) */}
                {!isAuthenticated && msg.role === 'user' &&
                  messages.filter(m => m.role === 'user').indexOf(msg) === SOFT_HINT_AT - 1 && (
                  <div className="flex justify-center my-3 animate-fade-in">
                    <button
                      onClick={() => setShowSoftConversion(true)}
                      className="flex items-center gap-2 bg-secondary/8 border border-secondary/20 text-secondary/70 text-xs px-4 py-2 rounded-full hover:bg-secondary/18 hover:text-secondary transition-all"
                    >
                      ✦ Créez votre profil pour que je mémorise tout ça →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex gap-3 justify-start mt-4 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 text-secondary animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/60 border border-white/10">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-center text-red-400/80 text-xs py-2 mt-4">{error}</div>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            placeholder={isCreditsExhausted ? 'Créez un compte pour continuer...' : 'Week-end, fête, plage, gastro, surprise... dites-nous tout'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            onClick={() => isCreditsExhausted && setShowConversion(true)}
            autoFocus
            className="flex-1 h-10 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60 focus:ring-1 focus:ring-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {hasPlan && (
            <Button
              onClick={() => setShowPlanMobile(true)}
              size="sm"
              variant="ghost"
              className="lg:hidden text-secondary border border-secondary/30 px-3"
              title="Voir le plan"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={isCreditsExhausted ? () => setShowConversion(true) : handleSend}
            disabled={isLoading || (!isCreditsExhausted && !input.trim())}
            size="sm"
            className="bg-secondary hover:bg-secondary/90 text-white px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-white/20 text-xs mt-2">Baymora — Votre conciergerie de voyage privée</p>
      </div>

      </div>{/* end left chat column */}

      {/* ── Right: Trip Plan Panel (desktop only) ── */}
      {hasPlan && (
        <div className="hidden lg:flex w-96 xl:w-[420px] flex-shrink-0 border-l border-white/10 flex-col">
          <TripPlanPanel plan={tripPlan!} allPlaces={allPlaces} />
        </div>
      )}

    </div>
  );
}
