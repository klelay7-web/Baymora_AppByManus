/**
 * Composants visuels du chat : CalendarCard, PlaceCard, PlacesCarousel, MapEmbed, JourneyView
 * Extrait de Chat.tsx pour modularité.
 */

import { MapPin, Navigation, Star, ExternalLink, Phone, User, Headphones, Crown } from 'lucide-react';
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

// ─── Carte géographique embedded ──────────────────────────────────────────────

export function MapEmbed({ mapView }: { mapView: MapView }) {
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
