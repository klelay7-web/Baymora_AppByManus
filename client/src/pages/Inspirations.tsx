import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Sparkles, Gift, Crown, Lock, Clock, ArrowLeft, ChevronRight } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

// Bundles avec images et liens vers vrais parcours/établissements
const CURATED_BUNDLES = [
  {
    title: "Week-end Romantique à Paris",
    description: "2 nuits au Ritz, dîner chez Alain Ducasse, croisière privée sur la Seine, spa Chanel",
    duration: "3 jours / 2 nuits",
    style: "Romance",
    priceFrom: "À partir de 4 500€",
    tier: "premium",
    highlights: ["Ritz Paris", "Alain Ducasse", "Croisière privée", "Spa Chanel"],
    img: `${CDN}/paris-restaurant-eiffel_bb963598.jpg`,
    slug: "le-cinq-paris", // lien vers une vraie fiche
  },
  {
    title: "Safari Ultime au Kenya",
    description: "7 nuits dans les plus beaux lodges, survol en montgolfière, migration des gnous",
    duration: "8 jours / 7 nuits",
    style: "Aventure",
    priceFrom: "À partir de 12 000€",
    tier: "elite",
    highlights: ["Masai Mara", "Montgolfière", "Lodge privé", "Guide expert"],
    img: `${CDN}/bali-sunset-pool_3e25bda7.jpg`,
    slug: null,
  },
  {
    title: "Gastronomie Toscane",
    description: "Villa privée, cours de cuisine avec chef étoilé, route des vins, truffe blanche",
    duration: "5 jours / 4 nuits",
    style: "Gastronomie",
    priceFrom: "À partir de 6 800€",
    tier: "premium",
    highlights: ["Villa privée", "Chef étoilé", "Route des vins", "Truffe blanche"],
    img: `${CDN}/paris-michelin-restaurant_3a9c5f21.jpg`,
    slug: null,
  },
  {
    title: "Maldives Bien-être",
    description: "Villa sur pilotis, spa ayurvédique, plongée privée, dîner sous-marin",
    duration: "6 jours / 5 nuits",
    style: "Bien-être",
    priceFrom: "À partir de 15 000€",
    tier: "elite",
    highlights: ["Villa pilotis", "Spa ayurvédique", "Plongée privée", "Dîner sous-marin"],
    img: `${CDN}/tropical-pool-luxury_b3d67c1a.jpg`,
    slug: null,
  },
  {
    title: "Tokyo Express Business",
    description: "Hôtel Aman, restaurants secrets, rencontres business, chauffeur privé",
    duration: "4 jours / 3 nuits",
    style: "Business",
    priceFrom: "À partir de 8 500€",
    tier: "premium",
    highlights: ["Aman Tokyo", "Restaurants secrets", "Networking VIP", "Chauffeur"],
    img: `${CDN}/tokyo-luxury-hotel_be1c6ef3.jpg`,
    slug: "aman-tokyo",
  },
  {
    title: "Santorini Coucher de Soleil",
    description: "Suite avec vue caldeira, dîner privé sur terrasse, croisière catamaran, spa de falaise",
    duration: "5 jours / 4 nuits",
    style: "Romance",
    priceFrom: "À partir de 9 500€",
    tier: "premium",
    highlights: ["Canaves Oia", "Vue caldeira", "Catamaran privé", "Spa falaise"],
    img: `${CDN}/santorini-sunset-luxury_82477c2d.jpg`,
    slug: "canaves-oia-santorini",
  },
];

// Top 10 avec vrais slugs vers les fiches établissements
const TOP_10 = [
  { rank: 1, name: "Le Cinq, Paris", type: "Restaurant", why: "3 étoiles Michelin au Four Seasons George V", slug: "le-cinq-paris" },
  { rank: 2, name: "Canaves Oia, Santorini", type: "Hôtel", why: "La vue caldeira la plus spectaculaire de Grèce", slug: "canaves-oia-santorini" },
  { rank: 3, name: "Aman Tokyo", type: "Hôtel", why: "Sérénité japonaise au 33e étage de Tokyo", slug: "aman-tokyo" },
  { rank: 4, name: "Four Seasons Bali Sayan", type: "Resort", why: "Rizières et jungle, spa ayurvédique de légende", slug: "four-seasons-bali-sayan" },
  { rank: 5, name: "The Mark Hotel, New York", type: "Hôtel", why: "L'adresse préférée des célébrités à Manhattan", slug: "the-mark-hotel-ny" },
  { rank: 6, name: "La Mamounia, Marrakech", type: "Hôtel", why: "Le palace mythique des jardins andalous", slug: "la-mamounia-marrakech" },
  { rank: 7, name: "Plaza Athénée, Paris", type: "Hôtel", why: "L'avenue Montaigne vue depuis les suites", slug: "plaza-athenee-paris" },
  { rank: 8, name: "Le Comptoir de l'Épice, Marrakech", type: "Restaurant", why: "Gastronomie marocaine contemporaine dans un riad", slug: "le-comptoir-marrakech" },
  { rank: 9, name: "Zuma Tokyo", type: "Restaurant", why: "Izakaya japonais contemporain de référence mondiale", slug: "zuma-tokyo" },
  { rank: 10, name: "Nobu Fifty Seven, New York", type: "Restaurant", why: "L'expérience Nobu originale à Manhattan", slug: "nobu-fifty-seven-ny" },
];

export default function Inspirations() {
  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* Bouton retour */}
      <div className="fixed top-20 left-4 z-30">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/50 hover:text-[#c8a94a] transition-colors text-sm bg-[#080c14]/80 backdrop-blur-sm px-3 py-2 rounded-full border border-white/10">
            <ArrowLeft size={14} /> Accueil
          </button>
        </Link>
      </div>

      {/* HERO plein écran */}
      <section className="relative min-h-[65vh] flex items-end overflow-hidden">
        <img
          src={`${CDN}/santorini-caldera-pool_50bf8b27.jpg`}
          alt="Inspirations de voyage de luxe"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080c14]/70 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">Sélections curatées</p>
          <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl mb-6 max-w-3xl leading-tight">
            Inspirations &{" "}
            <em className="text-[#c8a94a] not-italic">Bundles</em>
          </h1>
          <p className="text-white/60 text-lg max-w-xl font-light leading-relaxed">
            Des expériences clé en main, pensées par nos experts et personnalisables par notre IA.
            Choisissez, cliquez, partez.
          </p>
        </div>
      </section>

      {/* Bundles Prêts à Vivre — avec photos de couverture */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">Expériences clé en main</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl">Bundles Prêts à Vivre</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CURATED_BUNDLES.map((bundle) => (
              <div key={bundle.title} className="group flex flex-col overflow-hidden border border-white/10 hover:border-[#c8a94a]/30 transition-all bg-[#0a0f1a]">
                {/* Image de couverture */}
                <div className="relative overflow-hidden aspect-[16/9]">
                  <img
                    src={bundle.img}
                    alt={bundle.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={`text-[9px] rounded-none ${bundle.tier === "elite" ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" : "bg-[#c8a94a]/20 text-[#c8a94a] border border-[#c8a94a]/30"}`}>
                      {bundle.tier === "elite" ? "Élite" : "Premium"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] text-white/50 flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
                    <Clock size={10} /> {bundle.duration}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-2">{bundle.title}</h3>
                  <p className="text-white/50 text-sm mb-4 leading-relaxed flex-1">{bundle.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {bundle.highlights.map((h) => (
                      <span key={h} className="text-[10px] px-2 py-0.5 bg-[#c8a94a]/10 text-[#c8a94a]/80 border border-[#c8a94a]/20">
                        {h}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#c8a94a]">{bundle.priceFrom}</span>
                    <Link href={bundle.slug ? `/establishment/${bundle.slug}` : "/chat"}>
                      <Button size="sm" className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs">
                        {bundle.slug ? "Voir le parcours" : "Personnaliser"} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top 10 — avec vrais liens vers fiches */}
      <section className="py-24 px-6 bg-[#0a0f1a]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">Plébiscités par nos membres</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl">Top 10 — Les Plus Demandés</h2>
          </div>

          <div className="space-y-2">
            {TOP_10.map((item) => (
              <Link key={item.rank} href={`/establishment/${item.slug}`}>
                <div className="group flex items-center gap-5 p-5 border border-white/8 hover:border-[#c8a94a]/30 bg-white/3 hover:bg-white/6 transition-all cursor-pointer">
                  <span className={`font-['Playfair_Display'] text-2xl font-bold w-10 text-center shrink-0 ${item.rank <= 3 ? "text-[#c8a94a]" : "text-white/20"}`}>
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <Badge variant="outline" className="border-white/15 text-white/40 text-[9px] px-1.5 py-0 shrink-0">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/40">{item.why}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#c8a94a] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/discover">
              <Button variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 rounded-none px-8">
                Voir tous les établissements <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Off-Market Teaser — verrouillé */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden border border-white/10 p-10 md:p-16">
            <img
              src={`${CDN}/santorini-suite-sunset_4226a6f6.jpg`}
              alt="Off-Market"
              className="absolute inset-0 w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-[#080c14]/80" />
            <div className="relative z-10 text-center">
              <Lock className="text-[#c8a94a] mx-auto mb-4" size={32} />
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-none mb-4">
                En cours de création
              </Badge>
              <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl mb-4">
                Boutique VIP & <span className="text-[#c8a94a]">Off-Market</span>
              </h2>
              <p className="text-white/40 max-w-lg mx-auto mb-8 font-light">
                Propriétés d'exception, yachts privés, jets, œuvres d'art, montres rares...
                Des opportunités qui ne sont jamais publiées. Réservées aux membres Élite.
                Cette section sera disponible très prochainement.
              </p>
              <Link href="/pricing">
                <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8">
                  Être notifié à l'ouverture <Crown className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 bg-[#0a0f1a] text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl mb-4">
            Envie de quelque chose de <em className="text-[#c8a94a] not-italic">sur-mesure</em> ?
          </h2>
          <p className="text-white/40 font-light mb-8">
            Nos bundles sont un point de départ. Notre IA adapte chaque détail à vos envies.
          </p>
          <Link href="/chat">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-10 py-5 tracking-wider">
              Créer mon parcours <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
