import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send, Sparkles, Loader2, Plus, ArrowLeft, MapPin, Star, Share2,
  Bookmark, Calendar, Navigation, ExternalLink, X, Phone, Globe,
  ChevronRight, Users, Cpu, Map as MapIcon, Route, Clock, Euro,
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import { useRoute } from "wouter";
import { InteractiveMap, type MapEstablishment, type MapDay } from "@/components/InteractiveMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────
interface Place {
  name: string;
  type: string;
  city: string;
  country?: string;
  address?: string;
  rating?: number;
  priceRange?: string;
  description: string;
  bookingUrl?: string;
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
}

interface BookingOption {
  name: string;
  address?: string;
  phone?: string;
  bookingUrl?: string;
  options: string[];
  notes?: string;
}

interface GCalEvent {
  title: string;
  date: string;
  time?: string;
  duration?: number;
  location?: string;
  notes?: string;
}

interface JourneyData {
  from: string;
  to: string;
  duration?: string;
  steps?: Array<{ mode: string; from: string; to: string; duration?: string; departure?: string; arrival?: string; cost?: string; notes?: string }>;
}

interface PlanData {
  destination: string;
  dates?: string;
  travelers?: number;
  style?: string;
  budget?: string;
  hotels?: Array<{ name: string; checkIn?: string; checkOut?: string }>;
  restaurants?: Array<{ name: string; date?: string; time?: string }>;
  activities?: Array<{ name: string; date?: string; time?: string }>;
}

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
  cleanMessage?: string;
  places?: Place[];
  booking?: BookingOption[];
  gcal?: GCalEvent[];
  journey?: JourneyData;
  quickReplies?: string[];
  plan?: PlanData;
  model?: string;
  createdAt?: Date;
  // Legacy
  parsed?: any;
}

// ─── Place Card (style Staycation) ────────────────────────────────
function PlaceCard({ place, onSelect, selected }: { place: Place; onSelect: (p: Place) => void; selected: boolean }) {
  const typeEmoji: Record<string, string> = {
    restaurant: "🍽️", hotel: "🏨", bar: "🍸", spa: "💆", activity: "🎭",
    transport: "✈️", beach: "🏖️", museum: "🏛️", shop: "🛍️", club: "🎵",
  };

  const stars = place.rating ? Math.round(place.rating) : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(place)}
      className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
        selected
          ? "border-[#c8a94a] shadow-lg shadow-[#c8a94a]/10"
          : "border-white/10 hover:border-[#c8a94a]/40"
      }`}
    >
      {/* Image placeholder avec gradient */}
      <div className="relative h-28 bg-gradient-to-br from-[#1a2035] to-[#0c1120] overflow-hidden">
        {place.imageUrl ? (
          <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-30">{typeEmoji[place.type] || "📍"}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/90 via-transparent to-transparent" />
        {/* Price badge */}
        {place.priceRange && (
          <div className="absolute top-2 right-2 bg-[#c8a94a]/90 text-[#080c14] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {place.priceRange}
          </div>
        )}
        {/* Type badge */}
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 rounded-full">
          {typeEmoji[place.type] || "📍"} {place.type}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 bg-white/3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight">{place.name}</h4>
          {place.rating && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Star size={10} className="text-[#c8a94a] fill-[#c8a94a]" />
              <span className="text-[10px] text-[#c8a94a] font-medium">{place.rating}</span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          📍 {place.city}{place.country ? `, ${place.country}` : ""}
        </p>
        <p className="text-[11px] text-muted-foreground/80 mt-1.5 line-clamp-2">{place.description}</p>
      </div>
    </motion.button>
  );
}

// ─── Booking Options (4 options) ─────────────────────────────────
function BookingCard({ booking }: { booking: BookingOption }) {
  const optionConfig: Record<string, { label: string; icon: string; color: string; desc: string }> = {
    self: { label: "Réserver moi-même", icon: "👤", color: "border-white/20 hover:border-white/40", desc: "Accès direct au site" },
    assistant: { label: "Mon assistant", icon: "🤖", color: "border-blue-500/30 hover:border-blue-500/50", desc: "Votre assistant prend le relais" },
    concierge: { label: "Ma conciergerie", icon: "🏛️", color: "border-purple-500/30 hover:border-purple-500/50", desc: "Votre conciergerie habituelle" },
    baymora: { label: "Conciergerie Baymora", icon: "✨", color: "border-[#c8a94a]/40 hover:border-[#c8a94a]/70", desc: "Notre équipe s'en charge" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 overflow-hidden"
    >
      <div className="p-3 bg-white/3 border-b border-white/5">
        <p className="text-xs font-semibold">{booking.name}</p>
        {booking.address && <p className="text-[10px] text-muted-foreground mt-0.5">📍 {booking.address}</p>}
        {booking.notes && <p className="text-[10px] text-[#c8a94a]/80 mt-1 italic">💡 {booking.notes}</p>}
      </div>
      <div className="grid grid-cols-2 gap-1 p-2 bg-white/2">
        {(booking.options || ["self", "assistant", "concierge", "baymora"]).map((opt) => {
          const config = optionConfig[opt] || optionConfig.self;
          return (
            <button
              key={opt}
              onClick={() => {
                if (opt === "self" && booking.bookingUrl) window.open(booking.bookingUrl, "_blank");
                if (opt === "self" && booking.phone) window.open(`tel:${booking.phone}`, "_blank");
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${config.color} bg-white/3 hover:bg-white/5`}
            >
              <span className="text-lg">{config.icon}</span>
              <p className="text-[10px] font-medium leading-tight">{config.label}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{config.desc}</p>
            </button>
          );
        })}
      </div>
      {booking.phone && (
        <div className="px-3 pb-2 flex items-center gap-2">
          <Phone size={10} className="text-muted-foreground" />
          <a href={`tel:${booking.phone}`} className="text-[10px] text-muted-foreground hover:text-[#c8a94a]">{booking.phone}</a>
        </div>
      )}
    </motion.div>
  );
}

// ─── GCal Button ─────────────────────────────────────────────────
function GCalButton({ event }: { event: GCalEvent }) {
  const addToCalendar = () => {
    const start = event.date.replace(/-/g, "") + (event.time ? `T${event.time.replace(":", "")}00` : "");
    const end = event.duration
      ? new Date(new Date(`${event.date}T${event.time || "00:00"}:00`).getTime() + event.duration * 60000)
          .toISOString().replace(/[-:]/g, "").split(".")[0]
      : start;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&location=${encodeURIComponent(event.location || "")}&details=${encodeURIComponent(event.notes || "")}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={addToCalendar}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 hover:border-[#c8a94a]/40 bg-white/3 hover:bg-white/5 transition-all text-left w-full"
    >
      <Calendar size={14} className="text-[#c8a94a] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{event.title}</p>
        <p className="text-[10px] text-muted-foreground">{event.date}{event.time ? ` à ${event.time}` : ""}</p>
      </div>
      <span className="text-[10px] text-[#c8a94a] shrink-0">+ Calendrier</span>
    </button>
  );
}

// ─── Journey Card ─────────────────────────────────────────────────
function JourneyCard({ journey }: { journey: JourneyData }) {
  const modeEmoji: Record<string, string> = {
    TGV: "🚄", Train: "🚆", Avion: "✈️", Voiture: "🚗", Taxi: "🚕",
    Uber: "🚗", Métro: "🚇", Bus: "🚌", Bateau: "⛴️", Vélo: "🚲",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 overflow-hidden"
    >
      <div className="p-3 bg-white/3 border-b border-white/5 flex items-center gap-2">
        <Route size={14} className="text-[#c8a94a]" />
        <div>
          <p className="text-xs font-semibold">{journey.from} → {journey.to}</p>
          {journey.duration && <p className="text-[10px] text-muted-foreground">⏱ {journey.duration}</p>}
        </div>
      </div>
      {journey.steps && (
        <div className="p-2 space-y-1">
          {journey.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/2">
              <span className="text-base">{modeEmoji[step.mode] || "🚗"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium">{step.from} → {step.to}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {step.departure && <span className="text-[9px] text-muted-foreground">{step.departure}</span>}
                  {step.duration && <span className="text-[9px] text-muted-foreground">• {step.duration}</span>}
                  {step.cost && <span className="text-[9px] text-[#c8a94a]">{step.cost}</span>}
                </div>
                {step.notes && <p className="text-[9px] text-muted-foreground/70 mt-0.5 italic">{step.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Quick Replies (QR) visuels ───────────────────────────────────
function QuickReplies({ replies, onSelect }: { replies: string[]; onSelect: (r: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mt-3"
    >
      {replies.map((reply) => {
        const isSurprise = reply.toLowerCase().includes("surprends");
        const isOther = reply.includes("Autre") || reply.includes("autre");
        return (
          <button
            key={reply}
            onClick={() => onSelect(reply)}
            className={`text-xs px-4 py-2.5 rounded-full border transition-all font-medium ${
              isSurprise
                ? "border-[#c8a94a] bg-[#c8a94a]/10 text-[#c8a94a] hover:bg-[#c8a94a]/20"
                : isOther
                ? "border-white/20 text-white/50 hover:bg-white/5 hover:text-white"
                : "border-white/15 text-white/80 hover:bg-white/8 hover:border-white/30"
            }`}
          >
            {reply}
          </button>
        );
      })}
    </motion.div>
  );
}

// ─── Plan Panel ───────────────────────────────────────────────────
function PlanPanel({ plan }: { plan: PlanData }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <MapPin size={16} className="text-[#c8a94a]" />
        <div>
          <h3 className="font-serif text-sm font-bold">{plan.destination}</h3>
          {plan.dates && <p className="text-[10px] text-muted-foreground">{plan.dates}</p>}
        </div>
        <div className="ml-auto flex gap-2">
          {plan.travelers && (
            <Badge variant="outline" className="border-white/20 text-white/60 text-[9px]">
              <Users size={9} className="mr-1" />{plan.travelers}
            </Badge>
          )}
          {plan.style && (
            <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] text-[9px]">{plan.style}</Badge>
          )}
        </div>
      </div>

      {plan.hotels && plan.hotels.length > 0 && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">🏨 Hébergement</p>
          {plan.hotels.map((h, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/3 mb-1">
              <span className="text-sm">🏨</span>
              <div>
                <p className="text-xs font-medium">{h.name}</p>
                {(h.checkIn || h.checkOut) && (
                  <p className="text-[10px] text-muted-foreground">{h.checkIn} → {h.checkOut}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.restaurants && plan.restaurants.length > 0 && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">🍽️ Restaurants</p>
          {plan.restaurants.map((r, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/3 mb-1">
              <span className="text-sm">🍽️</span>
              <div>
                <p className="text-xs font-medium">{r.name}</p>
                {(r.date || r.time) && (
                  <p className="text-[10px] text-muted-foreground">{r.date}{r.time ? ` à ${r.time}` : ""}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.activities && plan.activities.length > 0 && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">🎭 Activités</p>
          {plan.activities.map((a, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/3 mb-1">
              <span className="text-sm">🎭</span>
              <div>
                <p className="text-xs font-medium">{a.name}</p>
                {(a.date || a.time) && (
                  <p className="text-[10px] text-muted-foreground">{a.date}{a.time ? ` à ${a.time}` : ""}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-2">
        <Button className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs">
          <Bookmark className="mr-2 h-3 w-3" /> Enregistrer ce plan
        </Button>
        <Button variant="outline" className="w-full border-white/20 text-white rounded-none text-xs">
          <Calendar className="mr-2 h-3 w-3" /> Sync Google Calendrier
        </Button>
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────
function RightPanel({
  selectedPlace,
  allPlaces,
  currentPlan,
  onClose,
  onPlaceClick,
}: {
  selectedPlace: Place | null;
  allPlaces: Place[];
  currentPlan: PlanData | null;
  onClose: () => void;
  onPlaceClick?: (p: Place) => void;
}) {
  const [activeTab, setActiveTab] = useState(currentPlan ? "plan" : "carte");

  const mapEstablishments: MapEstablishment[] = useMemo(() =>
    allPlaces.map(p => ({
      name: p.name, type: p.type, city: p.city, country: p.country,
      description: p.description, priceRange: p.priceRange,
      rating: p.rating, imageUrl: p.imageUrl, coordinates: p.coordinates,
    })),
    [allPlaces]
  );

  const selectedMapEst: MapEstablishment | null = selectedPlace ? {
    name: selectedPlace.name, type: selectedPlace.type, city: selectedPlace.city,
    country: selectedPlace.country, description: selectedPlace.description,
    priceRange: selectedPlace.priceRange, rating: selectedPlace.rating,
    imageUrl: selectedPlace.imageUrl, coordinates: selectedPlace.coordinates,
  } : null;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="font-serif text-sm font-semibold">
          {selectedPlace ? selectedPlace.name : currentPlan ? currentPlan.destination : "Votre espace voyage"}
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-white p-1">
          <X size={16} />
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 bg-white/5 shrink-0">
          <TabsTrigger value="carte" className="text-xs">🗺️ Carte</TabsTrigger>
          {currentPlan && <TabsTrigger value="plan" className="text-xs">📋 Plan</TabsTrigger>}
          {selectedPlace && <TabsTrigger value="fiche" className="text-xs">📍 Fiche</TabsTrigger>}
          <TabsTrigger value="partage" className="text-xs">📤 Partager</TabsTrigger>
        </TabsList>

        {/* Carte */}
        <TabsContent value="carte" className="flex-1 m-0 p-0 min-h-0">
          <InteractiveMap
            establishments={mapEstablishments}
            selectedEstablishment={selectedMapEst}
            onEstablishmentClick={(est) => onPlaceClick?.(est as unknown as Place)}
            showTransportOptions={true}
            className="w-full h-full min-h-[300px]"
          />
        </TabsContent>

        {/* Plan */}
        {currentPlan && (
          <TabsContent value="plan" className="flex-1 m-0 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <PlanPanel plan={currentPlan} />
            </ScrollArea>
          </TabsContent>
        )}

        {/* Fiche établissement */}
        {selectedPlace && (
          <TabsContent value="fiche" className="flex-1 m-0 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Hero image */}
                <div className="relative h-48 bg-gradient-to-br from-[#1a2035] to-[#0c1120]">
                  {selectedPlace.imageUrl ? (
                    <img src={selectedPlace.imageUrl} alt={selectedPlace.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin size={48} className="text-[#c8a94a]/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-serif text-lg font-bold">{selectedPlace.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedPlace.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-[#c8a94a] fill-[#c8a94a]" />
                          <span className="text-xs text-[#c8a94a]">{selectedPlace.rating}</span>
                        </div>
                      )}
                      {selectedPlace.priceRange && (
                        <span className="text-xs text-white/60">{selectedPlace.priceRange}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    📍 {selectedPlace.city}{selectedPlace.country ? `, ${selectedPlace.country}` : ""}
                    {selectedPlace.address ? ` — ${selectedPlace.address}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground/90">{selectedPlace.description}</p>

                  <div className="space-y-2 pt-2">
                    {selectedPlace.bookingUrl && (
                      <Button
                        className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs"
                        onClick={() => window.open(selectedPlace.bookingUrl, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" /> Réserver en ligne
                      </Button>
                    )}
                    <Button variant="outline" className="w-full border-white/20 text-white rounded-none text-xs">
                      <Star className="mr-2 h-3 w-3" /> Ajouter aux favoris
                    </Button>
                    <Button variant="outline" className="w-full border-white/20 text-white rounded-none text-xs">
                      <Navigation className="mr-2 h-3 w-3" /> Ajouter au parcours
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Partage */}
        <TabsContent value="partage" className="flex-1 m-0 overflow-hidden min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {[
                { icon: "👤", title: "Envoyer à un proche", desc: "Par email ou lien direct" },
                { icon: "🤖", title: "Envoyer à mon assistant", desc: "Votre assistant personnel prend le relais" },
                { icon: "🏛️", title: "Ma conciergerie préférée", desc: "Indiquez le contact, on négocie pour vous" },
                { icon: "🌍", title: "Conciergerie partenaire Baymora", desc: "Internationale ou locale selon votre destination" },
              ].map((opt) => (
                <button
                  key={opt.title}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 hover:bg-white/5 transition-all text-left"
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{opt.title}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────
function MessageBubble({
  msg,
  isLast,
  onPlaceSelect,
  onQuickReply,
}: {
  msg: ClaudeMessage;
  isLast: boolean;
  onPlaceSelect: (p: Place) => void;
  onQuickReply: (r: string) => void;
}) {
  const isUser = msg.role === "user";

  // Parse legacy format
  const places = msg.places || msg.parsed?.establishments || [];
  const quickReplies = msg.quickReplies || msg.parsed?.quickReplies || [];
  const booking = msg.booking || [];
  const gcal = msg.gcal || [];
  const journey = msg.journey || null;
  const displayMessage = msg.cleanMessage || msg.parsed?.message || msg.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[90%] md:max-w-[80%] space-y-2`}>
        {/* Bubble principale */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-[#c8a94a] text-[#080c14] rounded-br-sm"
              : "bg-white/5 border border-white/10 rounded-bl-sm"
          }`}
        >
          <div className={`text-sm leading-relaxed ${isUser ? "" : "prose prose-invert prose-sm max-w-none"}`}>
            {isUser ? (
              displayMessage
            ) : (
              <Streamdown>{displayMessage}</Streamdown>
            )}
          </div>
          {/* Indicateur modèle IA */}
          {!isUser && msg.model && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
              <Cpu size={9} className="text-muted-foreground/40" />
              <span className="text-[9px] text-muted-foreground/40">
                {msg.model.includes("opus") ? "Claude Opus" : "Claude Sonnet"}
              </span>
            </div>
          )}
        </div>

        {/* Cartes PLACES */}
        {!isUser && places.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {places.map((place: Place, i: number) => (
              <PlaceCard
                key={i}
                place={place}
                selected={false}
                onSelect={onPlaceSelect}
              />
            ))}
          </div>
        )}

        {/* Parcours JOURNEY */}
        {!isUser && journey && <JourneyCard journey={journey} />}

        {/* Options BOOKING */}
        {!isUser && booking.length > 0 && (
          <div className="space-y-2">
            {booking.map((b: BookingOption, i: number) => (
              <BookingCard key={i} booking={b} />
            ))}
          </div>
        )}

        {/* Événements GCAL */}
        {!isUser && gcal.length > 0 && (
          <div className="space-y-1">
            {gcal.map((event: GCalEvent, i: number) => (
              <GCalButton key={i} event={event} />
            ))}
          </div>
        )}

        {/* Quick Replies QR — seulement sur le dernier message */}
        {!isUser && isLast && quickReplies.length > 0 && (
          <QuickReplies replies={quickReplies} onSelect={onQuickReply} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────
export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [, params] = useRoute("/chat/:id");
  const conversationId = params?.id ? parseInt(params.id) : null;

  const [input, setInput] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(conversationId);
  const [localMessages, setLocalMessages] = useState<ClaudeMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Collect all places from conversation
  const allPlaces = useMemo(() => {
    const places: Place[] = [];
    localMessages.forEach(msg => {
      const msgPlaces = msg.places || msg.parsed?.establishments || [];
      msgPlaces.forEach((p: Place) => {
        if (!places.find(ex => ex.name === p.name)) places.push(p);
      });
    });
    return places;
  }, [localMessages]);

  // Latest plan
  const latestPlan = useMemo(() => {
    for (let i = localMessages.length - 1; i >= 0; i--) {
      if (localMessages[i].plan) return localMessages[i].plan!;
    }
    return null;
  }, [localMessages]);

  const { data: conversations, refetch: refetchConversations } = trpc.chat.getConversations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: serverMessages } = trpc.chat.getMessages.useQuery(
    { conversationId: activeConversation! },
    { enabled: !!activeConversation && isAuthenticated }
  );

  const createConversation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      setActiveConversation(data.id);
      refetchConversations();
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data: any) => {
      const newMsg: ClaudeMessage = {
        role: "assistant",
        content: data.rawContent || data.message || "",
        cleanMessage: data.cleanMessage || data.message || "",
        places: data.places || data.establishments || [],
        booking: data.booking || [],
        gcal: data.gcal || [],
        journey: data.journey || null,
        quickReplies: data.quickReplies || data.parsed?.quickReplies || [],
        plan: data.plan || null,
        model: data.model,
        createdAt: new Date(),
      };
      setLocalMessages(prev => [...prev, newMsg]);
      setIsTyping(false);
      // Auto-ouvrir le panneau droit si places ou plan
      if ((newMsg.places && newMsg.places.length > 0) || newMsg.plan) {
        setShowRightPanel(true);
      }
    },
    onError: (error) => {
      setLocalMessages(prev => [...prev, {
        role: "assistant",
        content: error.message,
        cleanMessage: error.message,
        quickReplies: ["🔄 Réessayer", "✏️ Autre demande"],
        createdAt: new Date(),
      }]);
      setIsTyping(false);
    },
  });

  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages.map(m => {
        // Tenter de parser les tags structurés des messages stockés
        const hasClaudeTags = m.content.includes(":::PLACES:::") || m.content.includes(":::QR:::");
        if (hasClaudeTags && m.role === "assistant") {
          // Parser inline (import dynamique non nécessaire, logique dupliquée légère)
          const qrMatch = m.content.match(/:::QR:::([\s\S]*?):::END:::/);
          const qr = qrMatch ? qrMatch[1].split("|").map((s: string) => s.trim()).filter(Boolean) : [];
          const cleanMessage = m.content
            .replace(/:::PLACES:::[\s\S]*?:::END:::/g, "")
            .replace(/:::MAP:::[\s\S]*?:::END:::/g, "")
            .replace(/:::JOURNEY:::[\s\S]*?:::END:::/g, "")
            .replace(/:::GCAL:::[\s\S]*?:::END:::/g, "")
            .replace(/:::BOOKING:::[\s\S]*?:::END:::/g, "")
            .replace(/:::QR:::[\s\S]*?:::END:::/g, "")
            .replace(/:::PLAN:::[\s\S]*?:::END:::/g, "")
            .trim();
          return {
            role: m.role as "user" | "assistant",
            content: m.content,
            cleanMessage,
            quickReplies: qr,
            createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
          };
        }
        // Legacy JSON format
        try {
          const parsed = JSON.parse(m.content);
          if (parsed.message && parsed.quickReplies) {
            return {
              role: m.role as "user" | "assistant",
              content: m.content,
              cleanMessage: parsed.message,
              places: parsed.establishments || [],
              quickReplies: parsed.quickReplies || [],
              parsed,
              createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
            };
          }
        } catch {}
        return {
          role: m.role as "user" | "assistant",
          content: m.content,
          cleanMessage: m.content,
          createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
        };
      }));
    }
  }, [serverMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;
    setInput("");

    // Limite messages gratuits
    if (!isAuthenticated) {
      const freeCount = localMessages.filter(m => m.role === "user").length;
      if (freeCount >= 3) {
        setLocalMessages(prev => [
          ...prev,
          { role: "user", content: messageText },
          {
            role: "assistant",
            content: "Vous avez utilisé vos **3 messages gratuits**.",
            cleanMessage: "Vous avez utilisé vos **3 messages gratuits**. Pour continuer avec Claude Opus, créez votre compte.",
            quickReplies: ["💎 Voir les forfaits", "🔑 Se connecter"],
          },
        ]);
        return;
      }
    }

    let convId = activeConversation;
    if (!convId && isAuthenticated) {
      const result = await createConversation.mutateAsync({ title: messageText.substring(0, 50) });
      convId = result.id;
    }

    setLocalMessages(prev => [...prev, { role: "user", content: messageText, cleanMessage: messageText, createdAt: new Date() }]);
    setIsTyping(true);

    if (convId && isAuthenticated) {
      sendMessage.mutate({ conversationId: convId, content: messageText });
    } else {
      // Demo mode
      setTimeout(() => {
        setLocalMessages(prev => [...prev, {
          role: "assistant",
          content: "Créez votre compte pour accéder à Claude Opus.",
          cleanMessage: "✨ Pour profiter de votre concierge IA personnel propulsé par **Claude Opus**, créez votre compte gratuit.",
          quickReplies: ["💎 Créer mon compte", "🔍 Explorer les destinations", "✏️ Autre"],
        }]);
        setIsTyping(false);
      }, 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply.includes("Voir les forfaits") || reply.includes("Créer mon compte")) {
      window.location.href = isAuthenticated ? "/pricing" : getLoginUrl();
      return;
    }
    if (reply.includes("Se connecter")) {
      window.location.href = getLoginUrl();
      return;
    }
    if (reply.includes("Explorer les destinations")) {
      window.location.href = "/discover";
      return;
    }
    handleSend(reply);
  };

  return (
    <div className="flex h-screen pt-16">
      {/* ─── Left Panel: Conversation ─── */}
      <div className={`flex flex-col ${showRightPanel ? "w-1/2 border-r border-white/10" : "w-full"} transition-all duration-300`}>
        {/* Header */}
        <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-background/80 backdrop-blur-sm shrink-0">
          <Link href="/">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-[#c8a94a] transition-colors" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#c8a94a]/10 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-[#c8a94a]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold font-serif">Concierge Baymora</h1>
            <p className="text-[10px] text-muted-foreground truncate">
              {isTyping ? "Claude réfléchit..." : "Claude Opus · En ligne"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {allPlaces.length > 0 && (
              <Button
                variant="ghost" size="icon"
                className="text-muted-foreground hover:text-[#c8a94a]"
                onClick={() => setShowRightPanel(!showRightPanel)}
              >
                <MapPin size={18} />
              </Button>
            )}
            {isAuthenticated && (
              <Button
                variant="ghost" size="icon"
                className="text-muted-foreground hover:text-[#c8a94a]"
                onClick={() => {
                  setActiveConversation(null);
                  setLocalMessages([]);
                  setShowRightPanel(false);
                  setSelectedPlace(null);
                }}
              >
                <Plus size={18} />
              </Button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
          {localMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-[#c8a94a]/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={28} className="text-[#c8a94a]" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">
                Bienvenue chez <span className="text-[#c8a94a]">Maison Baymora</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-1">
                Propulsé par <strong className="text-white/80">Claude Opus</strong> — le meilleur modèle IA au monde.
              </p>
              <p className="text-[#c8a94a]/80 text-sm font-medium mb-8">
                Que souhaitez-vous vivre ? ✨
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {[
                  "🌍 Planifier un voyage",
                  "🍽️ Restaurant d'exception",
                  "🎭 Organiser un événement",
                  "💼 Voyage d'affaires",
                  "🎁 Offrir une expérience",
                  "✨ Surprends-moi",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQuickReply(suggestion)}
                    className={`text-xs px-4 py-2.5 rounded-full border transition-all font-medium ${
                      suggestion.includes("Surprends")
                        ? "border-[#c8a94a] bg-[#c8a94a]/10 text-[#c8a94a] hover:bg-[#c8a94a]/20"
                        : "border-white/15 text-white/80 hover:bg-white/8 hover:border-white/30"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {localMessages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isLast={i === localMessages.length - 1}
                onPlaceSelect={(p) => {
                  setSelectedPlace(p);
                  setShowRightPanel(true);
                }}
                onQuickReply={handleQuickReply}
              />
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#c8a94a]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-[#c8a94a]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-[#c8a94a]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Claude Opus réfléchit...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-3 pb-[env(safe-area-inset-bottom,12px)] bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre envie..."
                rows={1}
                className="w-full resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8a94a]/50 focus:border-[#c8a94a]/30 placeholder:text-muted-foreground/50"
                style={{ maxHeight: "120px" }}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] h-11 w-11 rounded-xl shrink-0"
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
          {!isAuthenticated && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              {Math.max(0, 3 - localMessages.filter(m => m.role === "user").length)} message(s) gratuit(s) —{" "}
              <a href={getLoginUrl()} className="text-[#c8a94a] hover:underline">Connectez-vous</a> pour Claude Opus illimité
            </p>
          )}
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block overflow-hidden"
          >
            <RightPanel
              selectedPlace={selectedPlace}
              allPlaces={allPlaces}
              currentPlan={latestPlan}
              onClose={() => setShowRightPanel(false)}
              onPlaceClick={(p) => {
                setSelectedPlace(p);
                setShowRightPanel(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
