/**
 * Composants visuels du chat : CalendarCard, PlaceCard, PlacesCarousel, MapEmbed, JourneyView
 * Extrait de Chat.tsx pour modularité.
 */

import { MapPin, Navigation, Star, ExternalLink, Phone, User, Headphones, Crown, Bookmark } from 'lucide-react';
import type { CalendarEvent, PlaceItem, MapView, Journey, BookingOption } from './types';
import { buildGoogleCalendarUrl } from './types';

// ─── Carte Google Calendar ────────────────────────────────────────────────────

export function CalendarCard({ event }: { event: CalendarEvent }) {
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

// ─── Carte lieu ──────────────────────────────────────────────────────────────

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

export function PlaceCard({ place }: { place: PlaceItem }) {
  const config = PLACE_TYPE_CONFIG[place.type] || PLACE_TYPE_CONFIG.other;
  const priceStr = place.priceLevel ? '€'.repeat(place.priceLevel) : null;
  const bookingHref = place.baymoraPartner && place.affiliateCode
    ? `/api/partners/track/${place.affiliateCode}${place.bookingUrl ? `?redirect=${encodeURIComponent(place.bookingUrl)}` : ''}`
    : place.bookingUrl
    ? `/go?url=${encodeURIComponent(place.bookingUrl)}&ref=baymora`
    : place.mapsUrl;

  return (
    <div className={`flex-shrink-0 w-52 rounded-2xl overflow-hidden border transition-all group ${place.baymoraPartner ? 'border-secondary/40 bg-slate-900 hover:border-secondary/70' : 'border-white/10 bg-slate-900 hover:border-white/20'}`}>
      <div className={`relative h-28 bg-gradient-to-br ${config.gradient} flex items-center justify-center overflow-hidden`}>
        <span className="text-5xl opacity-50 group-hover:scale-110 transition-transform duration-500">{config.emoji}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <div className="absolute top-2 left-2 bg-black/55 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 rounded-full font-medium">
          {config.badge}
        </div>
        {place.baymoraPartner && (
          <div className="absolute top-2 right-2 bg-secondary/90 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
            🤝 Baymora
          </div>
        )}
        {place.rating && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 text-secondary fill-secondary" /> {place.rating}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-white font-semibold text-xs truncate">{place.name}</p>
        <p className="text-white/40 text-[10px] mt-0.5 flex items-center gap-1">
          <MapPin className="h-2.5 w-2.5" /> {place.city}{priceStr ? ` · ${priceStr}` : ''}
        </p>
        {place.description && <p className="text-white/30 text-[10px] mt-1 line-clamp-2">{place.description}</p>}
        {(place.baymoraPrice || place.priceFrom) && (
          <p className="text-secondary text-xs font-semibold mt-1.5">
            {place.baymoraPrice || `à partir de ${place.priceFrom}${place.currency || '€'}${place.priceUnit ? `/${place.priceUnit}` : ''}`}
          </p>
        )}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {place.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-white/5 text-white/40 text-[9px] px-1.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        {bookingHref && (
          <a
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg transition-all ${
              place.baymoraPartner
                ? 'bg-secondary/15 text-secondary border border-secondary/25 hover:bg-secondary/25'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            {place.baymoraPartner ? '🤝 Réserver (membre)' : 'Voir'} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
        <button
          onClick={() => {
            const token = localStorage.getItem('baymora_token');
            if (!token) { alert('Connectez-vous pour sauvegarder'); return; }
            // Sauvegarder dans la collection par défaut
            fetch('/api/collections', { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
              .then(r => r.json())
              .then(async (data) => {
                let collId = data.collections?.[0]?.id;
                if (!collId) {
                  const createRes = await fetch('/api/collections', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Mes favoris', emoji: '❤️' }) });
                  if (createRes.ok) { const c = await createRes.json(); collId = c.id; }
                }
                if (collId) {
                  await fetch(`/api/collections/${collId}/items`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: place.type, name: place.name, city: place.city, description: place.description, rating: place.rating, bookingUrl: place.bookingUrl, priceRange: place.priceFrom ? `${place.priceFrom}${place.currency || '€'}` : undefined }) });
                }
              })
              .catch(() => {});
          }}
          className="mt-1 w-full flex items-center justify-center gap-1 text-[10px] text-white/30 hover:text-secondary py-1 transition-colors"
          title="Sauvegarder"
        >
          <Bookmark className="h-2.5 w-2.5" /> Sauvegarder
        </button>
      </div>
    </div>
  );
}

export function PlacesCarousel({ places }: { places: PlaceItem[] }) {
  if (!places.length) return null;
  return (
    <div className="mt-2 overflow-hidden">
      <div className="flex gap-3 overflow-x-auto pb-2 pr-4" style={{ scrollbarWidth: 'none' }}>
        {places.map((place, i) => <PlaceCard key={i} place={place} />)}
      </div>
    </div>
  );
}

// ─── Carte géographique avec pins numérotés ─────────────────────────────────

export function MapEmbed({ mapView, places }: { mapView: MapView; places?: PlaceItem[] }) {
  const zoom = mapView.zoom || 13;

  // Construire l'URL avec markers numérotés si on a des lieux
  let src: string;
  if (places && places.length > 0) {
    // Utiliser l'API Static Maps avec markers (plus beau, pins numérotés)
    const markers = places.map((p, i) => {
      const label = String.fromCharCode(65 + i); // A, B, C, D...
      const location = p.address ? `${p.address}, ${p.city}` : `${p.name}, ${p.city}`;
      return `markers=color:0xc8a94a%7Clabel:${label}%7C${encodeURIComponent(location)}`;
    }).join('&');
    src = `https://maps.googleapis.com/maps/api/staticmap?size=600x300&scale=2&maptype=roadmap&style=feature:all|element:geometry|color:0x1a1a2e&style=feature:all|element:labels.text.fill|color:0xcccccc&style=feature:water|color:0x0d1b2a&style=feature:road|color:0x2a2a4e&${markers}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
  } else {
    // Fallback : iframe embed classique
    const query = encodeURIComponent(mapView.query);
    src = `https://maps.google.com/maps?q=${query}&z=${zoom}&output=embed&hl=fr`;
  }

  const hasPlaces = places && places.length > 0;

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 relative">
      {hasPlaces ? (
        // Static map avec pins (image, plus sexy)
        <div className="relative">
          <img
            src={src}
            alt={`Carte ${mapView.query}`}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
        </div>
      ) : (
        // Iframe embed (fallback)
        <iframe
          src={src}
          width="100%"
          height="176"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.1)' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Carte ${mapView.query}`}
          className="w-full"
        />
      )}

      {/* Légende avec pins numérotés */}
      {hasPlaces && (
        <div className="bg-slate-900/95 px-3 py-2 space-y-1.5">
          {places!.map((p, i) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <div key={i} className="flex items-center gap-2 group">
                <span className="w-5 h-5 rounded-full bg-secondary text-slate-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{letter}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-white text-xs font-medium truncate block">{p.name}</span>
                </div>
                <span className="text-white/30 text-[10px] flex-shrink-0">{p.type}</span>
                {p.rating && <span className="text-secondary text-[10px] flex-shrink-0">⭐{p.rating}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Badge localisation */}
      <div className={`absolute ${hasPlaces ? 'top-2' : 'bottom-2'} right-2 bg-black/60 backdrop-blur-sm text-white/70 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1`}>
        <MapPin className="h-2.5 w-2.5 text-secondary" /> {mapView.query}
      </div>
    </div>
  );
}

// ─── Parcours complet ────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, string> = {
  car: '🚗', train: '🚄', plane: '✈️', taxi: '🚕',
  metro: '🚇', uber: '🚙', boat: '⛵', walk: '🚶', helicopter: '🚁',
};

export function JourneyView({ journey }: { journey: Journey }) {
  return (
    <div className="mt-2 bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
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
      <div className="p-4 space-y-0">
        {journey.steps.map((step, i) => (
          <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {i < journey.steps.length - 1 && (
              <div className="absolute left-4 top-8 w-px bg-white/10" style={{ height: 'calc(100% - 1rem)' }} />
            )}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-white/12 flex items-center justify-center text-sm z-10">
              {STEP_ICONS[step.type] || '📍'}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/85 text-xs font-medium leading-tight">{step.from} → {step.to}</p>
                  {step.operator && <p className="text-white/40 text-xs mt-0.5">{step.operator}</p>}
                  {step.note && <p className="text-amber-400/70 text-xs mt-0.5">{step.note}</p>}
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
      <div className="px-4 py-2 bg-white/3 border-t border-white/6 flex items-center gap-2 text-xs text-white/35">
        <span className="truncate">🏠 {journey.from}</span>
        <span className="flex-shrink-0 text-secondary">→→→</span>
        <span className="truncate text-right">📍 {journey.to}</span>
      </div>
    </div>
  );
}

// ─── Carte réservation ──────────────────────────────────────────────────────

const BOOKING_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  self: { label: 'Je réserve', icon: User, color: 'bg-white/10 text-white/70 hover:bg-white/20' },
  assistant: { label: 'Mon assistant', icon: ExternalLink, color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' },
  concierge: { label: 'Conciergerie', icon: Headphones, color: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' },
  baymora: { label: 'Baymora réserve', icon: Crown, color: 'bg-secondary/15 text-secondary hover:bg-secondary/25' },
};

export function BookingCard({ booking }: { booking: BookingOption }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/80 text-xs font-semibold">📋 Réserver : {booking.name}</p>
        {booking.phone && (
          <a href={`tel:${booking.phone}`} className="text-white/30 hover:text-white/60 flex items-center gap-1 text-[10px]">
            <Phone className="h-3 w-3" /> {booking.phone}
          </a>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {booking.options.map(opt => {
          const cfg = BOOKING_LABELS[opt];
          if (!cfg) return null;
          const Icon = cfg.icon;
          if (opt === 'self' && booking.bookingUrl) {
            return (
              <a key={opt} href={booking.bookingUrl} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cfg.color}`}>
                <Icon className="h-3 w-3" /> {cfg.label}
              </a>
            );
          }
          return (
            <button key={opt} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cfg.color}`}>
              <Icon className="h-3 w-3" /> {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vue Map par Jour (GPS interactif) ──────────────────────────────────────

import { useState } from 'react';

interface DayStop {
  name: string;
  type?: string;
  address?: string;
  time?: string;
  description?: string;
  rating?: number;
  bookingUrl?: string;
  transport?: string;
  duration?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  stops: DayStop[];
}

export function DayMapView({ days, city }: { days: DayPlan[]; city: string }) {
  const [activeDay, setActiveDay] = useState(0);
  const [selectedStop, setSelectedStop] = useState<number | null>(null);

  if (!days || days.length === 0) return null;
  const currentDay = days[activeDay];
  if (!currentDay) return null;

  const markers = currentDay.stops.map((stop, i) => {
    const label = String.fromCharCode(65 + i);
    const location = stop.address ? `${stop.address}, ${city}` : `${stop.name}, ${city}`;
    return `markers=color:0xc8a94a%7Clabel:${label}%7C${encodeURIComponent(location)}`;
  }).join('&');

  const mapSrc = `https://maps.googleapis.com/maps/api/staticmap?size=600x250&scale=2&maptype=roadmap&style=feature:all|element:geometry|color:0x1a1a2e&style=feature:all|element:labels.text.fill|color:0xcccccc&style=feature:water|color:0x0d1b2a&style=feature:road|color:0x2a2a4e&${markers}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;

  const selected = selectedStop !== null ? currentDay.stops[selectedStop] : null;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-slate-900">
      {/* Tabs jours */}
      <div className="flex overflow-x-auto border-b border-white/10 bg-slate-950/50" style={{ scrollbarWidth: 'none' }}>
        {days.map((day, i) => (
          <button key={i} onClick={() => { setActiveDay(i); setSelectedStop(null); }}
            className={`px-4 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${i === activeDay ? 'text-secondary border-b-2 border-secondary bg-secondary/5' : 'text-white/40 hover:text-white/70'}`}>
            Jour {day.day} · {day.title}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative">
        <img src={mapSrc} alt={`Jour ${currentDay.day}`} className="w-full h-48 object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-secondary text-xs font-bold px-3 py-1 rounded-full">
          Jour {currentDay.day} · {currentDay.stops.length} étapes
        </div>
      </div>

      {/* Timeline du jour */}
      <div className="px-3 py-2 space-y-0.5">
        {currentDay.stops.map((stop, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selectedStop === i;
          return (
            <div key={i}>
              <button onClick={() => setSelectedStop(isSelected ? null : i)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${isSelected ? 'bg-secondary/10 border border-secondary/30' : 'hover:bg-white/5'}`}>
                <span className="w-6 h-6 rounded-full bg-secondary text-slate-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{letter}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-medium truncate">{stop.name}</span>
                    {stop.time && <span className="text-white/30 text-[10px] flex-shrink-0">{stop.time}</span>}
                  </div>
                  {stop.type && <span className="text-white/30 text-[10px]">{stop.type}</span>}
                </div>
                {stop.rating && <span className="text-secondary text-[10px] flex-shrink-0">⭐{stop.rating}</span>}
              </button>
              {isSelected && selected && (
                <div className="ml-8 mt-1 mb-2 bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                  {selected.description && <p className="text-white/60 text-xs leading-relaxed">{selected.description}</p>}
                  {selected.address && <p className="text-white/30 text-[10px] flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {selected.address}</p>}
                  {selected.bookingUrl && (
                    <a href={selected.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-secondary text-xs hover:text-secondary/80">
                      <ExternalLink className="h-3 w-3" /> Réserver
                    </a>
                  )}
                </div>
              )}
              {i < currentDay.stops.length - 1 && stop.transport && (
                <div className="ml-8 flex items-center gap-1.5 text-white/20 text-[10px] py-0.5">
                  <div className="w-px h-3 bg-white/10" />
                  <Navigation className="h-2.5 w-2.5 rotate-90" /> {stop.transport}{stop.duration ? ` · ${stop.duration}` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
