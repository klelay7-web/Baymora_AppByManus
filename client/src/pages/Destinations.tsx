import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Compass, Gem, Heart, ArrowRight, Lock, MapPin, Star } from "lucide-react";

const CONTINENTS = [
  { name: "Europe", count: 48, image: "🏛️", tagline: "Palais, vignobles et riviera", destinations: ["Paris", "Santorini", "Amalfi", "Barcelone", "Londres"] },
  { name: "Asie", count: 35, image: "🏯", tagline: "Temples, sérénité et saveurs", destinations: ["Tokyo", "Bali", "Maldives", "Singapour", "Dubaï"] },
  { name: "Amériques", count: 28, image: "🗽", tagline: "Grands espaces et skylines", destinations: ["New York", "Tulum", "Buenos Aires", "Aspen", "Rio"] },
  { name: "Afrique", count: 18, image: "🦁", tagline: "Safari, désert et authenticité", destinations: ["Marrakech", "Cape Town", "Serengeti", "Zanzibar", "Maurice"] },
  { name: "Océanie", count: 12, image: "🏝️", tagline: "Paradis et bout du monde", destinations: ["Sydney", "Bora Bora", "Fidji", "Nouvelle-Zélande", "Tahiti"] },
];

const EXPERIENCES = [
  { name: "Gastronomie", icon: "🍽️", description: "Tables étoilées, chefs privés, wine tours", count: 120 },
  { name: "Bien-être & Spa", icon: "💆", description: "Retraites, thermes, yoga de luxe", count: 85 },
  { name: "Aventure", icon: "🏔️", description: "Hélicoptère, plongée, expéditions", count: 64 },
  { name: "Culture & Art", icon: "🎭", description: "Musées privés, opéra, galeries", count: 92 },
  { name: "Romance", icon: "💕", description: "Lune de miel, dîners intimes, croisières", count: 78 },
  { name: "Business & Networking", icon: "💼", description: "Conférences VIP, clubs privés", count: 45 },
];

const TRENDING = [
  { name: "Cappadoce, Turquie", tagline: "Vol en montgolfière au lever du soleil", badge: "Tendance 2026" },
  { name: "Lofoten, Norvège", tagline: "Aurores boréales et fjords sauvages", badge: "Coup de cœur" },
  { name: "Oman", tagline: "Le luxe discret du Moyen-Orient", badge: "Émergent" },
  { name: "Patagonie, Argentine", tagline: "Glaciers et estancias secrètes", badge: "Aventure" },
];

const SECRET_DESTINATIONS = [
  { name: "Île privée, Grèce", teaser: "Accessible uniquement aux membres Élite" },
  { name: "Lodge caché, Kenya", teaser: "6 suites, 0 voisin, 360° de savane" },
  { name: "Villa troglodyte, Italie", teaser: "Creusée dans la roche, piscine à débordement" },
];

export default function Destinations() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c8a94a]/5 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] mb-6">
            <Globe className="mr-1 h-3 w-3" /> Plus de 140 destinations
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Le monde, <span className="text-[#c8a94a]">à votre mesure</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Chaque destination est une promesse. Notre IA et nos experts sélectionnent les adresses
            qui transforment un voyage en souvenir inoubliable.
          </p>
        </div>
      </section>

      {/* Par Continent */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-[#c8a94a]" size={24} />
            <h2 className="font-serif text-2xl font-bold">Par Continent</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTINENTS.map((continent) => (
              <Link key={continent.name} href={`/discover?continent=${continent.name.toLowerCase()}`}>
                <div className="group relative p-6 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 bg-white/5 hover:bg-white/8 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{continent.image}</span>
                    <span className="text-xs text-muted-foreground">{continent.count} adresses</span>
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-1">{continent.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{continent.tagline}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {continent.destinations.map((d) => (
                      <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                  <ArrowRight size={16} className="absolute top-6 right-6 text-[#c8a94a] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Par Expérience */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Compass className="text-[#c8a94a]" size={24} />
            <h2 className="font-serif text-2xl font-bold">Par Expérience</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPERIENCES.map((exp) => (
              <Link key={exp.name} href={`/discover?experience=${exp.name.toLowerCase()}`}>
                <div className="group p-5 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 bg-white/5 hover:bg-white/8 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{exp.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{exp.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{exp.count} expériences</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{exp.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tendances du Moment */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="text-[#c8a94a]" size={24} />
            <h2 className="font-serif text-2xl font-bold">Tendances du Moment</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRENDING.map((dest) => (
              <Link key={dest.name} href="/chat">
                <div className="group flex items-center gap-4 p-5 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 bg-white/5 hover:bg-white/8 transition-all cursor-pointer">
                  <MapPin className="text-[#c8a94a] shrink-0" size={20} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{dest.name}</h3>
                      <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] text-[9px] px-1.5 py-0">
                        {dest.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{dest.tagline}</p>
                  </div>
                  <ArrowRight size={16} className="text-[#c8a94a] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Secrètes */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Gem className="text-[#c8a94a]" size={24} />
            <h2 className="font-serif text-2xl font-bold">Destinations Secrètes</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg">
            Ces adresses ne figurent dans aucun guide. Elles sont réservées aux membres Premium et Élite.
          </p>
          <div className="space-y-3">
            {SECRET_DESTINATIONS.map((dest) => (
              <div key={dest.name} className="flex items-center gap-4 p-5 rounded-lg border border-white/10 bg-white/5">
                <Lock className="text-[#c8a94a]/40 shrink-0" size={18} />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{dest.name}</h3>
                  <p className="text-xs text-muted-foreground">{dest.teaser}</p>
                </div>
                <Link href="/pricing">
                  <Button size="sm" variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] text-xs rounded-none">
                    Débloquer
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center border-t border-white/5">
        <div className="max-w-lg mx-auto">
          <Star className="text-[#c8a94a] mx-auto mb-4" size={32} />
          <h2 className="font-serif text-2xl font-bold mb-3">
            Votre prochaine destination vous attend
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Dites à notre IA ce dont vous rêvez. Elle fera le reste.
          </p>
          <Link href="/chat">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8">
              Parler à mon concierge <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
