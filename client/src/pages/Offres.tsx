import { useState } from "react";
import { Link } from "wouter";
import { Heart, Sparkles, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const OFFRES = [
  {
    id: "plaza-athenee",
    name: "Hôtel Plaza Athénée",
    type: "Hôtels",
    city: "Paris",
    quartier: "8e arrondissement",
    tags: ["Piscine", "Spa", "Suite", "Restaurant étoilé"],
    pct: 28,
    price: "680€",
    original: "940€",
    img: `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
    featured: true,
    stars: 5,
  },
  {
    id: "four-seasons-bali",
    name: "Four Seasons Bali",
    type: "Hôtels",
    city: "Bali",
    quartier: "Ubud",
    tags: ["Piscine privée", "Spa", "Villa", "Rizière"],
    pct: 35,
    price: "520€",
    original: "800€",
    img: `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`,
    featured: true,
    stars: 5,
  },
  {
    id: "mamounia",
    name: "La Mamounia",
    type: "Hôtels",
    city: "Marrakech",
    quartier: "Médina",
    tags: ["Hammam", "Piscine", "Jardin", "Palace"],
    pct: 18,
    price: "420€",
    original: "510€",
    img: `${CDN}/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp`,
    featured: false,
    stars: 5,
  },
  {
    id: "canaves-oia",
    name: "Canaves Oia",
    type: "Hôtels",
    city: "Santorin",
    quartier: "Oia",
    tags: ["Piscine à débordement", "Vue mer", "Suite"],
    pct: 22,
    price: "650€",
    original: "830€",
    img: `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`,
    featured: true,
    stars: 5,
  },
  {
    id: "aman-tokyo",
    name: "Aman Tokyo",
    type: "Hôtels",
    city: "Tokyo",
    quartier: "Otemachi",
    tags: ["Spa", "Piscine", "Vue panoramique", "Luxe"],
    pct: 15,
    price: "980€",
    original: "1150€",
    img: `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`,
    featured: true,
    stars: 5,
  },
  {
    id: "hammam-rose",
    name: "Hammam de la Rose",
    type: "Spas",
    city: "Marrakech",
    quartier: "Médina",
    tags: ["Hammam", "Soins", "Rituel"],
    pct: 30,
    price: "85€",
    original: "120€",
    img: `${CDN}/baymora-hammam-rose-marrakech-e4AJVTS2TKhiaQSM9XUbBV.webp`,
    featured: false,
    stars: 4,
  },
  {
    id: "spa-bali",
    name: "Spa Ubud Hanging Gardens",
    type: "Spas",
    city: "Bali",
    quartier: "Ubud",
    tags: ["Spa", "Massage", "Piscine infinie"],
    pct: 25,
    price: "120€",
    original: "160€",
    img: `${CDN}/baymora-spa-bali-USRQm4Ye3oxWJfMnaoeUFr.webp`,
    featured: false,
    stars: 5,
  },
  {
    id: "le-cinq",
    name: "Le Cinq — Four Seasons",
    type: "Restaurants",
    city: "Paris",
    quartier: "8e arrondissement",
    tags: ["3 étoiles Michelin", "Gastronomie", "Cave"],
    pct: 22,
    price: "280€",
    original: "360€",
    img: `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`,
    featured: true,
    stars: 5,
  },
  {
    id: "le-bernardin",
    name: "Le Bernardin",
    type: "Restaurants",
    city: "New York",
    quartier: "Midtown",
    tags: ["3 étoiles Michelin", "Fruits de mer", "Luxe"],
    pct: 20,
    price: "320€",
    original: "400€",
    img: `${CDN}/baymora-le-bernardin-ny-XNKTXuSWQ3auUpy8MJmhDj.webp`,
    featured: false,
    stars: 5,
  },
  {
    id: "sunset-cruise",
    name: "Sunset Cruise Santorin",
    type: "Expériences",
    city: "Santorin",
    quartier: "Oia",
    tags: ["Coucher de soleil", "Catamaran", "Champagne"],
    pct: 15,
    price: "180€",
    original: "210€",
    img: `${CDN}/baymora-sunset-cruise-santorini-43GVV6w8FwsAdnFbxFKRVj.webp`,
    featured: false,
    stars: 5,
  },
  {
    id: "helicopter-ny",
    name: "Tour en Hélicoptère NYC",
    type: "Expériences",
    city: "New York",
    quartier: "Manhattan",
    tags: ["Vue aérienne", "Manhattan", "Coucher de soleil"],
    pct: 10,
    price: "280€",
    original: "310€",
    img: `${CDN}/baymora-helicopter-ny-W7nbN8cvvsmM2GZvpJXSkG.webp`,
    featured: true,
    stars: 5,
  },
  {
    id: "wine-santorini",
    name: "Dégustation de vins",
    type: "Expériences",
    city: "Santorin",
    quartier: "Pyrgos",
    tags: ["Vin local", "Coucher de soleil", "Gastronomie"],
    pct: 20,
    price: "95€",
    original: "120€",
    img: `${CDN}/baymora-wine-tasting-santorini-KTKgTmDE6NDvcfvaRAjD4n.webp`,
    featured: false,
    stars: 4,
  },
];

const FILTERS_TYPE = ["Tout", "Hôtels", "Spas", "Restaurants", "Expériences"];
const FILTERS_CITY = ["Toutes", "Paris", "Côte d'Azur", "International"];

export default function Offres() {
  const [activeType, setActiveType] = useState("Tout");
  const [activeCity, setActiveCity] = useState("Toutes");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filtered = OFFRES.filter((o) => {
    const matchType = activeType === "Tout" || o.type === activeType;
    const matchCity = activeCity === "Toutes" || o.city === activeCity;
    return matchType && matchCity;
  });

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-5xl mx-auto">
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
        >
          Nos privilèges
        </h1>
        <p className="text-sm" style={{ color: "#8B8D94" }}>Des adresses d'exception, négociées pour vous.</p>
      </div>

      {/* Filtres type */}
      <div className="px-4 mb-2">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS_TYPE.map((f) => (
            <button
              key={f}
              className="pill-item flex-shrink-0"
              style={{
                background: activeType === f ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(200, 169, 110, 0.08)",
                color: activeType === f ? "#070B14" : "#8B8D94",
                border: activeType === f ? "none" : "1px solid rgba(200, 169, 110, 0.15)",
                fontWeight: activeType === f ? 600 : 400,
              }}
              onClick={() => setActiveType(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres villes */}
      <div className="px-4 mb-4">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS_CITY.map((c) => (
            <button
              key={c}
              className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
              style={{
                background: activeCity === c ? "rgba(200, 169, 110, 0.15)" : "transparent",
                color: activeCity === c ? "#C8A96E" : "#8B8D94",
                border: activeCity === c ? "1px solid rgba(200, 169, 110, 0.35)" : "1px solid rgba(200, 169, 110, 0.08)",
              }}
              onClick={() => setActiveCity(c)}
            >
              {c !== "Toutes" && <MapPin size={10} />}
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Banner promo */}
      <div className="px-4 mb-6">
        <div
          className="max-w-5xl mx-auto rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: "rgba(22, 163, 74, 0.12)", border: "1px solid rgba(22, 163, 74, 0.25)" }}
        >
          <div className="text-2xl">🏷️</div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>Jusqu'à -40% sur des hôtels premium</div>
            <div className="text-xs" style={{ color: "#8B8D94" }}>Offres négociées en exclusivité pour les membres Baymora</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-2 md:col-span-3 text-center py-12" style={{ color: "#8B8D94" }}>
              <p className="text-sm">Aucune offre pour cette sélection.</p>
              <button className="mt-3 text-xs" style={{ color: "#C8A96E" }} onClick={() => { setActiveType("Tout"); setActiveCity("Toutes"); }}>Réinitialiser les filtres</button>
            </div>
          )}
          {filtered.map((offer, idx) => (
            <motion.div key={offer.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.07, duration: 0.4 }}>
            <Link href={`/lieu/${offer.id}`}>
              <div
                className="rounded-2xl overflow-hidden card-hover cursor-pointer"
                style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
              >
                {/* Photo */}
                <div className="relative" style={{ paddingTop: "56.25%" }}>
                  <img
                    src={offer.img}
                    alt={offer.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.7) 0%, transparent 50%)" }} />
                  {/* Badge remise */}
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "#16a34a", color: "white" }}
                  >
                    -{offer.pct}%
                  </div>
                  {/* Badge Baymora */}
                  {offer.featured && (
              <div
                className="absolute top-2 left-14 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(200, 169, 110, 0.9)", color: "#070B14" }}
              >
                Sélection Baymora
              </div>
                  )}
                  {/* Badge Partenaire */}
                  {(offer.type === "Hôtels" || offer.type === "Restaurants") && (
                    <div
                      className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: "rgba(200, 169, 110, 0.15)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.3)", backdropFilter: "blur(4px)" }}
                    >
                      ✓ Partenaire
                    </div>
                  )}
                  {/* Favoris */}
                  <button
                    className="absolute top-2 right-2 p-1.5 rounded-full"
                    style={{ background: "rgba(7, 11, 20, 0.6)" }}
                    onClick={(e) => toggleFav(offer.id, e)}
                  >
                    <Heart
                      size={14}
                      color={favorites.has(offer.id) ? "#ef4444" : "rgba(200,169,110,0.7)"}
                      fill={favorites.has(offer.id) ? "#ef4444" : "none"}
                    />
                  </button>
                </div>

                {/* Infos */}
                <div className="p-3">
                  <div className="text-[10px] mb-0.5" style={{ color: "#8B8D94" }}>
                    {offer.type} · {offer.city} · {offer.quartier}
                  </div>
                  <h3
                    className="text-xs font-semibold mb-2 leading-tight"
                    style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}
                  >
                    {offer.name}
                  </h3>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {offer.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(200, 169, 110, 0.1)", color: "#C8A96E" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* Prix */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{ color: "#C8A96E" }}>{offer.price}</span>
                      {offer.pct > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E" }}>-{offer.pct}%</span>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: "#C8A96E" }}>Voir →</span>
                  </div>
                </div>
              </div>
            </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Maya */}
        <div className="max-w-5xl mx-auto mt-8">
          <div
            className="rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left"
            style={{
              background: "rgba(200, 169, 110, 0.06)",
              border: "1px solid rgba(200, 169, 110, 0.2)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
            >
              <Sparkles size={20} color="#070B14" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "#F0EDE6" }}>
                Envie d'un parcours complet ?
              </p>
              <p className="text-xs" style={{ color: "#8B8D94" }}>
                Maya intègre ces offres dans un voyage sur-mesure.
              </p>
            </div>
            <Link href="/maya">
              <button
                className="px-5 py-2.5 rounded-full text-sm font-semibold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
              >
                Parler à Maya
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
