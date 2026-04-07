import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Gift, Heart, ArrowRight, Sparkles, Lock, MapPin, Clock, Star } from "lucide-react";
import { getLoginUrl } from "@/const";

const CATEGORIES = [
  { key: "all", label: "Tout" },
  { key: "weekend", label: "Week-end" },
  { key: "gastronomie", label: "Gastronomie" },
  { key: "wellness", label: "Wellness" },
  { key: "aventure", label: "Aventure" },
  { key: "culture", label: "Culture" },
  { key: "honeymoon", label: "Romantique" },
  { key: "family", label: "Famille" },
  { key: "seasonal", label: "Saison" },
];

// Images placeholder pour les bundles
const BUNDLE_IMAGES = [
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
];

// Bundles d'exemple (en attendant le backend)
const SAMPLE_BUNDLES = [
  { id: 1, slug: "3-rooftops-paris", title: "3 Rooftops à connaître à Paris", subtitle: "Vues imprenables sur la Ville Lumière", category: "gastronomie", destination: "Paris", duration: "1 soirée", itemCount: 3, coverIdx: 0, accessLevel: "free" },
  { id: 2, slug: "5-spas-montagne", title: "5 Spas de haute montagne", subtitle: "Détente absolue entre ciel et neige", category: "wellness", destination: "Alpes", duration: "2-3 jours", itemCount: 5, coverIdx: 1, accessLevel: "free" },
  { id: 3, slug: "3-secrets-nyc", title: "3 Secrets à NYC", subtitle: "Les adresses que personne ne connaît", category: "culture", destination: "New York", duration: "1 week-end", itemCount: 3, coverIdx: 2, accessLevel: "explorer" },
  { id: 4, slug: "week-end-monaco", title: "Week-end Royal à Monaco", subtitle: "Du Casino au Yacht Club", category: "weekend", destination: "Monaco", duration: "3 jours / 2 nuits", itemCount: 4, coverIdx: 3, accessLevel: "explorer" },
  { id: 5, slug: "escapade-bali", title: "Escapade Spirituelle à Bali", subtitle: "Temples, rizières et couchers de soleil", category: "aventure", destination: "Bali", duration: "5 jours", itemCount: 6, coverIdx: 4, accessLevel: "premium" },
  { id: 6, slug: "lune-miel-maldives", title: "Lune de Miel aux Maldives", subtitle: "Romance sur pilotis", category: "honeymoon", destination: "Maldives", duration: "7 jours", itemCount: 5, coverIdx: 5, accessLevel: "premium" },
];

export default function Bundles() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [savedBundles, setSavedBundles] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    if (activeCategory === "all") return SAMPLE_BUNDLES;
    return SAMPLE_BUNDLES.filter((b) => b.category === activeCategory);
  }, [activeCategory]);

  const toggleSave = (id: number) => {
    setSavedBundles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Gratuit = 0 favoris, compte = 3, payant = illimité
        if (!user) return prev;
        if (next.size >= 3) {
          // TODO: vérifier forfait payant pour illimité
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero section */}
      <div className="relative px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
            <Gift size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Bundles à découvrir
            </h1>
            <p className="text-white/40 text-xs">Sélections inspirantes par Maison Baymora</p>
          </div>
        </div>
      </div>

      {/* Filtres catégories — pilules scrollables */}
      <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeCategory === cat.key
                ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                : "bg-white/5 text-white/50 border border-white/8 hover:bg-white/8"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bundles vedettes — carrousel horizontal style magazine */}
      <div className="px-4 mb-6">
        <h2 className="text-white/40 text-xs font-medium tracking-widest uppercase mb-3">
          En vedette
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {filtered.slice(0, 3).map((bundle) => (
            <div
              key={bundle.id}
              className="shrink-0 w-[75vw] max-w-[320px] rounded-2xl overflow-hidden bg-white/[0.03] border border-white/8 group cursor-pointer"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={BUNDLE_IMAGES[bundle.coverIdx]}
                  alt={bundle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Badge accès */}
                {bundle.accessLevel !== "free" && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 backdrop-blur-sm border border-amber-400/20">
                    <Lock size={10} className="text-amber-400" />
                    <span className="text-amber-400 text-[9px] font-semibold uppercase">
                      {bundle.accessLevel === "explorer" ? "Social Club" : "Premium"}
                    </span>
                  </div>
                )}
                {/* Bouton save */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSave(bundle.id); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <Heart
                    size={14}
                    className={savedBundles.has(bundle.id) ? "text-red-400 fill-red-400" : "text-white/70"}
                  />
                </button>
                {/* Titre sur l'image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-base leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {bundle.title}
                  </h3>
                  <p className="text-white/60 text-xs mt-0.5">{bundle.subtitle}</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><MapPin size={11} />{bundle.destination}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{bundle.duration}</span>
                  <span className="flex items-center gap-1"><Star size={11} />{bundle.itemCount} lieux</span>
                </div>
                <ArrowRight size={14} className="text-white/20 group-hover:text-amber-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grille complète */}
      <div className="px-4 pb-24">
        <h2 className="text-white/40 text-xs font-medium tracking-widest uppercase mb-3">
          {filtered.length} bundle{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
        </h2>
        <div className="space-y-3">
          {filtered.map((bundle) => (
            <div
              key={bundle.id}
              className="flex gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group cursor-pointer"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                <img
                  src={BUNDLE_IMAGES[bundle.coverIdx]}
                  alt={bundle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <h3 className="text-white/90 text-sm font-semibold leading-tight truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {bundle.title}
                  </h3>
                  <p className="text-white/40 text-xs mt-1 line-clamp-2">{bundle.subtitle}</p>
                </div>
                <div className="flex items-center gap-3 text-white/30 text-[10px]">
                  <span className="flex items-center gap-1"><MapPin size={10} />{bundle.destination}</span>
                  <span className="flex items-center gap-1"><Star size={10} />{bundle.itemCount} lieux</span>
                  {bundle.accessLevel !== "free" && (
                    <span className="flex items-center gap-1 text-amber-400/60"><Lock size={10} />{bundle.accessLevel === "explorer" ? "Social Club" : "Premium"}</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSave(bundle.id); }}
                className="self-start mt-1 shrink-0"
              >
                <Heart
                  size={16}
                  className={savedBundles.has(bundle.id) ? "text-red-400 fill-red-400" : "text-white/20 hover:text-white/40"}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA flottant si pas connecté */}
      {!user && (
        <div className="fixed bottom-20 left-4 right-4 md:hidden z-40">
          <div className="bg-[#0d0d14]/95 backdrop-blur-xl border border-amber-400/20 rounded-2xl p-4 flex items-center gap-3">
            <Sparkles size={20} className="text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium">Créez un compte pour sauvegarder vos bundles préférés</p>
            </div>
            <a
              href={getLoginUrl("/bundles")}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-semibold shrink-0"
            >
              S'inscrire
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
