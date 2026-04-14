import { useState, useCallback } from "react";
import { MapView } from "@/components/Map";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Heart, MapPin, Star, ExternalLink, Calendar, ChevronRight, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Place {
  name: string;
  id?: string;
  type?: string;
  city?: string;
  country?: string;
  description?: string;
  priceRange?: string;
  rating?: number;
  imageUrl?: string;
  bookingUrl?: string;
  coordinates?: { lat: number; lng: number };
}

interface BookingData {
  name: string;
  address?: string;
  phone?: string;
  bookingUrl?: string;
  email?: string;
}

interface ScenarioDay {
  day: number;
  morning?: string;
  afternoon?: string;
  evening?: string;
}

interface Scenario {
  name: string;
  budget?: string;
  days?: ScenarioDay[];
  description?: string;
}

interface JourneyStep {
  mode: string;
  from: string;
  to: string;
  duration?: string;
  departure?: string;
  arrival?: string;
  cost?: string;
  bookingUrl?: string;
  notes?: string;
}

interface JourneyData {
  from?: string;
  to?: string;
  duration?: string;
  totalDuration?: string;
  steps?: JourneyStep[];
}

interface GCalData {
  title?: string;
  start?: string;
  end?: string;
  location?: string;
  description?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRANSPORT_EMOJI: Record<string, string> = {
  train: "🚄", avion: "✈️", vol: "✈️", uber: "🚕", taxi: "🚕",
  voiture: "🚗", marche: "🚶", metro: "🚇", bus: "🚌", bateau: "⛵",
  ferry: "⛴️", velo: "🚲", vtc: "🚙", chauffeur: "🚙", jet: "✈️",
  helicoptere: "🚁", default: "🚗",
};

const getAffiliatePartner = (mode: string): string => {
  const m = mode.toLowerCase();
  if (m.includes('train') || m.includes('tgv') || m.includes('eurostar')) return 'trainline';
  if (m.includes('avion') || m.includes('vol') || m.includes('jet')) return 'skyscanner';
  if (m.includes('voiture') || m.includes('location') || m.includes('sixt')) return 'sixt';
  if (m.includes('hotel') || m.includes('nuit') || m.includes('chambre')) return 'booking';
  if (m.includes('experience') || m.includes('activite') || m.includes('visite')) return 'getyourguide';
  return 'booking';
};

const getTransportEmoji = (mode: string) => {
  const key = mode.toLowerCase();
  for (const [k, v] of Object.entries(TRANSPORT_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return TRANSPORT_EMOJI.default;
};

const PLACE_TYPE_EMOJI: Record<string, string> = {
  hotel: "🏨", restaurant: "🍽️", bar: "🍸", spa: "💆", activity: "🎯",
  activite: "🎯", musee: "🏛️", plage: "🏖️", club: "🎵", shop: "🛍️",
};

const getPlaceEmoji = (type?: string) => {
  if (!type) return "📍";
  const key = type.toLowerCase();
  for (const [k, v] of Object.entries(PLACE_TYPE_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return "📍";
};

const UNSPLASH_FALLBACK: Record<string, string> = {
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  bar: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&q=80",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80",
  activity: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80",
};

const getPlaceImage = (place: Place) => {
  if (place.imageUrl) return place.imageUrl;
  const type = (place.type || "hotel").toLowerCase();
  for (const [k, v] of Object.entries(UNSPLASH_FALLBACK)) {
    if (type.includes(k)) return v;
  }
  return UNSPLASH_FALLBACK.hotel;
};

// ─── Parse tags ───────────────────────────────────────────────────────────────
// Regex principale : avec :::END:::
const TAG_RE = /:::(\w+):::([\ s\S]*?):::END:::/g;
// Regex fallback tolérant : tag sans :::END::: (message tronqué ou long)
const TAG_RE_FALLBACK = /:::(\w+):::([\ s\S]+?)(?=:::\w+:::|$)/g;
interface ParsedSegment {
  type: "text" | "QR" | "PLACES" | "MAP" | "BOOKING" | "SCENARIOS" | "GCAL" | "JOURNEY";
  content: string;
  data?: unknown;
}

function parseMessage(rawInput: string): ParsedSegment[] {
  // Strip <question_block> XML blocks — they're rendered separately by the
  // QuestionBlockGroup component using data from the tRPC response, not from
  // the raw text.
  const raw = rawInput.replace(/<question_block[\s\S]*?<\/question_block>/g, "");
  const segments: ParsedSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Passe 1 : tags avec :::END:::
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const text = raw.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: "text", content: text });
    }
    const tag = match[1].toUpperCase() as ParsedSegment["type"];
    const body = match[2].trim();
    try {
      const data = JSON.parse(body);
      segments.push({ type: tag, content: body, data });
    } catch {
      segments.push({ type: tag, content: body, data: body });
    }
    lastIndex = match.index + match[0].length;
  }

  // Passe 2 : fallback tolérant pour les tags sans :::END::: (message tronqué)
  if (lastIndex < raw.length) {
    const remaining = raw.slice(lastIndex);
    // Vérifier si le reste contient des tags non fermés
    if (remaining.includes(':::') && !remaining.includes(':::END:::')) {
      TAG_RE_FALLBACK.lastIndex = 0;
      let fbLastIndex = 0;
      let fbMatch: RegExpExecArray | null;
      while ((fbMatch = TAG_RE_FALLBACK.exec(remaining)) !== null) {
        if (fbMatch.index > fbLastIndex) {
          const text = remaining.slice(fbLastIndex, fbMatch.index).trim();
          if (text) segments.push({ type: "text", content: text });
        }
        const tag = fbMatch[1].toUpperCase() as ParsedSegment["type"];
        const body = fbMatch[2].trim();
        try {
          const data = JSON.parse(body);
          segments.push({ type: tag, content: body, data });
        } catch {
          // JSON incomplet : ne pas afficher le tag brut
        }
        fbLastIndex = fbMatch.index + fbMatch[0].length;
      }
      if (fbLastIndex < remaining.length) {
        const text = remaining.slice(fbLastIndex).trim();
        if (text && !text.startsWith(':::')) segments.push({ type: "text", content: text });
      }
    } else {
      const text = remaining.trim();
      if (text) segments.push({ type: "text", content: text });
    }
  }

  return segments;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QRRenderer({ data, onSend }: { data: unknown; onSend: (text: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [used, setUsed] = useState(false);

  const rawStr = typeof data === "string" ? data : JSON.stringify(data);
  const pills = rawStr.split("|").map((s) => s.trim()).filter(Boolean);
  const isMulti = rawStr.includes("(plusieurs choix possibles)");

  if (used) return null;

  const handleSimpleClick = (pill: string) => {
    if (pill === "💬 Autre chose") {
      document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
      setUsed(true);
      return;
    }
    if (pill === "🤷 Je ne sais pas") {
      onSend("Je ne sais pas, suggere-moi");
      setUsed(true);
      return;
    }
    if (pill === "✨ Surprends-moi") {
      onSend("Surprends-moi");
      setUsed(true);
      return;
    }
    onSend(pill);
    setUsed(true);
  };

  const handleToggle = (pill: string) => {
    setSelected((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill]
    );
  };

  const handleValidate = () => {
    const msg = `J'ai choisi : ${selected.join(", ")}${note ? `. Note : ${note}` : ""}`;
    onSend(msg);
    setUsed(true);
  };

  const EXIT_PILLS = ["💬 Autre chose", "🤷 Je ne sais pas", "✨ Surprends-moi"];
  const mainPills = pills.filter((p) => !EXIT_PILLS.includes(p));
  const exitPills = pills.filter((p) => EXIT_PILLS.includes(p));

  return (
    <div className="mt-3 space-y-2">
      {/* Pills principales */}
      <div className="flex flex-wrap gap-2">
        {mainPills.map((pill, i) => {
          const isOn = selected.includes(pill);
          return (
            <button
              key={i}
              onClick={() => isMulti ? handleToggle(pill) : handleSimpleClick(pill)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: isOn ? "rgba(200,169,110,0.25)" : "rgba(200,169,110,0.08)",
                border: `1px solid ${isOn ? "rgba(200,169,110,0.6)" : "rgba(200,169,110,0.25)"}`,
                color: isOn ? "#E8D5A8" : "#C8A96E",
              }}
            >
              {isOn && <Check size={10} className="inline mr-1" />}
              {pill}
            </button>
          );
        })}
      </div>

      {/* Multi-select : note + valider */}
      {isMulti && selected.length > 0 && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ajouter une note (optionnel)..."
            rows={2}
            className="w-full text-xs rounded-xl px-3 py-2 resize-none outline-none"
            style={{
              background: "#0D1117",
              border: "1px solid rgba(200,169,110,0.2)",
              color: "#F0EDE6",
            }}
          />
          <button
            onClick={handleValidate}
            className="px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            Valider ({selected.length} choix)
          </button>
        </div>
      )}

      {/* Portes de sortie */}
      {exitPills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {exitPills.map((pill, i) => (
            <button
              key={i}
              onClick={() => handleSimpleClick(pill)}
              className="px-3 py-1 rounded-full text-[11px]"
              style={{
                background: "transparent",
                border: "1px solid rgba(139,141,148,0.3)",
                color: "#8B8D94",
              }}
            >
              {pill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlacesRenderer({ data, onSend }: { data: unknown; onSend: (text: string) => void }) {
  const places: Place[] = Array.isArray(data) ? data : [];
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  if (!places.length) return null;

  return (
    <div className="mt-3 -mx-1">
      <div className="flex gap-3 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: "none" }}>
        {places.map((place, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              width: "200px",
              background: "#0D1117",
              border: "1px solid rgba(200,169,110,0.15)",
            }}
          >
            {/* Photo */}
            <div className="relative" style={{ height: "130px" }}>
              <img
                src={getPlaceImage(place)}
                alt={place.name}
                className="w-full h-full object-cover"
              />
              {/* Badge type */}
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: "rgba(7,11,20,0.8)", color: "#F0EDE6", backdropFilter: "blur(4px)" }}
              >
                {getPlaceEmoji(place.type)} {place.type || "Lieu"}
              </div>
              {/* Badge prix */}
              {place.priceRange && (
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(200,169,110,0.85)", color: "#070B14" }}
                >
                  {place.priceRange}
                </div>
              )}
              {/* Badge Partenaire */}
              {(place.type === "Hôtel" || place.type === "Hotel" || place.type === "Restaurant" || place.type === "Palace" || place.type === "Resort") && (
                <div
                  className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                  style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.3)", backdropFilter: "blur(4px)" }}
                >
                  ✓ Partenaire
                </div>
              )}
              {/* Coeur favori */}
              <button
                className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(7,11,20,0.7)", backdropFilter: "blur(4px)" }}
                onClick={() => setFavorites((prev) => {
                  const next = new Set(prev);
                  next.has(i) ? next.delete(i) : next.add(i);
                  return next;
                })}
              >
                <Heart
                  size={13}
                  color={favorites.has(i) ? "#ef4444" : "#F0EDE6"}
                  fill={favorites.has(i) ? "#ef4444" : "none"}
                />
              </button>
            </div>

            {/* Infos */}
            <div className="p-3">
              <div
                className="text-sm font-semibold leading-tight mb-0.5 truncate"
                style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
              >
                {place.name}
              </div>
              <div className="flex items-center gap-1 mb-1">
                <MapPin size={10} color="#8B8D94" />
                <span className="text-[10px] truncate" style={{ color: "#8B8D94" }}>
                  {place.city}{place.country ? `, ${place.country}` : ""}
                </span>
                {place.rating && (
                  <>
                    <Star size={10} color="#C8A96E" fill="#C8A96E" className="ml-auto flex-shrink-0" />
                    <span className="text-[10px]" style={{ color: "#C8A96E" }}>{place.rating}</span>
                  </>
                )}
              </div>
              {place.description && (
                <p className="text-[10px] leading-tight mb-2 line-clamp-2" style={{ color: "#8B8D94" }}>
                  {place.description}
                </p>
              )}
              <div className="flex gap-1">
                {place.id ? (
                  <a
                    href={`/lieu/${place.id}`}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-center"
                    style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                  >
                    Voir la fiche
                  </a>
                ) : place.bookingUrl ? (
                  <a
                    href={`/api/affiliate/redirect?partner=${encodeURIComponent(getAffiliatePartner(place.type || ""))}&dest=${encodeURIComponent(place.bookingUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-center"
                    style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                  >
                    Réserver
                  </a>
                ) : (
                  <button
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold"
                    style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
                    onClick={() => onSend(`Dis-moi plus sur ${place.name}`)}
                  >
                    En savoir plus
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MapMarker {
  lat: number;
  lng: number;
  name?: string;
  type?: string;
}
function MapRenderer({ data }: { data: unknown }) {
  const mapData = data as {
    query?: string;
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: MapMarker[];
  };
  const query = mapData?.query || "Paris, France";
  const markers: MapMarker[] = mapData?.markers || [];
  const center = mapData?.center || { lat: 48.8566, lng: 2.3522 };
  const zoom = mapData?.zoom || 13;
  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      map.setCenter(center);
      map.setZoom(zoom);
      if (markers.length === 0 && query) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: query }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            map.setCenter(loc);
            new window.google.maps.Marker({
              position: loc,
              map,
              title: query,
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#C8A96E", fillOpacity: 1, strokeColor: "#070B14", strokeWeight: 2 },
            });
          }
        });
      }
      markers.forEach((m, i) => {
        const marker = new window.google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: m.name || `Lieu ${i + 1}`,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#C8A96E", fillOpacity: 1, strokeColor: "#070B14", strokeWeight: 2 },
        });
        marker.addListener("click", () => setActiveMarker(i));
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ position: "relative" }}>
      <MapView className="w-full" initialCenter={center} initialZoom={zoom} onMapReady={handleMapReady} />
      {markers.length > 0 && activeMarker !== null && (
        <div className="absolute bottom-3 left-3 right-3 rounded-xl p-3" style={{ background: "rgba(13,17,23,0.95)", border: "1px solid rgba(200,169,110,0.25)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "#F0EDE6" }}>{markers[activeMarker].name || `Lieu ${activeMarker + 1}`}</span>
            <button onClick={() => setActiveMarker(null)} className="text-xs" style={{ color: "#8B8D94" }}>×</button>
          </div>
          {markers[activeMarker].type && <span className="text-[10px]" style={{ color: "#C8A96E" }}>{markers[activeMarker].type}</span>}
          <a href={`https://www.google.com/maps/search/?api=1&query=${markers[activeMarker].lat},${markers[activeMarker].lng}`} target="_blank" rel="noopener noreferrer" className="block mt-2 text-[10px] font-semibold text-center py-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>Ouvrir dans Google Maps</a>
        </div>
      )}
      {markers.length > 1 && activeMarker === null && (
        <div className="absolute bottom-3 left-3 text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(13,17,23,0.9)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}>
          {markers.length} lieux — cliquez sur un marqueur
        </div>
      )}
    </div>
  );
}

function BookingRenderer({ data, onSend }: { data: unknown; onSend: (text: string) => void }) {
  const booking = data as BookingData;

  return (
    <div
      className="mt-3 rounded-2xl p-4"
      style={{
        background: "rgba(200,169,110,0.05)",
        border: "1px solid rgba(200,169,110,0.2)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
        {booking.name}
      </div>
      {booking.address && (
        <div className="flex items-center gap-1 mb-3">
          <MapPin size={11} color="#8B8D94" />
          <span className="text-xs" style={{ color: "#8B8D94" }}>{booking.address}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {booking.bookingUrl && (
          <a
            href={booking.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 rounded-xl text-xs font-semibold text-center"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            Réserver moi-même
          </a>
        )}
        {booking.email && (
          <a
            href={`mailto:${booking.email}?subject=Reservation via Maison Baymora&body=Bonjour, je souhaite reserver...`}
            className="py-2 rounded-xl text-xs font-semibold text-center"
            style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
          >
            Mon assistant
          </a>
        )}
        <button
          className="py-2 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
          onClick={() => onSend(`Je veux que la Maison Baymora s'occupe de ma réservation au ${booking.name}`)}
        >
          Maison Baymora
        </button>
        <button
          className="py-2 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
          onClick={() => onSend(`Maya, peux-tu gerer la reservation au ${booking.name} pour moi ?`)}
        >
          Via Baymora
        </button>
      </div>
      <p className="text-[10px] mt-2 text-center" style={{ color: "#8B8D94" }}>
        Mentionnez Maison Baymora pour bénéficier de vos avantages
      </p>
    </div>
  );
}

function ScenariosRenderer({ data, onSend }: { data: unknown; onSend: (text: string) => void }) {
  const scenarios: Scenario[] = Array.isArray(data) ? data : [];
  const [activeTab, setActiveTab] = useState(0);

  if (!scenarios.length) return null;

  const active = scenarios[activeTab];

  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(200,169,110,0.15)" }}>
      {/* Onglets */}
      <div className="flex" style={{ background: "#0D1117" }}>
        {scenarios.map((s, i) => (
          <button
            key={i}
            className="flex-1 py-2.5 text-xs font-semibold transition-all"
            style={{
              background: activeTab === i ? "rgba(200,169,110,0.15)" : "transparent",
              color: activeTab === i ? "#C8A96E" : "#8B8D94",
              borderBottom: activeTab === i ? "2px solid #C8A96E" : "2px solid transparent",
            }}
            onClick={() => setActiveTab(i)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="p-4" style={{ background: "#070B14" }}>
        {active.budget && (
          <div className="text-xs mb-3" style={{ color: "#C8A96E" }}>
            Budget estimé : <strong>{active.budget}</strong>
          </div>
        )}
        {active.description && (
          <p className="text-xs mb-3" style={{ color: "#8B8D94" }}>{active.description}</p>
        )}
        {active.days?.map((day, i) => (
          <div key={i} className="mb-3">
            <div className="text-xs font-semibold mb-1.5" style={{ color: "#F0EDE6" }}>Jour {day.day}</div>
            <div className="space-y-1">
              {day.morning && <div className="text-xs" style={{ color: "#8B8D94" }}><span style={{ color: "#C8A96E" }}>Matin</span> · {day.morning}</div>}
              {day.afternoon && <div className="text-xs" style={{ color: "#8B8D94" }}><span style={{ color: "#C8A96E" }}>Apres-midi</span> · {day.afternoon}</div>}
              {day.evening && <div className="text-xs" style={{ color: "#8B8D94" }}><span style={{ color: "#C8A96E" }}>Soiree</span> · {day.evening}</div>}
            </div>
          </div>
        ))}
        <button
          className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold"
          style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          onClick={() => onSend(`Je choisis le scenario ${active.name}`)}
        >
          Choisir ce scenario
        </button>
      </div>
    </div>
  );
}

function GCalRenderer({ data }: { data: unknown }) {
  const gcal = data as GCalData;
  const title = encodeURIComponent(gcal.title || "Evenement Baymora");
  const dates = gcal.start ? `${gcal.start}/${gcal.end || gcal.start}` : "";
  const location = encodeURIComponent(gcal.location || "");
  const details = encodeURIComponent(gcal.description || "Organise par Maison Baymora");
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;

  return (
    <div className="mt-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
      >
        <Calendar size={12} />
        Ajouter au calendrier
      </a>
    </div>
  );
}

function JourneyRenderer({ data }: { data: unknown }) {
  const journey = data as JourneyData;
  const steps = journey?.steps || [];

  if (!steps.length) return null;

  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.18)" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(200,169,110,0.1)" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "#C8A96E" }}>🗺️</span>
          <span className="text-xs font-semibold" style={{ color: "#C8A96E" }}>Itinéraire transport</span>
        </div>
        {(journey as any)?.totalDuration && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E" }}>
            {(journey as any).totalDuration} au total
          </span>
        )}
      </div>
      {/* Trajet résumé */}
      {journey.from && journey.to && (
        <div className="px-4 py-2 text-xs" style={{ color: "#8B8D94", borderBottom: "1px solid rgba(200,169,110,0.06)" }}>
          {journey.from} <span style={{ color: "#C8A96E" }}>→</span> {journey.to}
        </div>
      )}
      {/* Étapes */}
      <div className="p-4 space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                style={{ background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.25)" }}
              >
                {getTransportEmoji(step.mode)}
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 flex-1 my-1" style={{ background: "rgba(200,169,110,0.15)", minHeight: "24px" }} />
              )}
            </div>
            {/* Contenu étape */}
            <div className="pb-4 flex-1">
              <div className="text-xs font-semibold" style={{ color: "#F0EDE6" }}>
                {step.from} <span style={{ color: "#C8A96E" }}>→</span> {step.to}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                <span className="text-[10px] font-medium" style={{ color: "#C8A96E" }}>{step.mode}</span>
                {step.duration && <span className="text-[10px]" style={{ color: "#8B8D94" }}>⏱ {step.duration}</span>}
                {step.departure && step.arrival && (
                  <span className="text-[10px]" style={{ color: "#8B8D94" }}>{step.departure} → {step.arrival}</span>
                )}
                {step.cost && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E" }}>
                    {step.cost}
                  </span>
                )}
              </div>
              {step.notes && (
                <div className="mt-1 text-[10px] italic" style={{ color: "#6B6E78" }}>{step.notes}</div>
              )}
              {step.bookingUrl && (
                <a
                  href={`/api/affiliate/redirect?partner=${encodeURIComponent(getAffiliatePartner(step.mode))}&dest=${encodeURIComponent(step.bookingUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.3)", color: "#C8A96E" }}
                >
                  Réserver <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownText({ content }: { content: string }) {
  return (
    <div
      className="text-sm leading-relaxed prose prose-invert max-w-none"
      style={{ color: "#F0EDE6" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong style={{ color: "#E8D5A8", fontWeight: 600 }}>{children}</strong>,
          em: ({ children }) => <em style={{ color: "#C8A96E" }}>{children}</em>,
          ul: ({ children }) => <ul className="list-none space-y-1 my-2">{children}</ul>,
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-sm">
              <span style={{ color: "#C8A96E", flexShrink: 0 }}>·</span>
              <span>{children}</span>
            </li>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#C8A96E", textDecoration: "underline" }}>
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E" }}
            >
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MessageRendererProps {
  content: string;
  onSend: (text: string) => void;
}

export default function MessageRenderer({ content, onSend }: MessageRendererProps) {
  const segments = parseMessage(content);

  return (
    <div className="space-y-1">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "text":
            return <MarkdownText key={i} content={seg.content} />;
          case "QR":
            return <QRRenderer key={i} data={seg.data} onSend={onSend} />;
          case "PLACES":
            return <PlacesRenderer key={i} data={seg.data} onSend={onSend} />;
          case "MAP":
            return <MapRenderer key={i} data={seg.data} />;
          case "BOOKING":
            return <BookingRenderer key={i} data={seg.data} onSend={onSend} />;
          case "SCENARIOS":
            return <ScenariosRenderer key={i} data={seg.data} onSend={onSend} />;
          case "GCAL":
            return <GCalRenderer key={i} data={seg.data} />;
          case "JOURNEY":
            return <JourneyRenderer key={i} data={seg.data} />;
          default:
            return <MarkdownText key={i} content={seg.content} />;
        }
      })}
    </div>
  );
}
