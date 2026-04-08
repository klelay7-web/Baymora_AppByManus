import { useState } from "react";
import { Link } from "wouter";
import { Heart, Sparkles, Star } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const OFFRES = [
  {
    id: "plaza-athenee",
    name: "Hotel Plaza Athenee",
    type: "Hotels",
    city: "Paris",
    quartier: "8e arrondissement",
    tags: ["Piscine", "Spa", "Suite", "Restaurant etoile"],
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
    type: "Hotels",
    city: "Bali",
    quartier: "Ubud",
    tags: ["Piscine privee", "Spa", "Villa", "Riziere"],
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
    type: "Hotels",
    city: "Marrakech",
    quartier: "Medina",
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
    type: "Hotels",
    city: "Santorini",
    quartier: "Oia",
    tags: ["Piscine a debordement", "Vue mer", "Suite"],
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
    type: "Hotels",
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
    quartier: "Medina",
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
    tags: ["3 etoiles Michelin", "Gastronomie", "Cave"],
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
    tags: ["3 etoiles Michelin", "Fruits de mer", "Luxe"],
    pct: 20,
    price: "320€",
    original: "400€",
    img: `${CDN}/baymora-le-bernardin-ny-XNKTXuSWQ3auUpy8MJmhDj.webp`,
    featured: false,
    stars: 5,
  },
  {
    id: "sunset-cruise",
    name: "Sunset Cruise Santorini",
    type: "Experiences",
    city: "Santorini",
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
    name: "Tour en Helicoptere NYC",
    type: "Experiences",
    city: "New York",
    quartier: "Manhattan",
    tags: ["Vue aerienne", "Manhattan", "Coucher de soleil"],
    pct: 10,
    price: "280€",
    original: "310€",
    img: `${CDN}/baymora-helicopter-ny-W7nbN8cvvsmM2GZvpJXSkG.webp`,
    featured: true,
    stars: 5,
  },
  {
    id: "wine-santorini",
    name: "Degustation de vins",
    type: "Experiences",
    city: "Santorini",
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

const FILTERS = ["Tout", "Hotels", "Spas", "Restaurants", "Experiences"];

export default function Offres() {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filtered = activeFilter === "Tout" ? OFFRES : OFFRES.filter((o) => o.type === activeFilter);

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
          Offres exclusives
        </h1>
        <p className="text-sm" style={{ color: "#8B8D94" }}>Reductions negociees en direct</p>
      </div>

      {/* Filtres pills */}
      <div className="px-4 mb-4">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              className="pill-item flex-shrink-0"
              style={{
                background: activeFilter === f ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(200, 169, 110, 0.08)",
                color: activeFilter === f ? "#070B14" : "#8B8D94",
                border: activeFilter === f ? "none" : "1px solid rgba(200, 169, 110, 0.15)",
                fontWeight: activeFilter === f ? 600 : 400,
              }}
              onClick={() => setActiveFilter(f)}
            >
              {f}
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
            <div className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>Jusqu'a -40% sur des hotels premium</div>
            <div className="text-xs" style={{ color: "#8B8D94" }}>Offres negociees en exclusivite pour les membres Baymora</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((offer) => (
            <Link key={offer.id} href={`/lieu/${offer.id}`}>
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
                      Selection Baymora
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
                      <span className="text-[10px] line-through" style={{ color: "#8B8D94" }}>{offer.original}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: "#C8A96E" }}>Voir →</span>
                  </div>
                </div>
              </div>
            </Link>
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
                Maya integre ces offres dans un voyage sur-mesure.
              </p>
            </div>
            <Link href="/maya">
              <button
                className="px-5 py-2.5 rounded-full text-sm font-semibold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
              >
                Parler a Maya
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
