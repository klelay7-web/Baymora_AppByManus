import { useState, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BottomSheet, PillFilter } from "@/components/BottomSheet";
import { MapView } from "@/components/Map";
import {
  MapPin, Heart, Tag, Flame, Star, ChevronRight, SlidersHorizontal,
  Map as MapIcon, Grid3X3, ArrowLeft, Clock, Users, Sparkles, X
} from "lucide-react";
import { Link, useLocation } from "wouter";

// ─── Constants ────────────────────────────────────────────────────────────────
const PRICE_TIERS = [
  { id: "tier1", label: "< 500€/nuit", icon: "💎" },
  { id: "tier2", label: "500 – 1 500€", icon: "💎" },
  { id: "tier3", label: "1 500 – 5 000€", icon: "💎" },
  { id: "tier4", label: "5 000€+", icon: "👑" },
];

const SECTORS = [
  { id: "hotelerie", label: "Hôtellerie", icon: "🏨" },
  { id: "villas", label: "Villas", icon: "🏡" },
  { id: "gastronomie", label: "Gastronomie", icon: "🍽️" },
  { id: "experiences", label: "Expériences", icon: "✨" },
  { id: "bienetre", label: "Bien-être", icon: "🧖" },
  { id: "yachting", label: "Yachting", icon: "⛵" },
  { id: "ski", label: "Ski & Montagne", icon: "⛷️" },
  { id: "transport", label: "Transport", icon: "✈️" },
];

const PACKAGE_LABELS: Record<string, string> = {
  "1_night": "1 nuit",
  "2_nights": "2 nuits",
  "3_nights": "3 nuits",
  "weekend": "Week-end",
  "week": "Semaine",
  "custom": "Séjour",
};

function formatPrice(price: number | null | undefined, currency = "EUR") {
  if (!price) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

// ─── Offer Card ───────────────────────────────────────────────────────────────
function OfferCard({ offer, onOpen, isSaved, onToggleSave }: {
  offer: any;
  onOpen: (offer: any) => void;
  isSaved: boolean;
  onToggleSave: (id: number) => void;
}) {
  const highlights = useMemo(() => {
    try { return JSON.parse(offer.highlights || "[]").slice(0, 3); } catch { return []; }
  }, [offer.highlights]);

  return (
    <div
      className="group relative bg-[#111118] rounded-2xl overflow-hidden cursor-pointer border border-white/6 hover:border-[#c9a96e]/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5"
      onClick={() => onOpen(offer)}
    >
      {/* Hero Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={offer.heroImageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"}
          alt={offer.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {offer.isFlashOffer && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Flame size={10} /> FLASH
            </span>
          )}
          {offer.isFeatured && (
            <span className="flex items-center gap-1 bg-[#c9a96e] text-[#0a0a0f] text-xs font-bold px-2.5 py-1 rounded-full">
              <Sparkles size={10} /> SÉLECTION
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isSaved ? "bg-[#c9a96e] text-[#0a0a0f]" : "bg-black/40 text-white hover:bg-black/60"
          }`}
          onClick={(e) => { e.stopPropagation(); onToggleSave(offer.id); }}
        >
          <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
        </button>

        {/* Discount badge */}
        {offer.discountPercent && (
          <div className="absolute bottom-3 left-3 bg-[#c9a96e] text-[#0a0a0f] text-sm font-bold px-3 py-1 rounded-full">
            -{offer.discountPercent}%
          </div>
        )}

        {/* Package type */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
          {PACKAGE_LABELS[offer.packageType] || offer.packageType}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1 text-white/40 text-xs mb-2">
          <MapPin size={10} />
          <span>{offer.city}, {offer.country}</span>
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-base leading-tight mb-1 line-clamp-1">
          {offer.title}
        </h3>
        {offer.tagline && (
          <p className="text-white/50 text-xs mb-3 line-clamp-1">{offer.tagline}</p>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {highlights.slice(0, 2).map((h: string, i: number) => (
              <span key={i} className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full line-clamp-1 max-w-[140px]">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            {offer.discountedPricePerNight ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[#c9a96e] font-bold text-lg">
                    {formatPrice(offer.discountedPricePerNight)}
                  </span>
                  <span className="text-white/30 text-xs">/nuit</span>
                </div>
                {offer.originalPricePerNight && (
                  <span className="text-white/30 text-xs line-through">
                    {formatPrice(offer.originalPricePerNight)}/nuit
                  </span>
                )}
              </>
            ) : offer.discountedPriceTotal ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[#c9a96e] font-bold text-lg">
                    {formatPrice(offer.discountedPriceTotal)}
                  </span>
                  <span className="text-white/30 text-xs">total</span>
                </div>
                {offer.originalPriceTotal && (
                  <span className="text-white/30 text-xs line-through">
                    {formatPrice(offer.originalPriceTotal)}
                  </span>
                )}
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <Users size={10} />
            <span>max {offer.maxGuests}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Offer Detail Sheet ───────────────────────────────────────────────────────
function OfferDetailSheet({ offer, isOpen, onClose, isSaved, onToggleSave }: {
  offer: any | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: number) => void;
}) {
   const [tab, setTab] = useState<"overview" | "inclus" | "infos">("overview");
  const highlights = useMemo(() => {
    if (!offer) return [];
    try { return JSON.parse(offer.highlights || "[]"); } catch { return []; }
  }, [offer?.highlights]);
  const included = useMemo(() => {
    if (!offer) return [];
    try { return JSON.parse(offer.included || "[]"); } catch { return []; }
  }, [offer?.included]);
  const gallery = useMemo(() => {
    if (!offer) return [];
    try { return JSON.parse(offer.galleryImages || "[]"); } catch { return []; }
  }, [offer?.galleryImages]);
  if (!offer) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={["full", "half"]}
      defaultSnap="full"
      desktopMode="side-panel"
      hideHandle={false}
    >
      <div className="flex flex-col h-full">
        {/* Hero */}
        <div className="relative flex-shrink-0">
          <div className="relative h-56 md:h-72 overflow-hidden">
            <img
              src={offer.heroImageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=90"}
              alt={offer.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {offer.isFlashOffer && (
                <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <Flame size={11} /> FLASH
                </span>
              )}
              {offer.discountPercent && (
                <span className="bg-[#c9a96e] text-[#0a0a0f] text-sm font-bold px-3 py-1.5 rounded-full">
                  -{offer.discountPercent}%
                </span>
              )}
            </div>

            {/* Save */}
            <button
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isSaved ? "bg-[#c9a96e] text-[#0a0a0f]" : "bg-black/50 text-white hover:bg-black/70"
              }`}
              onClick={() => onToggleSave(offer.id)}
            >
              <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Info below hero */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-white/40 text-xs mb-2">
              <MapPin size={11} />
              <span>{offer.city}, {offer.country}</span>
              {offer.region && <span>· {offer.region}</span>}
            </div>
            <h2 className="text-white font-bold text-2xl leading-tight mb-1">{offer.title}</h2>
            {offer.subtitle && <p className="text-white/60 text-sm mb-3">{offer.subtitle}</p>}

            {/* Price block */}
            <div className="flex items-end justify-between mb-4">
              <div>
                {offer.discountedPricePerNight ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-[#c9a96e] font-bold text-3xl">{formatPrice(offer.discountedPricePerNight)}</span>
                    <span className="text-white/40 text-sm">/nuit</span>
                    {offer.originalPricePerNight && (
                      <span className="text-white/30 text-sm line-through">{formatPrice(offer.originalPricePerNight)}</span>
                    )}
                  </div>
                ) : offer.discountedPriceTotal ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-[#c9a96e] font-bold text-3xl">{formatPrice(offer.discountedPriceTotal)}</span>
                    <span className="text-white/40 text-sm">total</span>
                    {offer.originalPriceTotal && (
                      <span className="text-white/30 text-sm line-through">{formatPrice(offer.originalPriceTotal)}</span>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-white/50 text-xs">
                  <Clock size={11} />
                  <span>{offer.durationNights} nuit{offer.durationNights > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1 text-white/50 text-xs">
                  <Users size={11} />
                  <span>max {offer.maxGuests} pers.</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href={offer.bookingUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#c9a96e] text-[#0a0a0f] font-bold py-3.5 rounded-2xl text-base hover:bg-[#d4b87a] transition-all shadow-lg shadow-[#c9a96e]/20"
              onClick={(e) => { if (!offer.bookingUrl) e.preventDefault(); }}
            >
              <Tag size={16} />
              Réserver cette offre
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Tab nav */}
          <div className="px-5 pb-3 border-b border-white/8">
            <div className="flex gap-2">
              {(["overview", "inclus", "infos"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    tab === t
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  {t === "overview" ? "Présentation" : t === "inclus" ? "Inclus" : "Infos pratiques"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {tab === "overview" && (
            <>
              {offer.tagline && (
                <p className="text-[#c9a96e] font-medium text-base italic">"{offer.tagline}"</p>
              )}
              <p className="text-white/70 text-sm leading-relaxed">{offer.description}</p>

              {/* Highlights */}
              {highlights.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3">Points forts</h4>
                  <div className="space-y-2">
                    {highlights.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] mt-1.5 flex-shrink-0" />
                        <span className="text-white/70 text-sm">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insider tip */}
              {offer.insiderTip && (
                <div className="bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-[#c9a96e]" />
                    <span className="text-[#c9a96e] text-xs font-semibold uppercase tracking-wider">Conseil MAYA</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{offer.insiderTip}</p>
                </div>
              )}

              {/* Gallery */}
              {gallery.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3">Galerie</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {gallery.slice(0, 4).map((img: any, i: number) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden">
                        <img src={img.url || img} alt={img.alt || ""} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "inclus" && (
            <>
              {included.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3">Ce qui est inclus</h4>
                  <div className="space-y-2">
                    {included.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-400 text-xs">✓</span>
                        </div>
                        <span className="text-white/70 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {offer.notIncluded && (() => {
                try {
                  const ni = JSON.parse(offer.notIncluded);
                  return ni.length > 0 ? (
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-3">Non inclus</h4>
                      <div className="space-y-2">
                        {ni.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white/40 text-xs">×</span>
                            </div>
                            <span className="text-white/50 text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                } catch { return null; }
              })()}
            </>
          )}

          {tab === "infos" && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-white/8">
                  <span className="text-white/50 text-sm">Établissement</span>
                  <span className="text-white text-sm font-medium">{offer.establishmentName}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/8">
                  <span className="text-white/50 text-sm">Destination</span>
                  <span className="text-white text-sm font-medium">{offer.city}, {offer.country}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/8">
                  <span className="text-white/50 text-sm">Durée</span>
                  <span className="text-white text-sm font-medium">{offer.durationNights} nuit{offer.durationNights > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/8">
                  <span className="text-white/50 text-sm">Capacité max</span>
                  <span className="text-white text-sm font-medium">{offer.maxGuests} personnes</span>
                </div>
                {offer.conditions && (
                  <div className="py-3">
                    <span className="text-white/50 text-sm block mb-2">Conditions</span>
                    <p className="text-white/60 text-sm leading-relaxed">{offer.conditions}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bottom padding for mobile nav */}
          <div className="h-8" />
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── Map Markers Component ────────────────────────────────────────────────────
function OffersMap({ offers, onSelectOffer }: { offers: any[]; onSelectOffer: (offer: any) => void }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    offers.forEach((offer) => {
      if (!offer.lat || !offer.lng) return;
      hasValidCoords = true;
      const position = { lat: offer.lat, lng: offer.lng };
      bounds.extend(position);

      const price = offer.discountedPricePerNight
        ? `${offer.discountedPricePerNight.toLocaleString("fr-FR")}€`
        : offer.discountedPriceTotal
        ? `${offer.discountedPriceTotal.toLocaleString("fr-FR")}€`
        : "";

      const marker = new google.maps.Marker({
        position,
        map,
        title: offer.title,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="36">
              <rect x="0" y="0" width="80" height="32" rx="16" fill="#c9a96e"/>
              <text x="40" y="21" font-family="Arial" font-size="11" font-weight="bold" fill="#0a0a0f" text-anchor="middle">${price}</text>
              <polygon points="36,32 44,32 40,38" fill="#c9a96e"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(80, 38),
          anchor: new google.maps.Point(40, 38),
        },
      });

      marker.addListener("click", () => onSelectOffer(offer));
      markersRef.current.push(marker);
    });

    if (hasValidCoords) {
      map.fitBounds(bounds, 60);
    } else {
      map.setCenter({ lat: 46.2276, lng: 2.2137 });
      map.setZoom(5);
    }
  }, [offers, onSelectOffer]);

  return (
    <MapView
      onMapReady={handleMapReady}
      className="w-full h-full"
      initialCenter={{ lat: 46.2276, lng: 2.2137 }}
      initialZoom={5}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Offers() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Filters
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Selected offer
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Saved offers
  const savedQuery = trpc.offers.getSaved.useQuery(undefined, { enabled: !!user });
  const savedIds = savedQuery.data || [];
  const toggleSaveMutation = trpc.offers.toggleSave.useMutation({
    onSuccess: () => savedQuery.refetch(),
  });

  // Seed mutation (admin only)
  const seedMutation = trpc.offers.seed.useMutation({
    onSuccess: (data) => { offersQuery.refetch(); alert(`✓ ${data.inserted} offres ajoutées`); },
  });

  // Fetch offers
  const offersQuery = trpc.offers.list.useQuery({
    sector: selectedSectors.length === 1 ? selectedSectors[0] : undefined,
    priceTier: selectedTiers.length === 1 ? (selectedTiers[0] as any) : undefined,
    isFlash: showFlash || undefined,
    limit: 50,
  });

  const offers = offersQuery.data || [];

  // Client-side multi-filter
  const filteredOffers = useMemo(() => {
    let result = offers;
    if (selectedSectors.length > 1) {
      result = result.filter(o => selectedSectors.includes(o.sector));
    }
    if (selectedTiers.length > 1) {
      result = result.filter(o => selectedTiers.includes(o.priceTier));
    }
    return result;
  }, [offers, selectedSectors, selectedTiers]);

  const featuredOffers = filteredOffers.filter(o => o.isFeatured);
  const regularOffers = filteredOffers.filter(o => !o.isFeatured);

  const handleOpenOffer = useCallback((offer: any) => {
    setSelectedOffer(offer);
    setSheetOpen(true);
  }, []);

  const handleToggleSave = useCallback((id: number) => {
    if (!user) { navigate("/chat"); return; }
    toggleSaveMutation.mutate({ offerId: id });
  }, [user, toggleSaveMutation, navigate]);

  const activeFilterCount = selectedSectors.length + selectedTiers.length + (showFlash ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#06060a] text-white">

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80"
            alt="Offres premium"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#06060a]" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 pt-16 pb-10 md:pt-24 md:pb-16 max-w-5xl mx-auto">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 text-sm mb-6 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            Accueil
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#c9a96e]/20 border border-[#c9a96e]/30 text-[#c9a96e] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Tag size={12} />
            OFFRES EXCLUSIVES BAYMORA
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            Séjours d'exception
            <br />
            <span className="text-[#c9a96e]">à prix réduit</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mb-6">
            Des adresses 5 étoiles, des villas privées et des expériences uniques — négociées exclusivement pour nos membres.
          </p>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-sm">
              <Star size={14} className="text-[#c9a96e]" />
              <span>{offers.length} offres disponibles</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-sm">
              <Tag size={14} className="text-[#c9a96e]" />
              <span>Jusqu'à -30% sur le prix public</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-sm">
              <Sparkles size={14} className="text-[#c9a96e]" />
              <span>Sélection 5 étoiles uniquement</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FILTERS BAR ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#06060a]/95 backdrop-blur-xl border-b border-white/8 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          {/* Top row: view toggle + filter button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${viewMode === "grid" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"}`}
              >
                <Grid3X3 size={14} />
                <span className="hidden sm:inline">Grille</span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${viewMode === "map" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"}`}
              >
                <MapIcon size={14} />
                <span className="hidden sm:inline">Carte</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {showFlash && (
                <button
                  onClick={() => setShowFlash(false)}
                  className="flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full text-xs font-semibold"
                >
                  <Flame size={12} /> Flash
                  <X size={10} />
                </button>
              )}
              <button
                onClick={() => setShowFlash(!showFlash)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${showFlash ? "bg-red-500 text-white" : "bg-white/8 text-white/60 hover:text-white"}`}
              >
                <Flame size={12} />
                Flash
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${activeFilterCount > 0 ? "bg-[#c9a96e] text-[#0a0a0f] font-semibold" : "bg-white/8 text-white/60 hover:text-white"}`}
              >
                <SlidersHorizontal size={14} />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="bg-[#0a0a0f]/30 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="space-y-3 pt-2 border-t border-white/8">
              {/* Price tiers */}
              <div>
                <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">Budget / nuit</p>
                <PillFilter
                  items={PRICE_TIERS}
                  selected={selectedTiers}
                  onChange={setSelectedTiers}
                  multi={true}
                />
              </div>
              {/* Sectors */}
              <div>
                <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">Secteur</p>
                <PillFilter
                  items={SECTORS}
                  selected={selectedSectors}
                  onChange={setSelectedSectors}
                  multi={true}
                />
              </div>
              {/* Reset */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setSelectedSectors([]); setSelectedTiers([]); setShowFlash(false); }}
                  className="text-white/40 text-xs hover:text-white/60 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {/* Sector quick pills (always visible) */}
          {!showFilters && (
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <PillFilter
                items={[{ id: "", label: "Tout" }, ...SECTORS]}
                selected={selectedSectors.length === 0 ? [""] : selectedSectors}
                onChange={(ids) => setSelectedSectors(ids.filter(id => id !== ""))}
                multi={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── CONTENT ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Admin seed button */}
        {user?.role === "admin" && offers.length === 0 && (
          <div className="text-center py-8">
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="bg-[#c9a96e] text-[#0a0a0f] font-bold px-6 py-3 rounded-2xl hover:bg-[#d4b87a] transition-all"
            >
              {seedMutation.isPending ? "Chargement..." : "Initialiser les offres de démonstration"}
            </button>
          </div>
        )}

        {offersQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : viewMode === "map" ? (
          /* ─── MAP VIEW ─────────────────────────────────────────────────── */
          <div className="relative rounded-2xl overflow-hidden" style={{ height: "70vh" }}>
            <OffersMap offers={filteredOffers} onSelectOffer={handleOpenOffer} />
            {/* Floating count */}
            <div className="absolute top-4 left-4 bg-[#0a0a0f]/80 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-white/10">
              {filteredOffers.length} offre{filteredOffers.length > 1 ? "s" : ""} sur la carte
            </div>
          </div>
        ) : (
          /* ─── GRID VIEW ────────────────────────────────────────────────── */
          <>
            {/* Featured section */}
            {featuredOffers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-[#c9a96e]" />
                  <h2 className="text-white font-semibold text-lg">Sélection Baymora</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onOpen={handleOpenOffer}
                      isSaved={savedIds.includes(offer.id)}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular offers */}
            {regularOffers.length > 0 && (
              <div>
                {featuredOffers.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={16} className="text-white/50" />
                    <h2 className="text-white font-semibold text-lg">Toutes les offres</h2>
                    <span className="text-white/30 text-sm">({regularOffers.length})</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onOpen={handleOpenOffer}
                      isSaved={savedIds.includes(offer.id)}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredOffers.length === 0 && !offersQuery.isLoading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Tag size={24} className="text-white/20" />
                </div>
                <p className="text-white/40 text-lg mb-2">Aucune offre pour ces filtres</p>
                <p className="text-white/25 text-sm mb-4">Essayez d'élargir votre recherche</p>
                <button
                  onClick={() => { setSelectedSectors([]); setSelectedTiers([]); setShowFlash(false); }}
                  className="text-[#c9a96e] text-sm hover:underline"
                >
                  Voir toutes les offres
                </button>
              </div>
            )}
          </>
        )}

        {/* Bottom padding for mobile nav */}
        <div className="h-24 md:h-8" />
      </div>

      {/* ─── OFFER DETAIL SHEET ───────────────────────────────────────────── */}
      <OfferDetailSheet
        offer={selectedOffer}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isSaved={selectedOffer ? savedIds.includes(selectedOffer.id) : false}
        onToggleSave={handleToggleSave}
      />
    </div>
  );
}
