import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  MapPin, Sparkles, Calendar, Clock, Lock,
  Utensils, Heart, Dumbbell, Briefcase, Home, Users, Plane, Star, Flame, RefreshCw
} from "lucide-react";
import { RUNWAY_IMAGES, NIGHTLIFE_VIDEOS } from "../lib/runwayAssets";

// ─── Types ───────────────────────────────────────────────────────────────────
interface EventCard {
  id: number;
  title: string;
  description?: string;
  category: string;
  venue_name?: string;
  date: string;
  time_start?: string;
  price?: string;
  booking_url?: string;
  is_vip: boolean;
  is_members_only: boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  soiree: "Soirée", concert: "Concert", expo: "Expo", degustation: "Dégustation",
  spectacle: "Spectacle", festival: "Festival", sport: "Sport",
  diner_secret: "Dîner secret", vip: "VIP", afterwork: "After-work",
  brunch: "Brunch", marche: "Marché", autre: "Événement",
};

const FILTER_TABS = [
  { id: "all", label: "Tout" },
  { id: "ce-soir", label: "Ce soir" },
  { id: "weekend", label: "Ce week-end" },
  { id: "semaine", label: "Cette semaine" },
  { id: "soiree", label: "Soirées" },
  { id: "expo", label: "Culture" },
  { id: "concert", label: "Concerts" },
  { id: "degustation", label: "Gastronomie" },
  { id: "sport", label: "Sport" },
];

const SPOTS = [
  { name: "Le Mama Rooftop", tag: "🔥 Tendance", badge: "DJ ce samedi", note: 4.8, dist: "1.2 km" },
  { name: "Bar à Vin de Bordeaux", tag: "🔑 Secret", badge: "Réservé membres", note: 4.9, dist: "0.8 km" },
  { name: "I.Boat", tag: "🎵 DJ ce samedi", badge: "Soirée électro", note: 4.7, dist: "2.1 km" },
  { name: "Galerie des Chartrons", tag: "🔥 Tendance", badge: "Vernissage jeudi", note: 4.6, dist: "1.5 km" },
  { name: "Le Symbiose", tag: "🔑 Secret", badge: "After-work VIP", note: 4.8, dist: "0.9 km" },
];

const SERVICES = [
  { icon: Utensils, label: "Manger", context: "Je cherche un restaurant pour ce soir", color: "#E8A87C", img: RUNWAY_IMAGES.catManger },
  { icon: Heart, label: "Bien-être", context: "Je veux réserver un spa ou massage", color: "#C8A96E", img: RUNWAY_IMAGES.catRessourcer },
  { icon: Dumbbell, label: "Bouger", context: "Je cherche une activité sportive ou outdoor", color: "#7CB9E8", img: RUNWAY_IMAGES.catBouger },
  { icon: Briefcase, label: "Travailler", context: "Je cherche un espace de coworking ou café pour travailler", color: "#8B8D94", img: RUNWAY_IMAGES.catTravailler },
  { icon: Home, label: "À domicile", context: "Je veux commander un service à domicile", color: "#C8A96E", img: RUNWAY_IMAGES.catDomicile },
  { icon: Users, label: "Rencontrer", context: "Je cherche des événements networking ou rencontres", color: "#A87CB9", img: RUNWAY_IMAGES.catRencontrer },
  { icon: Plane, label: "S'évader", context: "Je veux planifier un week-end ou voyage", color: "#7CE8C8", img: RUNWAY_IMAGES.catEvader },
  { icon: Sparkles, label: "Sortir", context: "Qu'est-ce qu'il se passe ce soir près de moi ?", color: "#C8A96E", img: RUNWAY_IMAGES.catSortir },
];

// ─── EventCardComponent ───────────────────────────────────────────────────────
function EventCardComponent({ event, isMember }: { event: EventCard; isMember: boolean }) {
  const isLocked = !!event.is_members_only && !isMember;
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    : "";

  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden"
      style={{
        width: 230,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(200,169,110,0.12)",
        opacity: isLocked ? 0.65 : 1,
      }}
    >
      {/* Vidéo nightlife ou gradient */}
      <div
        className="w-full flex items-center justify-center relative overflow-hidden"
        style={{ height: 120 }}
      >
        <video
          src={NIGHTLIFE_VIDEOS[event.id % NIGHTLIFE_VIDEOS.length]}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.7 }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.8), transparent)" }} />
        <Calendar size={28} style={{ color: "#C8A96E", opacity: 0.3, position: "relative", zIndex: 1 }} />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,169,110,0.2)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.3)" }}>
            {catLabel}
          </span>
          {!!event.is_vip && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,169,110,0.9)", color: "#070B14" }}>
              🔑 VIP
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: "#F0EDE6" }}>
          {isLocked ? <><Lock size={11} className="inline mr-1" />Réservé aux membres</> : event.title}
        </h3>
        {event.venue_name && (
          <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "#8B8D94" }}>
            <MapPin size={10} /> {event.venue_name}
          </p>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs flex items-center gap-1" style={{ color: "#8B8D94" }}>
            <Clock size={10} /> {dateStr}{event.time_start ? ` · ${event.time_start}` : ""}
          </span>
        </div>
        {event.price && <p className="text-xs font-medium mb-2" style={{ color: "#C8A96E" }}>{event.price}</p>}
        {!isLocked ? (
          <button
            className="w-full py-2 rounded-xl text-xs font-semibold"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            onClick={() => event.booking_url ? window.open(event.booking_url, "_blank") : null}
          >
            {event.booking_url ? "Réserver" : "J'y vais"}
          </button>
        ) : (
          <Link href="/premium">
            <button className="w-full py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.3)" }}>
              Devenir membre
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MaPosition() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isMember = !!user;
  const [activeFilter, setActiveFilter] = useState("all");
  const [userCity, setUserCity] = useState("Bordeaux");
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [manualInput, setManualInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Géolocalisation
  const detectLocation = () => {
    if (!navigator.geolocation) { setUserCity("Paris"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`
          );
          const data = await res.json();
          const detected = data.address?.city || data.address?.town || data.address?.village || "Bordeaux";
          setUserCity(detected);
          setGeoStatus("done");
        } catch { setGeoStatus("error"); }
      },
      () => setGeoStatus("error"),
      { timeout: 8000 }
    );
  };

  useEffect(() => { detectLocation(); }, []);

  // Requêtes tRPC
  const eventsQuery = trpc.events.list.useQuery({ city: userCity, limit: 20 }, { staleTime: 300000 });
  const tonightQuery = trpc.events.tonight.useQuery({ city: userCity }, { staleTime: 300000 });
  const weekendQuery = trpc.events.thisWeekend.useQuery({ city: userCity }, { staleTime: 300000 });
  const weekQuery = trpc.events.thisWeek.useQuery({ city: userCity, limit: 20 }, { staleTime: 300000 });

  const getFilteredEvents = (): EventCard[] => {
    const all = (eventsQuery.data || []) as EventCard[];
    switch (activeFilter) {
      case "ce-soir": return (tonightQuery.data || []) as EventCard[];
      case "weekend": return (weekendQuery.data || []) as EventCard[];
      case "semaine": return (weekQuery.data || []) as EventCard[];
      case "all": return all;
      default: return all.filter(e => e.category === activeFilter);
    }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh", paddingBottom: 100 }}>

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: "rgba(7,11,20,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200,169,110,0.1)" }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: "#C8A96E" }} />
            {manualInput ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && inputValue.trim()) { setUserCity(inputValue.trim()); setManualInput(false); setInputValue(""); } }}
                  placeholder="Entrez une ville..." className="text-sm bg-transparent border-b outline-none"
                  style={{ color: "#F0EDE6", borderColor: "#C8A96E", width: 140 }}
                />
                <button onClick={() => { if (inputValue.trim()) { setUserCity(inputValue.trim()); setManualInput(false); setInputValue(""); } }} className="text-xs px-2 py-1 rounded" style={{ background: "#C8A96E", color: "#070B14" }}>OK</button>
              </div>
            ) : (
              <span className="text-base font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                📍 {geoStatus === "loading" ? "Localisation…" : userCity} — Aujourd'hui
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={detectLocation} className="p-1.5 rounded-full" style={{ background: "rgba(200,169,110,0.1)" }}>
              <RefreshCw size={12} style={{ color: "#C8A96E" }} />
            </button>
            <button onClick={() => setManualInput(!manualInput)} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: "rgba(200,169,110,0.3)", color: "#C8A96E" }}>
              {manualInput ? "Annuler" : "Changer"}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 1 — CE QUI SE PASSE (section hero, 50% écran)
      ══════════════════════════════════════════════════════════════ */}
      <section className="mb-8 mt-4">
        <div className="px-4 mb-3 flex items-center gap-2">
          <Flame size={16} style={{ color: "#E8A87C" }} />
          <h2 className="text-base font-bold" style={{ color: "#F0EDE6" }}>Ce qui se passe</h2>
        </div>

        {/* Onglets filtre */}
        <div className="px-4 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id} onClick={() => setActiveFilter(tab.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
                style={{
                  background: activeFilter === tab.id ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(255,255,255,0.06)",
                  color: activeFilter === tab.id ? "#070B14" : "#8B8D94",
                  border: activeFilter === tab.id ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards événements */}
        <div className="px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {eventsQuery.isLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 rounded-2xl animate-pulse" style={{ width: 230, height: 260, background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}>
              <Calendar size={32} style={{ color: "#C8A96E", opacity: 0.4, margin: "0 auto 12px" }} />
              <p className="text-sm" style={{ color: "#8B8D94" }}>Aucun événement pour ce filtre</p>
              <p className="text-xs mt-1" style={{ color: "#8B8D94", opacity: 0.6 }}>Essayez "Tout" ou changez de ville</p>
            </div>
          ) : (
            <div className="flex gap-4" style={{ width: "max-content" }}>
              {filteredEvents.map(event => (
                <EventCardComponent key={event.id} event={event} isMember={isMember} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 2 — LES SPOTS DE LA MAISON
      ══════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <div className="px-4 mb-3 flex items-center gap-2">
          <Star size={16} style={{ color: "#C8A96E" }} />
          <h2 className="text-base font-bold" style={{ color: "#F0EDE6" }}>Les spots de la Maison</h2>
        </div>
        <div className="px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {SPOTS.map((spot, i) => (
              <div key={i} className="flex-shrink-0 rounded-2xl p-4" style={{ width: 195, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,169,110,0.1)" }}>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2" style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E" }}>
                  {spot.tag}
                </span>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "#F0EDE6" }}>{spot.name}</h3>
                <p className="text-xs mb-2" style={{ color: "#8B8D94" }}>{spot.badge}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={10} style={{ color: "#C8A96E" }} />
                    <span className="text-xs" style={{ color: "#C8A96E" }}>{spot.note}</span>
                  </div>
                  <span className="text-xs" style={{ color: "#8B8D94" }}>{spot.dist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 3 — TOUS LES SERVICES (grille 4×2 mobile)
      ══════════════════════════════════════════════════════════════ */}
      <section className="px-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} style={{ color: "#C8A96E" }} />
          <h2 className="text-base font-bold" style={{ color: "#F0EDE6" }}>Tous les services</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {SERVICES.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(`/maya?q=${encodeURIComponent(svc.context)}`)}
                className="flex flex-col items-center justify-center rounded-2xl overflow-hidden cursor-pointer active:scale-95 relative"
                style={{ minHeight: 80, border: "1px solid rgba(200,169,110,0.15)" }}
              >
                <img src={svc.img} alt={svc.label} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
                <div className="absolute inset-0" style={{ background: "rgba(7,11,20,0.55)" }} />
                <Icon size={18} style={{ color: svc.color, marginBottom: 4, position: "relative", zIndex: 1 }} />
                <span className="text-xs text-center font-semibold" style={{ color: "#F0EDE6", position: "relative", zIndex: 1 }}>{svc.label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#4A4D56" }}>
          Ma position fonctionne partout dans le monde. À Barcelone ? Les résultats s'adaptent.
        </p>
        <div className="text-center mt-8 pb-2">
          <p className="text-xs mb-2" style={{ color: "#4A4D56" }}>Vous organisez un événement ?</p>
          <Link href="/partenaires/evenement" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: "#C8A96E" }}>
            Soumettre à la Maison →
          </Link>
        </div>
      </section>
    </div>
  );
}
