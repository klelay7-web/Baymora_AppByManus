import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Star, ArrowRight, Sparkles, Gift, Crown, Lock, Clock, Users, Gem } from "lucide-react";

const CURATED_BUNDLES = [
  {
    title: "Week-end Romantique à Paris",
    description: "2 nuits au Ritz, dîner chez Alain Ducasse, croisière privée sur la Seine, spa Chanel",
    duration: "3 jours / 2 nuits",
    style: "Romance",
    priceFrom: "À partir de 4 500€",
    tier: "premium",
    highlights: ["Ritz Paris", "Alain Ducasse", "Croisière privée", "Spa Chanel"],
  },
  {
    title: "Safari Ultime au Kenya",
    description: "7 nuits dans les plus beaux lodges, survol en montgolfière, migration des gnous",
    duration: "8 jours / 7 nuits",
    style: "Aventure",
    priceFrom: "À partir de 12 000€",
    tier: "elite",
    highlights: ["Masai Mara", "Montgolfière", "Lodge privé", "Guide expert"],
  },
  {
    title: "Gastronomie Toscane",
    description: "Villa privée, cours de cuisine avec chef étoilé, route des vins, truffe blanche",
    duration: "5 jours / 4 nuits",
    style: "Gastronomie",
    priceFrom: "À partir de 6 800€",
    tier: "premium",
    highlights: ["Villa privée", "Chef étoilé", "Route des vins", "Truffe blanche"],
  },
  {
    title: "Maldives Bien-être",
    description: "Villa sur pilotis, spa ayurvédique, plongée privée, dîner sous-marin",
    duration: "6 jours / 5 nuits",
    style: "Bien-être",
    priceFrom: "À partir de 15 000€",
    tier: "elite",
    highlights: ["Villa pilotis", "Spa ayurvédique", "Plongée privée", "Dîner sous-marin"],
  },
  {
    title: "Tokyo Express Business",
    description: "Hôtel Aman, restaurants secrets, rencontres business, chauffeur privé",
    duration: "4 jours / 3 nuits",
    style: "Business",
    priceFrom: "À partir de 8 500€",
    tier: "premium",
    highlights: ["Aman Tokyo", "Restaurants secrets", "Networking VIP", "Chauffeur"],
  },
  {
    title: "Laponie Magique en Famille",
    description: "Igloo de verre, traîneau à rennes, rencontre avec le Père Noël, aurores boréales",
    duration: "5 jours / 4 nuits",
    style: "Famille",
    priceFrom: "À partir de 7 200€",
    tier: "premium",
    highlights: ["Igloo de verre", "Traîneau", "Aurores boréales", "Père Noël"],
  },
];

const TOP_10 = [
  { rank: 1, name: "Hôtel Costes, Paris", type: "Hôtel", why: "L'adresse la plus demandée par nos membres" },
  { rank: 2, name: "Nobu, Marbella", type: "Restaurant", why: "Fusion japonaise face à la Méditerranée" },
  { rank: 3, name: "Aman Venice", type: "Hôtel", why: "Palazzo du XVIe siècle sur le Grand Canal" },
  { rank: 4, name: "Noma, Copenhague", type: "Restaurant", why: "L'expérience gastronomique ultime" },
  { rank: 5, name: "One&Only Reethi Rah", type: "Resort", why: "L'île privée par excellence aux Maldives" },
  { rank: 6, name: "Singita Grumeti, Tanzanie", type: "Lodge", why: "Safari de luxe face au Serengeti" },
  { rank: 7, name: "Claridge's, Londres", type: "Hôtel", why: "L'élégance britannique incarnée" },
  { rank: 8, name: "Amanpuri, Phuket", type: "Resort", why: "Sérénité absolue en Thaïlande" },
  { rank: 9, name: "Le Cinq, Paris", type: "Restaurant", why: "3 étoiles Michelin au Four Seasons" },
  { rank: 10, name: "Jade Mountain, Sainte-Lucie", type: "Resort", why: "Suites ouvertes sur les Pitons" },
];

function BundleCard({ bundle }: { bundle: typeof CURATED_BUNDLES[0] }) {
  const tierColors: Record<string, string> = {
    premium: "border-[#c8a94a]/30 text-[#c8a94a]",
    elite: "border-purple-400/30 text-purple-400",
  };

  return (
    <div className="group p-6 rounded-lg border border-white/10 hover:border-[#c8a94a]/20 bg-white/5 hover:bg-white/8 transition-all">
      <div className="flex items-start justify-between mb-3">
        <Badge variant="outline" className={`text-[9px] ${tierColors[bundle.tier]}`}>
          {bundle.tier === "elite" ? "Élite" : "Premium"}
        </Badge>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock size={10} /> {bundle.duration}
        </span>
      </div>
      <h3 className="font-serif text-lg font-semibold mb-2">{bundle.title}</h3>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{bundle.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {bundle.highlights.map((h) => (
          <span key={h} className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8a94a]/10 text-[#c8a94a]/80">
            {h}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#c8a94a]">{bundle.priceFrom}</span>
        <Link href="/chat">
          <Button size="sm" className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs">
            Personnaliser <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function Inspirations() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c8a94a]/5 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] mb-6">
            <Gift className="mr-1 h-3 w-3" /> Sélections curatées
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Inspirations & <span className="text-[#c8a94a]">Bundles</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Des expériences clé en main, pensées par nos experts et personnalisables par notre IA.
            Choisissez, cliquez, partez.
          </p>
        </div>
      </section>

      {/* Bundles Curatés */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-[#c8a94a]" size={24} />
            <h2 className="font-serif text-2xl font-bold">Bundles Prêts à Vivre</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CURATED_BUNDLES.map((bundle) => (
              <BundleCard key={bundle.title} bundle={bundle} />
            ))}
          </div>
        </div>
      </section>

      {/* Top 10 */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Crown className="text-[#c8a94a]" size={24} />
            <h2 className="font-serif text-2xl font-bold">Top 10 — Les Plus Demandés</h2>
          </div>
          <div className="space-y-2">
            {TOP_10.map((item) => (
              <Link key={item.rank} href="/chat">
                <div className="group flex items-center gap-4 p-4 rounded-lg border border-white/10 hover:border-[#c8a94a]/20 bg-white/5 hover:bg-white/8 transition-all cursor-pointer">
                  <span className={`text-lg font-serif font-bold w-8 text-center ${item.rank <= 3 ? "text-[#c8a94a]" : "text-muted-foreground"}`}>
                    {item.rank}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <Badge variant="outline" className="border-white/20 text-white/50 text-[9px] px-1.5 py-0">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.why}</p>
                  </div>
                  <ArrowRight size={16} className="text-[#c8a94a] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Off-Market Teaser */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <Gem className="text-[#c8a94a] mx-auto mb-4" size={32} />
          <h2 className="font-serif text-2xl font-bold mb-3">
            Boutique VIP & <span className="text-[#c8a94a]">Off-Market</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8">
            Propriétés d'exception, yachts privés, jets, œuvres d'art, montres rares...
            Des opportunités qui ne sont jamais publiées. Réservées aux membres Élite.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {["Villa bord de mer, Mykonos", "Yacht 42m, Monaco", "Penthouse, Dubai Marina"].map((item) => (
              <div key={item} className="p-4 rounded-lg border border-white/10 bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <Lock className="text-[#c8a94a]/30 mx-auto mb-2 relative z-10" size={24} />
                <p className="text-xs text-muted-foreground relative z-10">{item}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8">
              Devenir membre Élite <Crown className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center border-t border-white/5">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-2xl font-bold mb-3">
            Envie de quelque chose de <span className="text-[#c8a94a]">sur-mesure</span> ?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Nos bundles sont un point de départ. Notre IA adapte chaque détail à vos envies.
          </p>
          <Link href="/chat">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8">
              Créer mon parcours <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
