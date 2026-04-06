import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  MessageCircle,
  MapPin,
  Sparkles,
  Crown,
  ChevronRight,
  ArrowRight,
  Check,
  Star,
  Globe,
  Shield,
  Lock,
  Users,
  Zap,
  Eye,
} from "lucide-react";
import { useState, useRef } from "react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const HERO_IMG = `${CDN}/hero_yacht_sunset_b173a771.jpg`;
const GASTRO_IMG = `${CDN}/gastro_dinner_436a006a.jpg`;
const SKI_IMG = `${CDN}/ski_luxury_8603a635.jpg`;
const ROOFTOP_IMG = `${CDN}/rooftop_nyc_c0d713d4.jpg`;
const SPA_IMG = `${CDN}/spa_palace_30cfe2c9.jpg`;
const LOGO = `${CDN}/baymora_logo_1c0fc185.png`;

/* ─── Data ──────────────────────────────────────────── */

const trendingCards = [
  { title: "Tables secrètes", subtitle: "Paris", img: GASTRO_IMG, tag: "Gastronomie", count: 10 },
  { title: "Rooftops d'exception", subtitle: "New York", img: ROOFTOP_IMG, tag: "Nightlife", count: 5 },
  { title: "Chalets d'altitude", subtitle: "Alpes", img: SKI_IMG, tag: "Montagne", count: 7 },
  { title: "Spas exclusifs", subtitle: "Bali", img: SPA_IMG, tag: "Bien-être", count: 12 },
];

const destinations = [
  { name: "Paris", country: "France", img: GASTRO_IMG, experiences: 42 },
  { name: "New York", country: "USA", img: ROOFTOP_IMG, experiences: 38 },
  { name: "Alpes", country: "Suisse", img: SKI_IMG, experiences: 25 },
  { name: "Bali", country: "Indonésie", img: SPA_IMG, experiences: 31 },
];

const categories = [
  { label: "Tout", active: true },
  { label: "Destinations" },
  { label: "Bundles" },
  { label: "Parcours" },
  { label: "Expériences" },
];

const plans = [
  {
    name: "Explorer",
    price: "9,90",
    tagline: "Luxe accessible",
    features: ["20 messages IA/mois", "Fiches & bundles publics", "5 favoris", "1 parcours/mois"],
    cta: "Commencer",
    accent: false,
  },
  {
    name: "Premium",
    price: "29,90",
    tagline: "L'expérience complète",
    features: ["Messages illimités", "Parcours GPS", "Mémoire client", "Collections illimitées"],
    cta: "Devenir Premium",
    accent: true,
    badge: "Populaire",
  },
  {
    name: "Élite",
    price: "89,90",
    tagline: "Privilège absolu",
    features: ["Tout Premium", "Off-market", "Mode Fantôme", "Conciergerie 24/7"],
    cta: "Bientôt",
    accent: false,
    comingSoon: true,
  },
];

/* ─── Horizontal Scroll Section ─────────────────────── */

function HScrollSection({
  title,
  subtitle,
  children,
  seeAllHref,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  seeAllHref?: string;
}) {
  return (
    <section className="py-6 md:py-10">
      <div className="px-4 md:px-6 flex items-end justify-between mb-4">
        <div>
          <h2 className="font-['Playfair_Display'] text-lg md:text-xl text-white/90">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-white/35 mt-0.5">{subtitle}</p>
          )}
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-[11px] text-[#c8a94a]/70 hover:text-[#c8a94a] flex items-center gap-1 transition-colors"
          >
            Voir tout
            <ChevronRight size={12} />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-2 snap-x snap-mandatory">
        {children}
      </div>
    </section>
  );
}

/* ─── Card Components ───────────────────────────────── */

function TrendingCard({
  card,
}: {
  card: (typeof trendingCards)[0];
}) {
  return (
    <Link href="/discover" className="snap-start flex-shrink-0">
      <div className="w-[260px] md:w-[300px] group relative overflow-hidden">
        <div className="aspect-[4/5] relative">
          <img
            src={card.img}
            alt={card.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Tag */}
          <div className="absolute top-3 left-3">
            <span className="text-[9px] tracking-[0.15em] uppercase bg-[#c8a94a]/90 text-[#080c14] px-2 py-1 font-semibold">
              {card.tag}
            </span>
          </div>
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[10px] text-[#c8a94a]/80 font-medium tracking-wider uppercase mb-1">
              Top {card.count}
            </p>
            <h3 className="font-['Playfair_Display'] text-base text-white leading-tight">
              {card.title}
            </h3>
            <p className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
              <MapPin size={10} />
              {card.subtitle}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DestinationCard({ dest }: { dest: (typeof destinations)[0] }) {
  return (
    <Link href="/destinations" className="snap-start flex-shrink-0">
      <div className="w-[160px] md:w-[200px] group">
        <div className="aspect-square relative overflow-hidden">
          <img
            src={dest.img}
            alt={dest.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-sm font-medium text-white">{dest.name}</h3>
            <p className="text-[10px] text-white/50">{dest.country}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <Star size={10} className="text-[#c8a94a]" />
          <span className="text-[10px] text-white/40">
            {dest.experiences} expériences
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Home Component ───────────────────────────── */

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* ═══════════════════════════════════════════════
          HERO — Compact mobile, full desktop
      ═══════════════════════════════════════════════ */}
      <section className="relative">
        {/* Mobile hero — compact */}
        <div className="md:hidden relative h-[55vh] min-h-[380px]">
          <img
            src={HERO_IMG}
            alt="Luxury yacht at sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-8">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/70 mb-2">
              Votre assistant premium
            </p>
            <h1 className="font-['Playfair_Display'] text-2xl leading-tight text-white/95">
              Les expériences que vous n'imaginiez{" "}
              <span className="text-[#c8a94a] italic">pas encore.</span>
            </h1>
            <p className="text-xs text-white/40 mt-3 leading-relaxed max-w-[280px]">
              IA, parcours sur-mesure, accès privilégié. Baymora anticipe vos désirs.
            </p>
            <div className="flex gap-3 mt-5">
              <Link href={isAuthenticated ? "/chat" : getLoginUrl()}>
                <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-5 py-4 text-[11px] tracking-wider uppercase font-semibold">
                  <Sparkles size={14} className="mr-1.5" />
                  Parler à ARIA
                </Button>
              </Link>
              <Link href="/discover">
                <Button
                  variant="outline"
                  className="border-white/15 text-white/60 hover:text-[#c8a94a] hover:border-[#c8a94a]/30 rounded-none px-5 py-4 text-[11px] tracking-wider uppercase bg-transparent"
                >
                  Explorer
                  <ArrowRight size={12} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop hero — full cinematic */}
        <div className="hidden md:block relative min-h-screen">
          <img
            src={HERO_IMG}
            alt="Luxury yacht at sunset"
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/30 to-[#080c14]/10" />
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
            <img
              src={LOGO}
              alt="Baymora"
              className="w-24 h-24 object-contain mb-6 opacity-80"
            />
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#c8a94a]/60 mb-4">
              Votre assistant personnel premium
            </p>
            <h1 className="font-['Playfair_Display'] text-5xl lg:text-6xl leading-tight max-w-3xl">
              Nous créons les{" "}
              <span className="text-[#c8a94a] italic">expériences</span>
              <br />
              que vous n'imaginiez{" "}
              <span className="text-[#c8a94a] italic">pas encore.</span>
            </h1>
            <p className="text-sm text-white/50 mt-6 max-w-lg leading-relaxed">
              Intelligence artificielle, parcours sur-mesure, accès privilégié.
              Maison Baymora anticipe vos désirs et vous connecte au meilleur du monde.
            </p>
            <div className="flex gap-4 mt-8">
              <Link href={isAuthenticated ? "/chat" : getLoginUrl()}>
                <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8 py-5 text-sm tracking-wider uppercase font-medium">
                  <MessageCircle size={16} className="mr-2" />
                  Parlez à votre assistant
                </Button>
              </Link>
              <Link href="/discover">
                <Button
                  variant="outline"
                  className="border-white/15 text-white/60 hover:text-[#c8a94a] hover:border-[#c8a94a]/30 rounded-none px-8 py-5 text-sm tracking-wider uppercase bg-transparent"
                >
                  Explorer les destinations
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-white/25 mt-4">
              3 messages gratuits — Aucune carte bancaire requise
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FILTER PILLS — Mobile only (Spotify-style)
      ═══════════════════════════════════════════════ */}
      <div className="md:hidden sticky top-14 z-40 bg-[#080c14]/95 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
          {categories.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveFilter(i)}
              className={`whitespace-nowrap px-4 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-200 flex-shrink-0 ${
                activeFilter === i
                  ? "bg-[#c8a94a] text-[#080c14]"
                  : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          GREETING — Personalized (authenticated)
      ═══════════════════════════════════════════════ */}
      {isAuthenticated && (
        <div className="px-4 md:px-6 pt-6 md:pt-10">
          <p className="text-[11px] text-[#c8a94a]/50 tracking-wider uppercase">
            Bienvenue
          </p>
          <h2 className="font-['Playfair_Display'] text-lg text-white/90 mt-1">
            {getGreeting()}, {user?.name?.split(" ")[0] || "voyageur"}
          </h2>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          QUICK ACTIONS — Mobile cards
      ═══════════════════════════════════════════════ */}
      <div className="md:hidden px-4 pt-5 grid grid-cols-2 gap-3">
        <Link href={isAuthenticated ? "/chat" : getLoginUrl()}>
          <div className="p-4 bg-[#c8a94a]/[0.08] border border-[#c8a94a]/15 group">
            <Sparkles size={18} className="text-[#c8a94a] mb-2" />
            <p className="text-xs text-white/80 font-medium">Parler à ARIA</p>
            <p className="text-[10px] text-white/30 mt-0.5">Votre assistant IA</p>
          </div>
        </Link>
        <Link href="/discover">
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] group">
            <Globe size={18} className="text-white/40 mb-2" />
            <p className="text-xs text-white/80 font-medium">Explorer</p>
            <p className="text-[10px] text-white/30 mt-0.5">Destinations & fiches</p>
          </div>
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════
          TRENDING — Horizontal scroll
      ═══════════════════════════════════════════════ */}
      <HScrollSection
        title="Tendances"
        subtitle="Les sélections du moment"
        seeAllHref="/inspirations"
      >
        {trendingCards.map((card) => (
          <TrendingCard key={card.title} card={card} />
        ))}
      </HScrollSection>

      {/* ═══════════════════════════════════════════════
          DESTINATIONS — Square cards horizontal
      ═══════════════════════════════════════════════ */}
      <HScrollSection
        title="Destinations"
        subtitle="Explorez le monde"
        seeAllHref="/destinations"
      >
        {destinations.map((dest) => (
          <DestinationCard key={dest.name} dest={dest} />
        ))}
      </HScrollSection>

      {/* ═══════════════════════════════════════════════
          VALUE PROPOSITION — Features grid
      ═══════════════════════════════════════════════ */}
      <section className="py-8 md:py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/50 mb-2">
            L'art de l'excellence
          </p>
          <h2 className="font-['Playfair_Display'] text-xl md:text-3xl text-white/90 mb-8">
            Un assistant qui vous <span className="text-[#c8a94a] italic">connaît</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Sparkles, title: "IA Proactive", desc: "Recommandations avant votre demande" },
              { icon: MapPin, title: "Parcours GPS", desc: "Itinéraires jour par jour" },
              { icon: Shield, title: "Discrétion", desc: "Anonymat total sur demande" },
              { icon: Globe, title: "Accès Mondial", desc: "Hôtels, restaurants, expériences" },
            ].map((feat) => (
              <div key={feat.title} className="p-4 md:p-6 bg-white/[0.02] border border-white/[0.05]">
                <feat.icon size={20} className="text-[#c8a94a]/60 mb-3" />
                <h3 className="text-xs md:text-sm font-medium text-white/80 mb-1">
                  {feat.title}
                </h3>
                <p className="text-[10px] md:text-xs text-white/30 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — Steps
      ═══════════════════════════════════════════════ */}
      <section className="py-8 md:py-16 px-4 md:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/50 mb-2">
            Simple & élégant
          </p>
          <h2 className="font-['Playfair_Display'] text-xl md:text-3xl text-white/90 mb-8">
            Comment ça <span className="text-[#c8a94a] italic">fonctionne</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Parlez", desc: "Dites à ARIA ce dont vous rêvez" },
              { step: "02", title: "Explorez", desc: "Recevez plusieurs scénarios adaptés" },
              { step: "03", title: "Visualisez", desc: "Parcours sur carte, jour par jour" },
              { step: "04", title: "Vivez", desc: "Partez l'esprit libre" },
            ].map((s) => (
              <div key={s.step} className="relative">
                <span className="text-[32px] md:text-[48px] font-['Playfair_Display'] text-[#c8a94a]/10 leading-none">
                  {s.step}
                </span>
                <h3 className="text-sm font-medium text-white/80 mt-1">{s.title}</h3>
                <p className="text-[10px] text-white/30 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRICING — Compact mobile cards
      ═══════════════════════════════════════════════ */}
      <section className="py-8 md:py-16 px-4 md:px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/50 mb-2">
            Choisissez votre expérience
          </p>
          <h2 className="font-['Playfair_Display'] text-xl md:text-3xl text-white/90 mb-8">
            Des forfaits pour <span className="text-[#c8a94a] italic">chaque ambition</span>
          </h2>

          {/* Mobile: horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`snap-start flex-shrink-0 w-[260px] md:w-auto p-5 md:p-6 border ${
                  plan.accent
                    ? "border-[#c8a94a]/30 bg-[#c8a94a]/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                } relative`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-4 text-[9px] bg-[#c8a94a] text-[#080c14] px-2 py-0.5 font-semibold tracking-wider uppercase">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-['Playfair_Display'] text-base text-white/90">
                  {plan.name}
                </h3>
                <p className="text-[10px] text-white/35 mt-0.5">{plan.tagline}</p>
                <div className="mt-4 mb-5">
                  <span className="text-2xl font-semibold text-white/90">
                    {plan.price}
                  </span>
                  <span className="text-xs text-white/30">€/mois</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-white/50">
                      <Check size={12} className="text-[#c8a94a]/60 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.comingSoon ? (
                  <Button
                    disabled
                    className="w-full rounded-none py-4 text-[11px] tracking-wider uppercase opacity-40"
                  >
                    Bientôt disponible
                  </Button>
                ) : (
                  <Link href={isAuthenticated ? "/pricing" : getLoginUrl()}>
                    <Button
                      className={`w-full rounded-none py-4 text-[11px] tracking-wider uppercase font-medium ${
                        plan.accent
                          ? "bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a]"
                          : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08]"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          AMBASSADOR — Compact
      ═══════════════════════════════════════════════ */}
      <section className="py-8 md:py-16 px-4 md:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto md:flex md:items-center md:gap-12">
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/50 mb-2">
              Programme ambassadeur
            </p>
            <h2 className="font-['Playfair_Display'] text-xl md:text-2xl text-white/90 mb-4">
              Partagez l'excellence, <span className="text-[#c8a94a] italic">récoltez les fruits</span>
            </h2>
            <p className="text-xs text-white/40 leading-relaxed mb-5">
              Parrainez vos proches et gagnez jusqu'à 22% de commissions récurrentes
              sur chaque abonnement et réservation.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                "15% sur chaque abonnement",
                "Commissions niveau 2",
                "Parcours vérifiés",
                "Contenu partageable",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check size={12} className="text-[#c8a94a]/60 mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] text-white/50">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/ambassadeur">
              <Button
                variant="outline"
                className="border-[#c8a94a]/20 text-[#c8a94a]/70 hover:text-[#c8a94a] hover:border-[#c8a94a]/40 rounded-none px-6 py-4 text-[11px] tracking-wider uppercase bg-transparent"
              >
                En savoir plus
                <ArrowRight size={12} className="ml-2" />
              </Button>
            </Link>
          </div>
          <div className="hidden md:block flex-shrink-0">
            <div className="w-48 h-48 bg-[#c8a94a]/[0.05] border border-[#c8a94a]/10 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-['Playfair_Display'] text-[#c8a94a]">22%</span>
                <p className="text-[10px] text-white/30 mt-1">commissions récurrentes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          B2B — Prestataires
      ═══════════════════════════════════════════════ */}
      <section className="py-8 md:py-16 px-4 md:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/50 mb-2">
            Vous êtes prestataire ?
          </p>
          <h2 className="font-['Playfair_Display'] text-xl md:text-2xl text-white/90 mb-3">
            Recevez des clients <span className="text-[#c8a94a] italic">qualifiés</span>
          </h2>
          <p className="text-xs text-white/40 leading-relaxed mb-5 max-w-lg">
            Hôtels, restaurants, agences : rejoignez notre réseau. Zéro frais d'inscription,
            commission uniquement sur les réservations confirmées.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {["Hôtellerie", "Gastronomie", "Transport", "Yachts", "Immobilier", "Bien-être", "Mode", "Événementiel"].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-white/40"
                >
                  {tag}
                </span>
              )
            )}
          </div>
          <Button
            variant="outline"
            className="border-white/10 text-white/50 hover:text-[#c8a94a] hover:border-[#c8a94a]/30 rounded-none px-6 py-4 text-[11px] tracking-wider uppercase bg-transparent"
            onClick={() => {
              import("sonner").then(({ toast }) =>
                toast("Formulaire prestataire bientôt disponible")
              );
            }}
          >
            Devenir partenaire
          </Button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════ */}
      <section className="py-12 md:py-20 px-4 md:px-6 border-t border-white/[0.04] text-center">
        <h2 className="font-['Playfair_Display'] text-xl md:text-3xl text-white/90 mb-3">
          Votre prochaine expérience{" "}
          <span className="text-[#c8a94a] italic">commence ici</span>
        </h2>
        <p className="text-xs text-white/35 mb-6 max-w-md mx-auto">
          Rejoignez Maison Baymora et découvrez ce que l'intelligence artificielle
          peut faire pour sublimer chaque instant.
        </p>
        <Link href={isAuthenticated ? "/chat" : getLoginUrl()}>
          <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8 py-5 text-sm tracking-wider uppercase font-medium">
            <MessageCircle size={16} className="mr-2" />
            Parlez à votre assistant
          </Button>
        </Link>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.04] py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#c8a94a]/40 mb-3 font-medium">
                Explorer
              </p>
              <div className="space-y-2">
                <Link href="/destinations" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Destinations</Link>
                <Link href="/inspirations" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Expériences</Link>
                <Link href="/inspirations" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Bundles</Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#c8a94a]/40 mb-3 font-medium">
                Membership
              </p>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Forfaits</Link>
                <Link href="/ambassadeur" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Programme Ambassadeur</Link>
                <Link href="/a-propos#b2b" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Prestataires</Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#c8a94a]/40 mb-3 font-medium">
                Réseaux
              </p>
              <div className="space-y-2">
                <a href="#" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Instagram</a>
                <a href="#" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">TikTok</a>
                <a href="#" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">YouTube</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#c8a94a]/40 mb-3 font-medium">
                Légal
              </p>
              <div className="space-y-2">
                <a href="#" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Mentions légales</a>
                <a href="#" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">Confidentialité</a>
                <a href="#" className="block text-[11px] text-white/30 hover:text-[#c8a94a] transition-colors">CGU</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 flex items-center justify-center border border-[#c8a94a]/30 rounded-full">
                <span className="font-['Playfair_Display'] text-xs text-[#c8a94a] font-semibold">B</span>
              </div>
              <span className="text-[11px] text-white/20">
                © {new Date().getFullYear()} Maison Baymora. Tous droits réservés.
              </span>
            </div>
            <p className="text-[10px] text-white/15">
              Propulsé par l'intelligence artificielle
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────── */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}
