import { useRoute, Link } from "wouter";
import { ArrowLeft, Heart, Share2, Star, MapPin, Clock, Phone, Globe, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const LIEUX: Record<string, {
  name: string; type: string; city: string; quartier: string; country: string;
  description: string; longDesc: string; tags: string[]; pct: number;
  price: string; original: string; stars: number; rating: number; reviews: number;
  img: string; gallery: string[]; phone: string; website: string; hours: string;
  address: string; features: string[]; maya_tip: string;
}> = {
  "plaza-athenee": {
    name: "Hotel Plaza Athenee",
    type: "Palace",
    city: "Paris",
    quartier: "8e arrondissement",
    country: "France",
    description: "L'un des palaces les plus emblematiques de Paris, sur l'Avenue Montaigne.",
    longDesc: "Niché sur l'Avenue Montaigne, le Plaza Athenee incarne l'art de vivre a la parisienne. Ses facades ornees de geraniums rouges, ses salons feutrés et son restaurant Alain Ducasse en font une adresse legendaire. Chaque suite est une oeuvre d'art, entre classicisme haussmannien et modernite raffinee.",
    tags: ["Piscine", "Spa", "Suite", "Restaurant étoilé", "Bar", "Accès privé 24h"],
    pct: 28,
    price: "680€",
    original: "940€",
    stars: 5,
    rating: 4.9,
    reviews: 1842,
    img: `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
    gallery: [
      `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
      `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`,
      `${CDN}/hero_yacht_sunset_b173a771.jpg`,
    ],
    phone: "+33 1 53 67 66 65",
    website: "www.dorchestercollection.com",
    hours: "Ouvert 24h/24",
    address: "25 Avenue Montaigne, 75008 Paris",
    features: ["Check-in 24h", "Parking valet", "Accès privé prive", "Transfert aeroport", "Room service"],
    maya_tip: "Demandez la Suite Eiffel pour une vue imprenable sur la Tour Eiffel. Le bar du Gobelins est ideal pour un cocktail en fin de soiree.",
  },
  "four-seasons-bali": {
    name: "Four Seasons Bali",
    type: "Resort",
    city: "Bali",
    quartier: "Ubud",
    country: "Indonesie",
    description: "Un resort de luxe niché au coeur des rizieres d'Ubud, avec villas privees et piscines a debordement.",
    longDesc: "Perché au-dessus de la vallee de l'Ayung, le Four Seasons Bali at Sayan est une expérience spirituelle autant que luxueuse. Ses villas avec piscine privee s'integrent harmonieusement dans la nature balinaise. Le spa propose des soins ancestraux, et le restaurant offre une cuisine balinaise contemporaine avec vue sur les rizieres.",
    tags: ["Piscine privee", "Spa", "Villa", "Riziere", "Yoga", "Cuisine balinaise"],
    pct: 35,
    price: "520€",
    original: "800€",
    stars: 5,
    rating: 4.9,
    reviews: 2103,
    img: `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`,
    gallery: [
      `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`,
      `${CDN}/baymora-spa-bali-USRQm4Ye3oxWJfMnaoeUFr.webp`,
      `${CDN}/baymora-sunset-cruise-santorini-43GVV6w8FwsAdnFbxFKRVj.webp`,
    ],
    phone: "+62 361 977577",
    website: "www.fourseasons.com/bali",
    hours: "Ouvert 24h/24",
    address: "Sayan, Ubud, Bali 80571",
    features: ["Villa piscine privee", "Yoga quotidien", "Spa ayurvedique", "Transfert aeroport", "Butler prive"],
    maya_tip: "Reservez le diner au bord de la piscine a debordement pour un coucher de soleil inoubliable sur la vallee. Le massage Jamu au spa est incontournable.",
  },
  "mamounia": {
    name: "La Mamounia",
    type: "Palace",
    city: "Marrakech",
    quartier: "Medina",
    country: "Maroc",
    description: "Le palace mythique de Marrakech, entre jardins d'oliviers centenaires et art deco marocain.",
    longDesc: "Inauguree en 1923, La Mamounia est bien plus qu'un hotel : c'est une legende vivante. Winston Churchill y peignait les jardins, les Rolling Stones y ont sejourne. Ses 3 hectares de jardins, ses hammams royaux et ses restaurants gastronomiques en font le symbole absolu du luxe marocain.",
    tags: ["Hammam", "Piscine", "Jardin", "Palace", "Spa", "Restaurant gastronomique"],
    pct: 18,
    price: "420€",
    original: "510€",
    stars: 5,
    rating: 4.8,
    reviews: 3241,
    img: `${CDN}/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp`,
    gallery: [
      `${CDN}/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp`,
      `${CDN}/baymora-hammam-rose-marrakech-e4AJVTS2TKhiaQSM9XUbBV.webp`,
      `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
    ],
    phone: "+212 524 38 86 00",
    website: "www.mamounia.com",
    hours: "Ouvert 24h/24",
    address: "Avenue Bab Jdid, Medina, Marrakech",
    features: ["Hammam royal", "3 piscines", "5 restaurants", "Jardin prive", "Galerie d'art"],
    maya_tip: "Le hammam royal est une expérience unique — réservez en début de matinée pour éviter l'affluence. Le bar Churchill est incontournable pour un cocktail au coucher du soleil.",
  },
  "canaves-oia": {
    name: "Canaves Oia",
    type: "Boutique Hotel",
    city: "Santorini",
    quartier: "Oia",
    country: "Grece",
    description: "Un bijou architectural creuse dans la falaise d'Oia, avec piscines a debordement et vue sur la caldeira.",
    longDesc: "Canaves Oia est l'hotel le plus photographié de Santorini. Ses suites creusees dans la roche volcanique offrent des vues spectaculaires sur la caldeira et le coucher de soleil legendaire d'Oia. Chaque suite dispose d'une piscine privee, et le service personnalise atteint des sommets de raffinement.",
    tags: ["Piscine a debordement", "Vue mer", "Suite", "Caldeira", "Coucher de soleil"],
    pct: 22,
    price: "650€",
    original: "830€",
    stars: 5,
    rating: 4.9,
    reviews: 987,
    img: `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`,
    gallery: [
      `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`,
      `${CDN}/baymora-sunset-cruise-santorini-43GVV6w8FwsAdnFbxFKRVj.webp`,
      `${CDN}/baymora-wine-tasting-santorini-KTKgTmDE6NDvcfvaRAjD4n.webp`,
    ],
    phone: "+30 22860 71453",
    website: "www.canaves.com",
    hours: "Ouvert 24h/24",
    address: "Oia, Santorini 847 02, Grece",
    features: ["Piscine privee par suite", "Butler prive", "Transfert en bateau", "Diner romantique", "Spa"],
    maya_tip: "Reservez la Honeymoon Suite pour le coucher de soleil le plus romantique du monde. Le diner au bord de la piscine a debordement avec vue sur la caldeira est une expérience unique.",
  },
  "aman-tokyo": {
    name: "Aman Tokyo",
    type: "Urban Resort",
    city: "Tokyo",
    quartier: "Otemachi",
    country: "Japon",
    description: "Un sanctuaire de paix au coeur de Tokyo, au 33e etage de l'Otemachi Tower, avec spa et piscine panoramique.",
    longDesc: "Aman Tokyo redefinit le luxe urbain. Perché au sommet de l'Otemachi Tower, il offre une vue a 360 degres sur Tokyo et le Mont Fuji par temps clair. L'architecture s'inspire des temples japonais, avec des espaces immenses, des materiaux nobles et un spa de 2 500 m2. Le silence et la sérénité sont les maîtres mots.",
    tags: ["Spa", "Piscine", "Vue panoramique", "Luxe", "Mont Fuji", "Onsen"],
    pct: 15,
    price: "980€",
    original: "1150€",
    stars: 5,
    rating: 4.9,
    reviews: 654,
    img: `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`,
    gallery: [
      `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`,
      `${CDN}/baymora-le-bernardin-ny-XNKTXuSWQ3auUpy8MJmhDj.webp`,
      `${CDN}/hero_yacht_sunset_b173a771.jpg`,
    ],
    phone: "+81 3 5224 3333",
    website: "www.aman.com/resorts/aman-tokyo",
    hours: "Ouvert 24h/24",
    address: "Otemachi Tower, 1-5-6 Otemachi, Chiyoda-ku, Tokyo",
    features: ["Spa 2500m2", "Piscine 30m", "Onsen", "Restaurant gastronomique", "Accès privé culturel"],
    maya_tip: "Demandez une chambre orientee nord-ouest pour voir le Mont Fuji au lever du soleil. Le spa Aman est l'un des meilleurs du monde — réservez le hammam japonais.",
  },
  "le-cinq": {
    name: "Le Cinq — Four Seasons",
    type: "Restaurant",
    city: "Paris",
    quartier: "8e arrondissement",
    country: "France",
    description: "Trois étoiles Michelin dans le cadre somptueux du Four Seasons George V. La quintessence de la gastronomie française.",
    longDesc: "Le Cinq est l'un des rares restaurants trois étoiles Michelin de Paris. Dans un cadre versaillais somptueux, le chef Christian Le Squer propose une cuisine française d'exception, jouant sur les textures, les saveurs et les émotions. La cave compte plus de 50 000 bouteilles. Une expérience gastronomique totale.",
    tags: ["3 étoiles Michelin", "Gastronomie", "Cave", "Dégustation", "Accord mets-vins"],
    pct: 22,
    price: "280€",
    original: "360€",
    stars: 5,
    rating: 4.9,
    reviews: 2187,
    img: `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`,
    gallery: [
      `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`,
      `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
      `${CDN}/baymora-le-bernardin-ny-XNKTXuSWQ3auUpy8MJmhDj.webp`,
    ],
    phone: "+33 1 49 52 71 54",
    website: "www.fourseasons.com/paris/dining/restaurants/le_cinq",
    hours: "Mer-Dim 12h30-14h, 19h30-22h",
    address: "31 Avenue George V, 75008 Paris",
    features: ["Menu dégustation", "Accord mets-vins", "Cave privee", "Salon prive", "Vegetarien disponible"],
    maya_tip: "Optez pour le menu dégustation avec accords mets-vins pour une expérience complete. Reservez au moins 3 semaines a l'avance — les tables du fond offrent plus d'intimite.",
  },
};

export default function LieuDetail() {
  const [, params] = useRoute("/lieu/:id");
  const id = params?.id || "";
  const lieu = LIEUX[id];
  const [isFav, setIsFav] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  if (!lieu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#070B14" }}>
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
          Lieu introuvable
        </h2>
        <p className="text-sm mb-6" style={{ color: "#8B8D94" }}>Ce lieu n'existe pas ou a ete supprime.</p>
        <Link href="/offres">
          <button className="px-6 py-3 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
            Voir toutes les offres
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh" }}>
      {/* Hero photo */}
      <div className="relative h-72 md:h-96">
        <img src={lieu.gallery[activePhoto]} alt={lieu.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,11,20,0.4) 0%, transparent 40%, rgba(7,11,20,0.9) 100%)" }} />

        {/* Back button */}
        <Link href="/offres">
          <button
            className="absolute top-4 left-4 p-2.5 rounded-full"
            style={{ background: "rgba(7, 11, 20, 0.7)", backdropFilter: "blur(10px)" }}
          >
            <ArrowLeft size={20} color="#F0EDE6" />
          </button>
        </Link>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            className="p-2.5 rounded-full"
            style={{ background: "rgba(7, 11, 20, 0.7)", backdropFilter: "blur(10px)" }}
            onClick={() => setIsFav((f) => !f)}
          >
            <Heart size={18} color={isFav ? "#ef4444" : "#F0EDE6"} fill={isFav ? "#ef4444" : "none"} />
          </button>
          <button
            className="p-2.5 rounded-full"
            style={{ background: "rgba(7, 11, 20, 0.7)", backdropFilter: "blur(10px)" }}
          >
            <Share2 size={18} color="#F0EDE6" />
          </button>
        </div>

        {/* Badge privilège */}
        <div
          className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-bold"
          style={{ background: "#16a34a", color: "white" }}
        >
          -{lieu.pct}% Baymora
        </div>
        {/* Badge Partenaire */}
        {(lieu.type === "Palace" || lieu.type === "Resort" || lieu.type === "Boutique Hotel" || lieu.type === "Urban Resort" || lieu.type === "Hôtel" || lieu.type === "Restaurant") && (
          <div
            className="absolute bottom-11 left-4 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: "rgba(200, 169, 110, 0.15)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.35)", backdropFilter: "blur(8px)" }}
          >
            ✓ Partenaire officiel
          </div>
        )}

        {/* Galerie miniatures */}
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {lieu.gallery.map((img, i) => (
            <button
              key={i}
              className="w-10 h-10 rounded-lg overflow-hidden"
              style={{ border: activePhoto === i ? "2px solid #C8A96E" : "2px solid transparent" }}
              onClick={() => setActivePhoto(i)}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Titre + rating */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(200, 169, 110, 0.12)", color: "#C8A96E" }}
            >
              {lieu.type}
            </span>
            <span className="text-xs" style={{ color: "#8B8D94" }}>{lieu.city}, {lieu.country}</span>
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            {lieu.name}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star size={14} color="#C8A96E" fill="#C8A96E" />
              <span className="text-sm font-bold" style={{ color: "#C8A96E" }}>{lieu.rating}</span>
              <span className="text-xs" style={{ color: "#8B8D94" }}>({lieu.reviews.toLocaleString()} avis)</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} color="#8B8D94" />
              <span className="text-xs" style={{ color: "#8B8D94" }}>{lieu.quartier}</span>
            </div>
          </div>
        </div>

        {/* Prix */}
        <div
          className="rounded-2xl p-4 mb-5 flex items-center justify-between"
          style={{ background: "rgba(22, 163, 74, 0.08)", border: "1px solid rgba(22, 163, 74, 0.2)" }}
        >
          <div>
            <div className="text-xs mb-0.5" style={{ color: "#8B8D94" }}>Prix membre Baymora</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: "#C8A96E" }}>{lieu.price}</span>
              {lieu.pct > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.3)" }}
                >
                  -{lieu.pct}% membre
                </span>
              )}
            </div>
          </div>
          <button
            className="px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            onClick={() => {
              const isRestaurant = lieu.type === 'Restaurant';
              const dest = isRestaurant
                ? `https://www.thefork.fr/search?query=${encodeURIComponent(lieu.name)}`
                : `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(lieu.name + ' ' + lieu.city)}&aid=2311236`;
              window.open(`/api/affiliate/redirect?partner=${isRestaurant ? 'thefork' : 'booking'}&dest=${encodeURIComponent(dest)}`, '_blank');
            }}
          >
            Réserver
          </button>
        </div>

        {/* Description */}
        <div className="mb-5">
          <h2 className="text-base font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            A propos
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#8B8D94" }}>{lieu.longDesc}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {lieu.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(200, 169, 110, 0.08)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.15)" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Conseil Maya */}
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: "rgba(200, 169, 110, 0.06)", border: "1px solid rgba(200, 169, 110, 0.2)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
            >
              <Sparkles size={12} color="#070B14" />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#C8A96E" }}>Conseil de Maya</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#8B8D94" }}>{lieu.maya_tip}</p>
          <Link href="/maya">
            <button
              className="mt-3 text-xs font-medium flex items-center gap-1"
              style={{ color: "#C8A96E" }}
            >
              Demander plus a Maya <ChevronRight size={12} />
            </button>
          </Link>
        </div>

        {/* Infos pratiques */}
        <div
          className="rounded-2xl overflow-hidden mb-5"
          style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.1)" }}
        >
          <h2 className="text-sm font-bold px-4 pt-4 pb-2" style={{ color: "#F0EDE6" }}>Infos pratiques</h2>
          {[
            { icon: MapPin, label: "Adresse", value: lieu.address },
            { icon: Clock, label: "Horaires", value: lieu.hours },
            { icon: Phone, label: "Telephone", value: lieu.phone },
            { icon: Globe, label: "Site web", value: lieu.website },
          ].map((info, i, arr) => {
            const Icon = info.icon;
            return (
              <div
                key={info.label}
                className="flex items-start gap-3 px-4 py-3"
                style={{ borderTop: "1px solid rgba(200, 169, 110, 0.06)" }}
              >
                <Icon size={14} color="#C8A96E" className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] mb-0.5" style={{ color: "#8B8D94" }}>{info.label}</div>
                  <div className="text-xs" style={{ color: "#F0EDE6" }}>{info.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Services inclus */}
        <div className="mb-6">
          <h2 className="text-base font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Services inclus
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {lieu.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.08)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C8A96E" }} />
                <span className="text-xs" style={{ color: "#8B8D94" }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="flex gap-3">
          <button
            className="flex-1 py-3.5 rounded-full text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            Reserver — {lieu.price}
          </button>
          <Link href="/maya">
            <button
              className="px-4 py-3.5 rounded-full text-sm font-medium"
              style={{ background: "rgba(200, 169, 110, 0.1)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.2)" }}
            >
              <Sparkles size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
