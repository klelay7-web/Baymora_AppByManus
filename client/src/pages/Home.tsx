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
  Tag,
  Bell,
  Map,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
      "Mise en pause possible (1 mois/an)",
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
      "Conciergerie par chat",
      "Mise en pause possible (2 mois/an)",
    ],
    cta: "Devenir Premium",
    accent: true,
    badge: "Le plus populaire",
  },
  {
    name: "Élite",
    price: "89,90",
    tagline: "Le privilège absolu — Bientôt disponible",
    comingSoon: true,
    features: [
      "Tout Premium inclus",
      "Recommandations proactives",
      "Accès off-market exclusif",
      "Mode Fantôme (anonymat total)",
      "Réservations anonymisées",
      "Conciergerie prioritaire 24/7",
      "Accès ventes privées & yachts",
      "Mise en pause illimitée",
    ],
    cta: "Rejoindre l'Élite",
    accent: false,
  },
];

// ─── Conversation MAYA animée ─────────────────────────────────────────────────
const MAYA_CONVERSATION = [
  { from: "maya", text: "Bonjour. Je suis MAYA, votre conciergerie personnelle.", delay: 0 },
  { from: "user", text: "J'ai envie de quelque chose d'exceptionnel ce week-end.", delay: 700 },
  { from: "maya", text: "Parfait. Vous préférez la mer, la montagne, ou une capitale ?", delay: 1400 },
  { from: "user", text: "La mer. Monaco ou Saint-Tropez.", delay: 2100 },
  { from: "maya", text: "J'ai 3 suites disponibles ce vendredi, dont une avec vue sur le port de Monaco à -28%. Je vous prépare le dossier ?", delay: 2800 },
];

// ─── Destinations phares ──────────────────────────────────────────────────────
const DESTINATIONS = [
  { name: "Monaco", tag: "Exclusif", img: HERO_IMG, offers: 4 },
  { name: "Saint-Tropez", tag: "Été", img: GASTRO_IMG, offers: 6 },
  { name: "Courchevel", tag: "Ski", img: SKI_IMG, offers: 3 },
  { name: "Bali", tag: "Retraite", img: SPA_IMG, offers: 5 },
  { name: "New York", tag: "Urbain", img: ROOFTOP_IMG, offers: 7 },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Qu'est-ce que Maison Baymora ?", a: "Maison Baymora est une conciergerie personnelle propulsée par l'IA MAYA. Elle crée des parcours voyage luxe sur-mesure, donne accès à des offres exclusives 5★ et accompagne le client tout au long de son séjour." },
  { q: "Comment fonctionne MAYA ?", a: "MAYA apprend vos préférences au fil des conversations, construit des parcours personnalisés, vous envoie des notifications pendant votre voyage et s'améliore à chaque échange." },
  { q: "Quelles destinations sont disponibles ?", a: "Monaco, Saint-Tropez, Paris, Dubai, Bali, Courchevel, New York, Los Angeles, Miami et de nombreuses autres destinations de luxe dans le monde entier." },
  { q: "Puis-je utiliser Baymora gratuitement ?", a: "Oui. Le compte gratuit donne accès aux offres avec réductions et à quelques conversations MAYA. L'abonnement premium débloque les parcours illimités et l'accompagnement complet." },
  { q: "Baymora est-il disponible sur mobile ?", a: "Oui, Baymora est entièrement optimisé pour smartphone. L'interface native mobile inclut des bottom sheets, une navigation par pilules et des notifications push." },
  { q: "Quelle est la différence entre Explorateur, Membre et Conciergerie ?", a: "Explorateur (gratuit) donne accès aux offres et 3 conversations MAYA/mois. Membre (abonnement) débloque les parcours illimités, les sélections VIP et les notifications voyage actif. Conciergerie ajoute un service humain dédié 24h/24." },
];

// ─── Composant FAQItem ────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className="text-white font-medium text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`text-white/40 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 pb-5" : "max-h-0"}`}>
        <p className="text-white/60 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [activeBundle, setActiveBundle] = useState(0);
  const [visibleBubbles, setVisibleBubbles] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const [chatInView, setChatInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setChatInView(true); },
      { threshold: 0.3 }
    );
    if (chatRef.current) observer.observe(chatRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chatInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    MAYA_CONVERSATION.forEach((msg, i) => {
      timers.push(setTimeout(() => setVisibleBubbles(i + 1), msg.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [chatInView]);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* Navigation is now handled globally by Navbar component in App.tsx */}

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
          <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/80 via-[#080c14]/50 to-[#080c14]" />
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-6">
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#c8a94a]/40 flex items-center justify-center mb-4 md:flex hidden">
              <span className="text-[#c8a94a] font-bold text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>B</span>
            </div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs font-light mb-6 hidden md:block"
          >
            Conciergerie premium &amp; voyages d'exception
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="font-['Playfair_Display'] text-2xl md:text-6xl lg:text-7xl leading-tight mb-6"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}
          >
            Nous créons les{" "}
            <em className="text-[#c8a94a] not-italic">expériences</em>
            <br />
            que vous n'imaginiez{" "}
            <em className="text-[#c8a94a] not-italic">pas encore.</em>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-white/60 text-sm md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed"
          >
            <span className="hidden md:inline">Une équipe d'experts humains, augmentée par l'intelligence artificielle. Parcours sur-mesure, accès privilégié, service d'exception.</span>
            <span className="md:hidden">Experts humains &amp; IA — voyages d'exception.</span>
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-medium rounded-xl px-10 py-6 text-base tracking-wider"
            >
              <a href={isAuthenticated ? "/chat" : getLoginUrl()}>
                <MessageCircle className="mr-2 h-5 w-5" />
                Parlez à votre assistant
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 rounded-xl px-10 py-6 text-base tracking-wider"
            >
              <a href="/discover">
                Explorer les destinations
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>

          {/* Teaser gratuit */}
          <motion.p variants={fadeUp} className="mt-6 text-white/40 text-sm hidden md:block">
            Essai gratuit — Aucune carte bancaire requise
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
              { icon: Sparkles, title: "Experts Humains", desc: "Nos conseillers terrain sélectionnent et valident chaque adresse pour vous" },
              { icon: MapPin, title: "Parcours GPS", desc: "Itinéraires jour par jour avec carte interactive en temps réel" },
              { icon: Shield, title: "Discrétion & Confidentialité", desc: "Vos données ne sont jamais revendues. Vous pouvez rester anonyme dans l'app et, sur demande, dans la vraie vie." },
              { icon: Globe, title: "Accès Mondial", desc: "Hôtels, restaurants, expériences, transports dans le monde entier" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group p-8 border border-white/5 hover:border-[#c8a94a]/30 transition-all duration-500 rounded-2xl"
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
              <Link key={i} href="/inspirations">
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
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
                    {/* Voile teaser au hover — texte lisible sur fond sombre */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#080c14]/75">
                      <div className="text-center">
                        <ArrowRight className="h-6 w-6 text-[#c8a94a] mx-auto mb-2" />
                        <p className="text-sm text-white font-medium">Voir la sélection</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              asChild
              variant="outline"
              className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 rounded-xl px-8 py-5 tracking-wider"
            >
              <a href="/discover">
                Voir toutes les inspirations
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
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
                className={`relative p-8 border transition-all duration-500 rounded-2xl ${
                  plan.accent
                    ? "border-[#c8a94a]/50 bg-[#c8a94a]/5"
                    : (plan as any).comingSoon
                    ? "border-white/5 opacity-60"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#c8a94a] text-[#080c14] text-[10px] tracking-[0.15em] uppercase font-semibold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {(plan as any).comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded-full">
                      En cours de création
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

                <Button
                  asChild
                  disabled={(plan as any).comingSoon}
                  className={`w-full rounded-xl py-5 tracking-wider ${
                    plan.accent
                      ? "bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a]"
                      : (plan as any).comingSoon
                      ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <a href={(plan as any).comingSoon ? "#" : (isAuthenticated ? "/pricing" : getLoginUrl())}>
                    {(plan as any).comingSoon ? "Bientôt disponible" : plan.cta}
                  </a>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Crédits one-shot */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center p-8 border border-white/5 rounded-2xl"
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
                <div key={i} className="px-5 py-3 border border-white/10 hover:border-[#c8a94a]/30 transition-colors cursor-pointer rounded-xl">
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
              <div className="flex gap-3 mt-6">
                <Link href="/ambassadeur-info">
                  <button className="bg-[#c8a94a] text-black font-semibold px-6 py-2.5 text-sm hover:bg-[#d4b85c] transition-colors">
                    En savoir plus
                  </button>
                </Link>
                <Link href="/ambassadeur">
                  <button className="border border-white/20 text-white/70 px-6 py-2.5 text-sm hover:border-white/40 transition-colors">
                    Mon dashboard
                  </button>
                </Link>
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
              {["Hôtellerie", "Gastronomie", "Transport", "Yachts", "Immobilier", "Bien-être", "Mode", "Événementiel", "Conciergerie", "Social Clubs", "Mariages & VIP", "Expériences"].map(
                (cat) => (
                  <span key={cat} className="px-4 py-2 border border-white/10 hover:border-[#c8a94a]/30 hover:text-[#c8a94a] transition-colors cursor-default rounded-full">
                    {cat}
                  </span>
                )
              )}
            </motion.div>
            <motion.div variants={fadeUp} className="mt-10">
              <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-xl px-10 py-5 tracking-wider">
                Devenir partenaire
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

          {/* ═════════════════════════════════════════════
          CHAT MAYA ANIMÉ — Scroll conversationnel
      ═════════════════════════════════════════════ */}
      <section id="comment-ca-marche" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">Comment ça marche</motion.p>
              <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-5xl mb-6">
                Une conversation.<br />
                <em className="text-[#c8a94a] not-italic">Un parcours complet.</em>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-white/50 text-lg leading-relaxed mb-8 font-light">
                Dites à MAYA ce que vous ressentez, pas ce que vous cherchez. Elle s'occupe du reste — sélection, réservation, accompagnement.
              </motion.p>
              <motion.div variants={fadeUp} className="space-y-4 mb-8">
                {[
                  { step: "1", text: "Décrivez votre envie en quelques mots" },
                  { step: "2", text: "MAYA construit un parcours sur-mesure" },
                  { step: "3", text: "Activez et voyagez — MAYA vous guide en temps réel" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#c8a94a]/15 border border-[#c8a94a]/30 text-[#c8a94a] text-sm font-bold flex items-center justify-center flex-shrink-0">{step}</div>
                    <span className="text-white/70 text-base">{text}</span>
                  </div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp}>
                <Button asChild className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-xl px-8 py-5">
                  <a href={isAuthenticated ? "/chat" : getLoginUrl()}>
                    <MessageCircle className="mr-2 h-5 w-5" /> Essayer maintenant
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            {/* Chat simulé animé */}
            <div ref={chatRef} className="relative">
              <div className="bg-[#0e0e16] rounded-3xl border border-white/8 overflow-hidden shadow-2xl shadow-black/60">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-[#111118]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c8a94a] to-[#a07840] flex items-center justify-center">
                    <Sparkles size={16} className="text-[#080c14]" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">MAYA</div>
                    <div className="flex items-center gap-1.5 text-green-400 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> En ligne
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4 min-h-[280px]">
                  {MAYA_CONVERSATION.map((msg, i) => {
                    const isMAYA = msg.from === "maya";
                    return (
                      <div key={i} className={`flex items-end gap-3 transition-all duration-700 ${i < visibleBubbles ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${isMAYA ? "justify-start" : "justify-end"}`}>
                        {isMAYA && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c8a94a] to-[#a07840] flex items-center justify-center flex-shrink-0 mb-1">
                            <Sparkles size={12} className="text-[#080c14]" />
                          </div>
                        )}
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isMAYA ? "bg-[#1a1a24] text-white rounded-bl-sm border border-white/8" : "bg-[#c8a94a] text-[#080c14] font-medium rounded-br-sm"
                        }`}>{msg.text}</div>
                      </div>
                    );
                  })}
                  {visibleBubbles > 0 && visibleBubbles < MAYA_CONVERSATION.length && (
                    <div className="flex items-center gap-2 text-white/30 text-xs">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#c8a94a]/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                      </div>
                      MAYA rédige…
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-3 bg-[#1a1a24] rounded-2xl px-4 py-3 border border-white/8">
                    <span className="text-white/20 text-sm flex-1">Écrivez à MAYA…</span>
                    <div className="w-7 h-7 rounded-full bg-[#c8a94a] flex items-center justify-center">
                      <ArrowRight size={13} className="text-[#080c14]" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#7c6af7] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">IA Personnelle</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          DESTINATIONS — Scroll horizontal style Spotify
      ═════════════════════════════════════════════ */}
      <section id="destinations" className="py-16 overflow-hidden">
        <div className="px-6 md:px-12 mb-8 flex items-end justify-between max-w-7xl mx-auto">
          <div>
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-2">Destinations</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl">Les plus prisées en ce moment</h2>
          </div>
          <Link href="/offres" className="hidden md:flex items-center gap-2 text-white/40 text-sm hover:text-white transition-colors">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 md:px-12 pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {DESTINATIONS.map((dest) => (
            <Link key={dest.name} href="/offres" className="flex-shrink-0 w-48 md:w-60 snap-start group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3">
                <img src={dest.img} alt={dest.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 bg-white/15 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full border border-white/20">{dest.tag}</div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-white font-bold text-lg">{dest.name}</div>
                  <div className="text-white/60 text-xs">{dest.offers} offres disponibles</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          OFFRES FLASH — Point d'entrée 2
      ═════════════════════════════════════════════ */}
      <section id="offres-flash" className="py-16 bg-[#0a0f1a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-widest mb-2">
                <Zap size={12} /> Offres Flash
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl">Jusqu'à <span className="text-[#c8a94a]">-35%</span> cette semaine</h2>
            </div>
            <Link href="/offres" className="hidden md:flex items-center gap-2 text-white/40 text-sm hover:text-white transition-colors">
              Toutes les offres <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: "Hôtel de Paris", loc: "Monaco", price: "980€", original: "1 400€", pct: 30, img: HERO_IMG, tag: "Hôtellerie" },
              { title: "Villa Karma Kandara", loc: "Bali, Ubud", price: "840€", original: "1 200€", pct: 30, img: SPA_IMG, tag: "Villa" },
              { title: "Dîner Gastronomique", loc: "Paris, 8e", price: "280€", original: "420€", pct: 33, img: GASTRO_IMG, tag: "Gastronomie" },
            ].map((offer) => (
              <Link key={offer.title} href="/offres" className="group relative bg-[#111118] rounded-2xl overflow-hidden border border-white/6 hover:border-[#c8a94a]/30 transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="relative aspect-video overflow-hidden">
                  <img src={offer.img} alt={offer.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-[#c8a94a] text-[#080c14] text-xs font-bold px-2.5 py-1 rounded-full">-{offer.pct}%</span>
                    <span className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">{offer.tag}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-white/40 text-xs mb-1"><MapPin size={10} /> {offer.loc}</div>
                  <h3 className="text-white font-semibold text-base mb-2">{offer.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#c8a94a] font-bold text-lg">{offer.price}</span>
                    <span className="text-white/30 text-xs">/nuit</span>
                    <span className="text-white/30 text-xs line-through ml-1">{offer.original}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 rounded-xl px-8 py-5">
              <Link href="/offres">Voir toutes les offres <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          FAQ — Ancres SEO + Google Featured Snippets
      ═════════════════════════════════════════════ */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">FAQ</motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-3xl md:text-4xl">Questions fréquentes</motion.h2>
          </motion.div>
          <div className="bg-[#0e0e16] rounded-2xl border border-white/6 px-6 divide-y divide-white/8">
            {FAQ_ITEMS.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          CTA FINAL
      ═════════════════════════════════════════════ */}
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
              <Button
                asChild
                size="lg"
                className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-xl px-12 py-6 text-base tracking-wider"
              >
                <a href={isAuthenticated ? "/chat" : getLoginUrl()}>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Parlez à votre assistant
                </a>
              </Button>
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
                <li><Link href="/ambassadeur" className="hover:text-white/60 transition-colors">Programme Ambassadeur</Link></li>
                <li><Link href="/#b2b" className="hover:text-white/60 transition-colors">Prestataires</Link></li>
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
