import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  MapPin,
  Sparkles,
  Crown,
  ArrowRight,
  Zap,
  Users,
  Trophy,
  Gift,
  ChevronDown,
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
  { q: "Puis-je utiliser Baymora gratuitement ?", a: "Oui. Le compte gratuit donne accès aux offres avec réductions et à 3 parcours MAYA. L'abonnement Social Club débloque les crédits parcours et l'accompagnement complet." },
  { q: "Baymora est-il disponible sur mobile ?", a: "Oui, Baymora est entièrement optimisé pour smartphone. L'interface native mobile inclut des bottom sheets, une navigation par pilules et des notifications push." },
  { q: "Comment fonctionne le système de points ?", a: "Chaque parrainage avec souscription vous rapporte 50 points partagés (25 pts chacun). Un parcours partagé rapporte 15 pts. 1 point vaut 0,25 centime d'euro. Accumulez 10 000 points pour accéder à la liste d'attente du Club Privé." },
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
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════
          HERO — Compact, droit au but
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Luxury yacht at sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/80 via-[#080c14]/50 to-[#080c14]" />
        </div>

        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-16 md:pt-20"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Logo B — desktop only */}
          <motion.div variants={fadeUp} className="mb-4 hidden md:block">
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#c8a94a]/40 flex items-center justify-center mb-4">
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
            className="font-['Playfair_Display'] text-2xl md:text-6xl lg:text-7xl leading-tight mb-4"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}
          >
            <span className="hidden md:inline">
              Nous créons les{" "}
              <em className="text-[#c8a94a] not-italic">expériences</em>
              <br />
              que vous n'imaginiez{" "}
              <em className="text-[#c8a94a] not-italic">pas encore.</em>
            </span>
            <span className="md:hidden">
              L'art de{" "}
              <em className="text-[#c8a94a] not-italic">l'excellence</em>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="md:hidden text-white/70 text-base font-light mb-3"
          >
            Un assistant qui vous connaît
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="md:hidden flex items-center justify-center gap-3 text-white/40 text-xs tracking-wider uppercase mb-6"
          >
            <span>Discrétion &amp; confidentialité</span>
            <span className="text-[#c8a94a]">·</span>
            <span>Accès mondial</span>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="hidden md:block text-white/70 text-xl font-light mb-3"
          >
            Un assistant qui vous connaît
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="hidden md:flex items-center justify-center gap-4 text-white/40 text-sm tracking-wider uppercase mb-8"
          >
            <span>Discrétion &amp; confidentialité</span>
            <span className="text-[#c8a94a]">·</span>
            <span>Accès mondial</span>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Button
              asChild
              className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-xl px-8 py-5 tracking-wider"
            >
              <a href={isAuthenticated ? "/chat" : getLoginUrl()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Parler à MAYA
              </a>
            </Button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="md:hidden mt-6 text-white/20 text-xs animate-bounce"
          >
            <ChevronDown size={20} className="mx-auto" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═════════════════════════════════════════════
          BUNDLES — Laissez-vous inspirer
      ═════════════════════════════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-2xl md:text-5xl mb-3">
              Des expériences <em className="text-[#c8a94a] not-italic">légendaires</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 font-light text-sm md:text-base">
              Laissez-vous inspirer
            </motion.p>
          </motion.div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {bundles.map((b) => (
              <Link key={b.title} href="/bundles" className="flex-shrink-0 w-64 md:w-72 snap-start group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3">
                  <img src={b.img} alt={b.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-[#c8a94a]/90 text-[#080c14] text-xs font-bold px-2.5 py-1 rounded-full">{b.tag}</div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-0.5">{b.title}</h3>
                    <p className="text-white/60 text-xs">{b.subtitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 rounded-xl px-8 py-5">
              <Link href="/bundles">Tous les bundles <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
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
            <h2 className="font-['Playfair_Display'] text-2xl md:text-4xl">Les plus prisées en ce moment</h2>
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
          OFFRES FLASH
      ═════════════════════════════════════════════ */}
      <section id="offres-flash" className="py-16 bg-[#0a0f1a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-widest mb-2">
                <Zap size={12} /> Offres Flash
              </div>
              <h2 className="font-['Playfair_Display'] text-2xl md:text-4xl">Jusqu'à <span className="text-[#c8a94a]">-35%</span> cette semaine</h2>
            </div>
            <Link href="/offres" className="hidden md:flex items-center gap-2 text-white/40 text-sm hover:text-white transition-colors">
              Toutes les offres <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: "Hôtel de Paris", loc: "Monaco", price: "980€", original: "1 400€", pct: 30, img: HERO_IMG, tag: "Hôtellerie" },
              { title: "Villa Karma Kandara", loc: "Bali, Ubud", price: "840€", original: "1 200€", pct: 30, img: SPA_IMG, tag: "Villa" },
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

      {/* ═══════════════════════════════════════════════
          PROGRAMME AMBASSADEUR — Système de points
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
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
              <h2 className="font-['Playfair_Display'] text-2xl md:text-4xl mb-6">
                Invitez vos proches et devenez{" "}
                <em className="text-[#c8a94a] not-italic">ambassadeur Maison Baymora</em>
              </h2>
              <p className="text-white/50 font-light leading-relaxed mb-8">
                Partagez vos parcours, invitez vos proches : parrainez et gagnez des crédits ou débloquez des fonctionnalités exclusives.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Users, text: "Parrainez et gagnez des crédits ou débloquez des fonctionnalités" },
                  { icon: Trophy, text: "Gagnez des points pour débloquer des fonctionnalités premium" },
                  { icon: Gift, text: "Partagez vos parcours vérifiés et gagnez encore plus" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <item.icon className="h-5 w-5 text-[#c8a94a] shrink-0" />
                    <span className="text-white/60 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Points system summary */}
              <div className="bg-[#0e0e16] rounded-2xl border border-white/8 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-4 w-4 text-[#c8a94a]" />
                  <span className="text-white text-sm font-medium">Comment gagner des points</span>
                </div>
                <div className="space-y-2.5 text-xs text-white/50">
                  <div className="flex justify-between items-start">
                    <span>Parrainage avec souscription forfait</span>
                    <span className="text-[#c8a94a] text-right leading-tight">+50 pts partagés<br /><span className="text-white/30 text-[10px]">(25 pts chacun)</span></span>
                  </div>
                  <div className="flex justify-between"><span>Forfait Standard Duo partagé</span><span className="text-[#c8a94a]">+75 pts</span></div>
                  <div className="flex justify-between"><span>Forfait Illimité Duo partagé</span><span className="text-[#c8a94a]">+120 pts</span></div>
                  <div className="flex justify-between"><span>Parcours partagé</span><span className="text-[#c8a94a]">+15 pts</span></div>
                  <div className="flex justify-between"><span>Réservation via Baymora</span><span className="text-[#c8a94a]">1€ = 4 pts</span></div>
                  <div className="flex justify-between text-white/30 text-[10px] italic">
                    <span>Valeur d'un point</span>
                    <span>0,25 centime d'euro</span>
                  </div>
                  <div className="border-t border-white/8 pt-2.5 mt-2.5 flex justify-between font-medium">
                    <span className="text-white/70">Accès liste d'attente Club Privé</span>
                    <span className="text-[#c8a94a]">10 000 pts</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/ambassadeur-info">
                  <button className="bg-[#c8a94a] text-black font-semibold px-6 py-2.5 text-sm hover:bg-[#d4b85c] transition-colors rounded-xl">
                    En savoir plus
                  </button>
                </Link>
                <Link href="/ambassadeur">
                  <button className="border border-white/20 text-white/70 px-6 py-2.5 text-sm hover:border-white/40 transition-colors rounded-xl">
                    Mon dashboard
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="aspect-square relative overflow-hidden rounded-2xl">
                <img
                  src={ROOFTOP_IMG}
                  alt="Ambassador lifestyle"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-6 left-6 right-6 p-5 bg-[#080c14]/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="h-5 w-5 text-[#c8a94a]" />
                  <p className="text-white font-medium text-sm">Club Privé</p>
                </div>
                <p className="text-white/40 text-xs mb-3">L'excellence absolue, sur invitation uniquement</p>
                <div className="flex gap-2">
                  <button className="bg-[#c8a94a]/10 text-[#c8a94a] text-xs font-medium px-3 py-1.5 rounded-full border border-[#c8a94a]/30">
                    Sur invitation
                  </button>
                  <button className="bg-white/5 text-white/60 text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors">
                    S'inscrire à la liste d'attente
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRESTATAIRES B2B
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#0a0f1a]">
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
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-2xl md:text-5xl mb-6">
              Recevez des clients <em className="text-[#c8a94a] not-italic">qualifiés</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto font-light mb-10 leading-relaxed text-sm md:text-base">
              Hôtels, restaurants, agences, artisans du luxe : rejoignez notre réseau.
              Zéro frais d'inscription, commission uniquement sur les réservations confirmées.
              Nos clients arrivent informés, décidés, prêts à réserver.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm text-white/30">
              {["Hôtellerie", "Gastronomie", "Transport", "Yachts", "Immobilier", "Bien-être", "Mode", "Événementiel", "Conciergerie", "Social Clubs", "Mariages & VIP", "Expériences"].map(
                (cat) => (
                  <span key={cat} className="px-3 md:px-4 py-1.5 md:py-2 border border-white/10 hover:border-[#c8a94a]/30 hover:text-[#c8a94a] transition-colors cursor-default rounded-full text-xs md:text-sm">
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
          FAQ
      ═════════════════════════════════════════════ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-3">FAQ</motion.p>
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-2xl md:text-4xl">Questions fréquentes</motion.h2>
          </motion.div>
          <div className="bg-[#0e0e16] rounded-2xl border border-white/6 px-6 divide-y divide-white/8">
            {FAQ_ITEMS.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          CTA FINAL
      ═════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 overflow-hidden">
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
            <motion.h2 variants={fadeUp} className="font-['Playfair_Display'] text-2xl md:text-5xl mb-6">
              Votre prochaine expérience{" "}
              <em className="text-[#c8a94a] not-italic">commence ici</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 font-light text-base md:text-lg mb-10">
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
                  <Sparkles className="mr-2 h-5 w-5" />
                  Essayer MAYA gratuitement
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1">
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
                <li><Link href="/offres" className="hover:text-white/60 transition-colors">Offres</Link></li>
                <li><Link href="/bundles" className="hover:text-white/60 transition-colors">Bundles</Link></li>
                <li><Link href="/discover" className="hover:text-white/60 transition-colors">Destinations</Link></li>
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
