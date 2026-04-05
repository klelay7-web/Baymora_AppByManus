import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Compass, Gem, Heart, ArrowRight, Lock, MapPin, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const CONTINENTS = [
  {
    name: "Europe",
    count: 48,
    tagline: "Palais, vignobles et riviera",
    destinations: ["Paris", "Santorini", "Amalfi", "Barcelone", "Londres"],
    img: `${CDN}/paris-restaurant-eiffel_bb963598.jpg`,
    color: "from-blue-900/80",
  },
  {
    name: "Asie",
    count: 35,
    tagline: "Temples, sérénité et saveurs",
    destinations: ["Tokyo", "Bali", "Maldives", "Singapour", "Dubaï"],
    img: `${CDN}/tokyo-luxury-hotel_be1c6ef3.jpg`,
    color: "from-red-900/80",
  },
  {
    name: "Amériques",
    count: 28,
    tagline: "Grands espaces et skylines",
    destinations: ["New York", "Tulum", "Buenos Aires", "Aspen", "Rio"],
    img: `${CDN}/tropical-pool-luxury_b3d67c1a.jpg`,
    color: "from-emerald-900/80",
  },
  {
    name: "Afrique",
    count: 18,
    tagline: "Safari, désert et authenticité",
    destinations: ["Marrakech", "Cape Town", "Serengeti", "Zanzibar", "Maurice"],
    img: `${CDN}/bali-sunset-pool_3e25bda7.jpg`,
    color: "from-amber-900/80",
  },
  {
    name: "Océanie",
    count: 12,
    tagline: "Paradis et bout du monde",
    destinations: ["Sydney", "Bora Bora", "Fidji", "Nouvelle-Zélande", "Tahiti"],
    img: `${CDN}/santorini-caldera-pool_50bf8b27.jpg`,
    color: "from-cyan-900/80",
  },
];

const EXPERIENCES = [
  { name: "Gastronomie", icon: "🍽️", description: "Tables étoilées, chefs privés, wine tours", count: 120, img: `${CDN}/paris-michelin-restaurant_3a9c5f21.jpg` },
  { name: "Bien-être & Spa", icon: "💆", description: "Retraites, thermes, yoga de luxe", count: 85, img: `${CDN}/bali-sunset-pool_3e25bda7.jpg` },
  { name: "Aventure", icon: "🏔️", description: "Hélicoptère, plongée, expéditions", count: 64, img: `${CDN}/tropical-pool-luxury_b3d67c1a.jpg` },
  { name: "Culture & Art", icon: "🎭", description: "Musées privés, opéra, galeries", count: 92, img: `${CDN}/paris-restaurant-eiffel_bb963598.jpg` },
  { name: "Romance", icon: "💕", description: "Lune de miel, dîners intimes, croisières", count: 78, img: `${CDN}/santorini-sunset-luxury_82477c2d.jpg` },
  { name: "Business & Networking", icon: "💼", description: "Conférences VIP, clubs privés", count: 45, img: `${CDN}/tokyo-luxury-hotel_be1c6ef3.jpg` },
];

const TRENDING = [
  { name: "Cappadoce, Turquie", tagline: "Vol en montgolfière au lever du soleil", badge: "Tendance 2026", img: `${CDN}/santorini-suite-sunset_4226a6f6.jpg`, slug: null },
  { name: "Santorini, Grèce", tagline: "Couchers de soleil sur la caldeira", badge: "Coup de cœur", img: `${CDN}/santorini-sunset-luxury_82477c2d.jpg`, slug: "canaves-oia-santorini" },
  { name: "Tokyo, Japon", tagline: "L'élégance japonaise à son apogée", badge: "Émergent", img: `${CDN}/tokyo-luxury-hotel_be1c6ef3.jpg`, slug: "aman-tokyo" },
  { name: "Bali, Indonésie", tagline: "Sérénité et spiritualité tropicale", badge: "Aventure", img: `${CDN}/bali-sunset-pool_3e25bda7.jpg`, slug: "four-seasons-bali-sayan" },
];

const SECRET_DESTINATIONS = [
  { name: "Île privée, Grèce", teaser: "Accessible uniquement aux membres Élite" },
  { name: "Lodge caché, Kenya", teaser: "6 suites, 0 voisin, 360° de savane" },
  { name: "Villa troglodyte, Italie", teaser: "Creusée dans la roche, piscine à débordement" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function Destinations() {
  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* Back button */}
      <div className="fixed top-20 left-4 z-30">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/50 hover:text-[#c8a94a] transition-colors text-sm bg-[#080c14]/80 backdrop-blur-sm px-3 py-2 rounded-full border border-white/10">
            <ArrowLeft size={14} /> Accueil
          </button>
        </Link>
      </div>

      {/* HERO plein écran */}
      <section className="relative min-h-[70vh] flex items-end justify-start overflow-hidden">
        <img
          src={`${CDN}/santorini-suite-sunset_4226a6f6.jpg`}
          alt="Destinations de luxe"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080c14]/60 to-transparent" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32"
        >
          <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">Plus de 140 destinations</p>
          <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl mb-6 max-w-3xl leading-tight">
            Le monde,{" "}
            <em className="text-[#c8a94a] not-italic">à votre mesure</em>
          </h1>
          <p className="text-white/60 text-lg max-w-xl font-light leading-relaxed mb-8">
            Chaque destination est une promesse. Notre IA et nos experts sélectionnent
            les adresses qui transforment un voyage en souvenir inoubliable.
          </p>
          <Link href="/discover">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8 py-5 tracking-wider">
              Explorer toutes les destinations <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Par Continent — avec photos de couverture */}
      <section id="continents" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12"
          >
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">Explorez par région</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl">Par Continent</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTINENTS.map((continent, i) => (
              <motion.div
                key={continent.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/discover?continent=${continent.name.toLowerCase()}`}>
                  <div className="group relative overflow-hidden aspect-[4/3] cursor-pointer">
                    <img
                      src={continent.img}
                      alt={continent.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${continent.color} to-transparent`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-['Playfair_Display'] text-2xl font-semibold">{continent.name}</h3>
                        <span className="text-xs text-white/50 bg-black/30 px-2 py-1 rounded">{continent.count} adresses</span>
                      </div>
                      <p className="text-white/60 text-sm mb-3">{continent.tagline}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {continent.destinations.slice(0, 4).map((d) => (
                          <span key={d} className="text-[10px] px-2 py-0.5 bg-white/10 backdrop-blur-sm text-white/70 rounded-full">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-5 w-5 text-[#c8a94a]" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Par Expérience — avec photos */}
      <section id="experiences" className="py-24 px-6 bg-[#0a0f1a]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12"
          >
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">Selon vos envies</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl">Par Expérience</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPERIENCES.map((exp, i) => (
              <motion.div
                key={exp.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/discover?experience=${exp.name.toLowerCase()}`}>
                  <div className="group relative overflow-hidden aspect-[16/9] cursor-pointer">
                    <img
                      src={exp.img}
                      alt={exp.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/90 via-[#080c14]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{exp.icon}</span>
                        <h3 className="font-semibold text-base">{exp.name}</h3>
                      </div>
                      <p className="text-white/50 text-xs">{exp.description}</p>
                      <p className="text-[#c8a94a] text-xs mt-1">{exp.count} expériences</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tendances du Moment — avec photos et vrais liens */}
      <section id="tendances" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12"
          >
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">Ce que nos membres adorent</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl">Tendances du Moment</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRENDING.map((dest, i) => (
              <motion.div
                key={dest.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={dest.slug ? `/establishment/${dest.slug}` : "/discover"}>
                  <div className="group relative overflow-hidden aspect-[16/7] cursor-pointer">
                    <img
                      src={dest.img}
                      alt={dest.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#080c14]/80 via-[#080c14]/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <Badge className="bg-[#c8a94a] text-[#080c14] text-[10px] mb-3 rounded-none">{dest.badge}</Badge>
                      <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-1">{dest.name}</h3>
                      <p className="text-white/60 text-sm">{dest.tagline}</p>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                      <div className="bg-[#c8a94a] p-2">
                        <ArrowRight className="h-4 w-4 text-[#080c14]" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Secrètes */}
      <section id="secretes" className="py-24 px-6 bg-[#0a0f1a]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12"
          >
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">Réservé aux membres</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl mb-4">Destinations Secrètes</h2>
            <p className="text-white/40 max-w-lg font-light">
              Ces adresses ne figurent dans aucun guide. Elles sont réservées aux membres Premium et Élite.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SECRET_DESTINATIONS.map((dest, i) => (
              <motion.div
                key={dest.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative overflow-hidden aspect-[4/3] group"
              >
                <img
                  src={[
                    `${CDN}/santorini-caldera-pool_50bf8b27.jpg`,
                    `${CDN}/bali-sunset-pool_3e25bda7.jpg`,
                    `${CDN}/tropical-pool-luxury_b3d67c1a.jpg`,
                  ][i]}
                  alt={dest.name}
                  className="w-full h-full object-cover filter blur-sm scale-105 group-hover:blur-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-[#080c14]/70 group-hover:bg-[#080c14]/50 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <Lock className="text-[#c8a94a] mb-3" size={28} />
                  <h3 className="font-['Playfair_Display'] text-lg font-semibold mb-2">{dest.name}</h3>
                  <p className="text-white/50 text-xs mb-4">{dest.teaser}</p>
                  <Link href="/pricing">
                    <Button size="sm" className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs">
                      Débloquer l'accès
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative py-32 overflow-hidden">
        <img
          src={`${CDN}/santorini-sunset-luxury_82477c2d.jpg`}
          alt="Luxury destination"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[#080c14]/70" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Star className="text-[#c8a94a] mx-auto mb-6" size={32} />
            <h2 className="font-['Playfair_Display'] text-3xl md:text-5xl mb-6">
              Votre prochaine destination{" "}
              <em className="text-[#c8a94a] not-italic">vous attend</em>
            </h2>
            <p className="text-white/50 font-light text-lg mb-10">
              Dites à notre IA ce dont vous rêvez. Elle fera le reste.
            </p>
            <Link href="/chat">
              <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-12 py-5 tracking-wider text-base">
                Parler à mon concierge <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
