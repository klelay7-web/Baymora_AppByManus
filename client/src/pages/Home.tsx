import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  MessageCircle,
  MapPin,
  Star,
  Shield,
  Sparkles,
  Crown,
  Globe,
  ChevronRight,
  ArrowRight,
  Check,
  Zap,
  Eye,
  Lock,
  Users,
} from "lucide-react";
import { useState } from "react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const HERO_IMG = `${CDN}/hero_yacht_sunset_b173a771.jpg`;
const GASTRO_IMG = `${CDN}/gastro_dinner_436a006a.jpg`;
const SKI_IMG = `${CDN}/ski_luxury_8603a635.jpg`;
const ROOFTOP_IMG = `${CDN}/rooftop_nyc_c0d713d4.jpg`;
const SPA_IMG = `${CDN}/spa_palace_30cfe2c9.jpg`;
const LOGO = `${CDN}/baymora_logo_1c0fc185.png`;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
} as const;

// ─── Bundles SEO (Top X) ─────────────────────────────
const bundles = [
  { title: "10 tables secrètes", subtitle: "Paris, France", img: GASTRO_IMG, tag: "Gastronomie" },
  { title: "5 rooftops d'exception", subtitle: "New York, USA", img: ROOFTOP_IMG, tag: "Nightlife" },
  { title: "7 chalets d'altitude", subtitle: "Alpes, Suisse", img: SKI_IMG, tag: "Montagne" },
  { title: "Les spas les plus exclusifs", subtitle: "Bali, Indonésie", img: SPA_IMG, tag: "Bien-être" },
];

// ─── Forfaits ────────────────────────────────────────
const plans = [
  {
    name: "Explorer",
    price: "9,90",
    tagline: "Découvrez le luxe accessible",
    features: [
      "20 messages assistant IA / mois",
      "Accès aux fiches & bundles publics",
      "Offres exclusives premier prix",
      "Sauvegarde de 5 favoris",
      "1 parcours par mois",
    ],
    cta: "Commencer l'aventure",
    accent: false,
  },
  {
    name: "Premium",
    price: "29,90",
    tagline: "L'expérience complète",
    features: [
      "Messages illimités",
      "Parcours personnalisés avec carte GPS",
      "Fiches détaillées & secrets d'initiés",
      "Mémoire client & profil enrichi",
      "Favoris & collections illimités",
      "Accès programme ambassadeur",
    ],
    cta: "Devenir Premium",
    accent: true,
    badge: "Le plus populaire",
  },
  {
    name: "Élite",
    price: "89,90",
    tagline: "Le privilège absolu",
    features: [
      "Tout Premium inclus",
      "Recommandations proactives",
      "Accès off-market exclusif",
      "Mode Fantôme (anonymat total)",
      "Réservations anonymisées",
      "Conciergerie prioritaire 24/7",
      "Accès ventes privées & yachts",
    ],
    cta: "Rejoindre l'Élite",
    accent: false,
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [activeBundle, setActiveBundle] = useState(0);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={LOGO} alt="Maison Baymora" className="h-10 w-10 rounded-full object-contain" />
            <span className="font-['Playfair_Display'] text-lg tracking-wide text-[#c8a94a]">
              Maison Baymora
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-light tracking-wider">
            <Link href="/discover" className="text-white/60 hover:text-[#c8a94a] transition-colors">
              Explorer
            </Link>
            <Link href="/pricing" className="text-white/60 hover:text-[#c8a94a] transition-colors">
              Forfaits
            </Link>
            <a href="#bundles" className="text-white/60 hover:text-[#c8a94a] transition-colors">
              Inspirations
            </a>
            {isAuthenticated ? (
              <Link href="/chat">
                <Button size="sm" className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-medium rounded-none px-6">
                  Mon Assistant
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-medium rounded-none px-6">
                  Accéder
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO — Plein écran cinématographique
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Luxury yacht at sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/70 via-[#080c14]/40 to-[#080c14]" />
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-6">
            <img src={LOGO} alt="Maison Baymora" className="h-20 w-20 mx-auto rounded-full mb-6" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs font-light mb-6"
          >
            Votre assistant personnel premium
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="font-['Playfair_Display'] text-4xl md:text-6xl lg:text-7xl leading-tight mb-8"
          >
            Nous créons les{" "}
            <em className="text-[#c8a94a] not-italic">expériences</em>
            <br />
            que vous n'imaginiez{" "}
            <em className="text-[#c8a94a] not-italic">pas encore.</em>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed"
          >
            Intelligence artificielle, parcours sur-mesure, accès privilégié.
            Maison Baymora anticipe vos désirs et vous connecte au meilleur du monde.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={isAuthenticated ? "/chat" : ""}>
              <a href={isAuthenticated ? undefined : getLoginUrl()}>
                <Button
                  size="lg"
                  className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-medium rounded-none px-10 py-6 text-base tracking-wider"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Parlez à votre assistant
                </Button>
              </a>
            </Link>
            <Link href="/discover">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 rounded-none px-10 py-6 text-base tracking-wider"
              >
                Explorer les destinations
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Teaser gratuit */}
          <motion.p variants={fadeUp} className="mt-6 text-white/40 text-sm">
            3 messages gratuits — Aucune carte bancaire requise
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-[#c8a94a] to-transparent" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROPOSITION DE VALEUR — Ce que Baymora fait pour vous
      ═══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">
              L'art de l'excellence
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl mb-6">
              Un assistant qui vous <em className="text-[#c8a94a] not-italic">connaît</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto text-lg font-light">
              Maison Baymora mémorise vos préférences, celles de vos proches,
              et anticipe vos besoins avant même que vous ne les exprimiez.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Sparkles, title: "IA Proactive", desc: "Recommandations personnalisées avant même votre demande" },
              { icon: MapPin, title: "Parcours GPS", desc: "Itinéraires jour par jour avec carte interactive en temps réel" },
              { icon: Shield, title: "Anonymat Total", desc: "Mode Fantôme : réservations sous pseudonyme, discrétion absolue" },
              { icon: Globe, title: "Accès Mondial", desc: "Hôtels, restaurants, expériences, transports dans le monde entier" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group p-8 border border-white/5 hover:border-[#c8a94a]/30 transition-all duration-500"
              >
                <item.icon className="h-8 w-8 text-[#c8a94a] mb-6" />
                <h3 className="font-['Playfair_Display'] text-xl mb-3">{item.title}</h3>
                <p className="text-white/40 text-sm font-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          EXPÉRIENCES — Galerie immersive style Quintessentially
      ═══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#0a0f1a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">
              Des expériences légendaires
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl">
              Chaque moment devient <em className="text-[#c8a94a] not-italic">inoubliable</em>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { img: GASTRO_IMG, title: "Gastronomie d'exception", desc: "Tables étoilées, chefs privés, dîners secrets" },
              { img: SKI_IMG, title: "Évasions alpines", desc: "Chalets privés, ski hors-piste, après-ski exclusif" },
              { img: ROOFTOP_IMG, title: "Nuits légendaires", desc: "Rooftops, clubs privés, événements sur invitation" },
              { img: SPA_IMG, title: "Bien-être absolu", desc: "Spas de palace, retraites privées, soins sur-mesure" },
            ].map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative group overflow-hidden aspect-[4/3] cursor-pointer"
              >
                <img
                  src={exp.img}
                  alt={exp.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="font-['Playfair_Display'] text-2xl mb-2">{exp.title}</h3>
                  <p className="text-white/50 text-sm font-light">{exp.desc}</p>
                </div>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-6 w-6 text-[#c8a94a]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          BUNDLES SEO — Inspirations (portes d'entrée)
      ═══════════════════════════════════════════════ */}
      <section id="bundles" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">
              Nos sélections exclusives
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl mb-6">
              Laissez-vous <em className="text-[#c8a94a] not-italic">inspirer</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-xl mx-auto font-light">
              Des sélections curatées par notre intelligence artificielle,
              enrichies chaque jour par nos agents experts.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundles.map((bundle, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setActiveBundle(i)}
              >
                <div className="relative overflow-hidden aspect-[3/4] mb-4">
                  <img
                    src={bundle.img}
                    alt={bundle.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/90 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a] bg-[#080c14]/60 backdrop-blur-sm px-3 py-1">
                      {bundle.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-['Playfair_Display'] text-xl mb-1">{bundle.title}</h3>
                    <p className="text-white/40 text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {bundle.subtitle}
                    </p>
                  </div>
                  {/* Voile teaser */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#080c14]/60 backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="h-6 w-6 text-[#c8a94a] mx-auto mb-2" />
                      <p className="text-sm text-white/80">Découvrir la sélection</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/discover">
              <Button
                variant="outline"
                className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 rounded-none px-8 py-5 tracking-wider"
              >
                Voir toutes les inspirations
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          COMMENT ÇA MARCHE — En 4 étapes
      ═══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#0a0f1a]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">
              Simple & élégant
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl">
              Comment ça <em className="text-[#c8a94a] not-italic">fonctionne</em>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { step: "01", title: "Parlez", desc: "Dites à votre assistant ce dont vous rêvez. Il vous connaît déjà." },
              { step: "02", title: "Explorez", desc: "Recevez plusieurs scénarios adaptés à votre budget et vos envies." },
              { step: "03", title: "Visualisez", desc: "Votre parcours s'affiche sur la carte. Jour par jour, étape par étape." },
              { step: "04", title: "Vivez", desc: "Partez l'esprit libre. Tout est organisé, du départ au retour." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <span className="font-['Playfair_Display'] text-5xl text-[#c8a94a]/20 block mb-4">
                  {item.step}
                </span>
                <h3 className="font-['Playfair_Display'] text-xl mb-3">{item.title}</h3>
                <p className="text-white/40 text-sm font-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FORFAITS — Les 3 plans
      ═══════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">
              Choisissez votre expérience
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl mb-6">
              Des forfaits pensés pour <em className="text-[#c8a94a] not-italic">chaque ambition</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-xl mx-auto font-light">
              Du luxe accessible aux privilèges absolus. Achetez aussi des crédits à l'unité
              pour débloquer ponctuellement des fonctionnalités premium.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative p-8 border transition-all duration-500 ${
                  plan.accent
                    ? "border-[#c8a94a]/50 bg-[#c8a94a]/5"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#c8a94a] text-[#080c14] text-[10px] tracking-[0.15em] uppercase font-semibold px-4 py-1">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="font-['Playfair_Display'] text-2xl mb-2">{plan.name}</h3>
                  <p className="text-white/40 text-sm font-light mb-4">{plan.tagline}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-['Playfair_Display'] text-4xl text-[#c8a94a]">{plan.price}€</span>
                    <span className="text-white/30 text-sm">/mois</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-white/60">
                      <Check className="h-4 w-4 text-[#c8a94a] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a href={isAuthenticated ? "/pricing" : getLoginUrl()}>
                  <Button
                    className={`w-full rounded-none py-5 tracking-wider ${
                      plan.accent
                        ? "bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a]"
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>

          {/* Crédits one-shot */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center p-8 border border-white/5"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-[#c8a94a]" />
              <h3 className="font-['Playfair_Display'] text-xl">Crédits à la carte</h3>
            </div>
            <p className="text-white/40 text-sm font-light max-w-lg mx-auto mb-4">
              Besoin ponctuel d'une fonctionnalité premium ? Achetez des crédits sans engagement.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {[
                { credits: "10", price: "2,99€" },
                { credits: "50", price: "12,99€" },
                { credits: "150", price: "29,99€" },
                { credits: "500", price: "79,99€" },
              ].map((pack, i) => (
                <div key={i} className="px-5 py-3 border border-white/10 hover:border-[#c8a94a]/30 transition-colors cursor-pointer">
                  <span className="text-[#c8a94a] font-medium">{pack.credits}</span>
                  <span className="text-white/40 ml-1">crédits</span>
                  <span className="text-white/60 ml-2">{pack.price}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROGRAMME AMBASSADEUR
      ═══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#0a0f1a]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeUp}>
              <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">
                Programme ambassadeur
              </p>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl mb-6">
                Partagez l'excellence,{" "}
                <em className="text-[#c8a94a] not-italic">récoltez les fruits</em>
              </h2>
              <p className="text-white/50 font-light leading-relaxed mb-8">
                Partagez vos parcours, invitez vos proches, et gagnez des commissions
                sur chaque abonnement et chaque réservation générée grâce à vous.
                Jusqu'à 22% de commissions récurrentes.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Users, text: "Parrainez et gagnez 15% sur chaque abonnement" },
                  { icon: Crown, text: "Commissions de niveau 2 sur les affiliations" },
                  { icon: Star, text: "Créez et partagez vos parcours vérifiés" },
                  { icon: Eye, text: "Publiez votre contenu (vidéos, photos, avis)" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <item.icon className="h-5 w-5 text-[#c8a94a] shrink-0" />
                    <span className="text-white/60 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={ROOFTOP_IMG}
                  alt="Ambassador lifestyle"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-[#080c14]/80 backdrop-blur-xl border border-white/10">
                <p className="text-[#c8a94a] font-['Playfair_Display'] text-2xl mb-1">Jusqu'à 22%</p>
                <p className="text-white/40 text-sm">de commissions récurrentes</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRESTATAIRES B2B
      ═══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">
              Vous êtes prestataire ?
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl mb-6">
              Recevez des clients <em className="text-[#c8a94a] not-italic">qualifiés</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto font-light mb-10 leading-relaxed">
              Hôtels, restaurants, agences, artisans du luxe : rejoignez notre réseau.
              Zéro frais d'inscription, commission uniquement sur les réservations confirmées.
              Nos clients arrivent informés, décidés, prêts à réserver.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 text-sm text-white/30">
              {["Hôtellerie", "Gastronomie", "Transport", "Yachts", "Immobilier", "Bien-être", "Mode", "Événementiel", "Expériences"].map(
                (cat) => (
                  <span key={cat} className="px-4 py-2 border border-white/10 hover:border-[#c8a94a]/30 hover:text-[#c8a94a] transition-colors cursor-default">
                    {cat}
                  </span>
                )
              )}
            </motion.div>
            <motion.div variants={fadeUp} className="mt-10">
              <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-10 py-5 tracking-wider">
                Devenir partenaire
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={SPA_IMG} alt="Luxury spa" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-[#080c14]/80" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl mb-6">
              Votre prochaine expérience{" "}
              <em className="text-[#c8a94a] not-italic">commence ici</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 font-light text-lg mb-10">
              Rejoignez Maison Baymora et découvrez ce que l'intelligence artificielle
              peut faire pour sublimer chaque instant de votre vie.
            </motion.p>
            <motion.div variants={fadeUp}>
              <a href={isAuthenticated ? "/chat" : getLoginUrl()}>
                <Button
                  size="lg"
                  className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-12 py-6 text-base tracking-wider"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Parlez à votre assistant
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={LOGO} alt="Maison Baymora" className="h-8 w-8 rounded-full object-contain" />
                <span className="font-['Playfair_Display'] text-[#c8a94a]">Maison Baymora</span>
              </div>
              <p className="text-white/30 text-sm font-light leading-relaxed">
                Votre assistant personnel premium,
                propulsé par l'intelligence artificielle.
              </p>
            </div>
            <div>
              <h4 className="text-[#c8a94a] text-xs tracking-[0.2em] uppercase mb-4">Explorer</h4>
              <ul className="space-y-2 text-sm text-white/30">
                <li><Link href="/discover" className="hover:text-white/60 transition-colors">Destinations</Link></li>
                <li><Link href="/discover" className="hover:text-white/60 transition-colors">Expériences</Link></li>
                <li><Link href="/discover" className="hover:text-white/60 transition-colors">Bundles</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#c8a94a] text-xs tracking-[0.2em] uppercase mb-4">Maison Baymora</h4>
              <ul className="space-y-2 text-sm text-white/30">
                <li><Link href="/pricing" className="hover:text-white/60 transition-colors">Forfaits</Link></li>
                <li><a href="#" className="hover:text-white/60 transition-colors">Programme Ambassadeur</a></li>
                <li><a href="#" className="hover:text-white/60 transition-colors">Prestataires</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#c8a94a] text-xs tracking-[0.2em] uppercase mb-4">Suivez-nous</h4>
              <ul className="space-y-2 text-sm text-white/30">
                <li><a href="#" className="hover:text-white/60 transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white/60 transition-colors">TikTok</a></li>
                <li><a href="#" className="hover:text-white/60 transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/20 text-xs">
              &copy; {new Date().getFullYear()} Maison Baymora. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-white/20 text-xs">
              <a href="#" className="hover:text-white/40 transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-white/40 transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-white/40 transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
