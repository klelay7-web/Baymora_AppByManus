import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, MapPin, Star, Lock, Shield, ArrowRight,
  MessageCircle, Globe, Crown, Heart, ArrowLeft,
  Eye, EyeOff, UserX, CheckCircle,
} from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

// Services avec statut actif/en cours
const SERVICES = [
  {
    id: "assistant-ia",
    icon: Sparkles,
    title: "Assistant IA Premium",
    tagline: "Votre concierge intelligent, disponible 24/7",
    description:
      "J'ai construit cet assistant pour que vous n'ayez jamais à chercher vous-même. Il apprend vos goûts, anticipe vos envies et propose des recommandations personnalisées. Il pose les bonnes questions, génère 3 parcours comparatifs, et s'améliore à chaque échange.",
    features: [
      "Conversation interactive avec boutons de réponse",
      "Mémoire de vos préférences et historique",
      "Génération de 3 parcours comparatifs",
      "Recommandations proactives avant votre demande",
    ],
    cta: "/chat",
    ctaLabel: "Parler à l'assistant",
    tier: "gratuit",
    active: true,
    img: `${CDN}/paris-restaurant-eiffel_bb963598.jpg`,
  },
  {
    id: "parcours",
    icon: MapPin,
    title: "Parcours Sur-Mesure",
    tagline: "Itinéraires GPS jour par jour, carte interactive",
    description:
      "Chaque jour de votre voyage est planifié avec une carte interactive, des horaires, des options de transport et des fiches détaillées pour chaque établissement. Vous voyagez, nous gérons la logistique.",
    features: [
      "Map interactive jour par jour",
      "Choix de transport : Uber, chauffeur, métro, à pied",
      "Notifications en temps réel le jour J",
      "Synchronisation avec votre calendrier",
    ],
    cta: "/chat",
    ctaLabel: "Créer mon parcours",
    tier: "explorer",
    active: true,
    img: `${CDN}/santorini-caldera-pool_50bf8b27.jpg`,
  },
  {
    id: "bundles",
    icon: Star,
    title: "Bundles & Sélections",
    tagline: "Expériences clé en main, personnalisables par l'IA",
    description:
      "Des packages curatés par nos experts : week-end romantique à Paris, safari au Kenya, gastronomie toscane... Chaque bundle est personnalisable selon vos préférences et votre budget.",
    features: [
      "Top 10 des adresses les plus demandées",
      "Bundles par thème : romance, aventure, business",
      "Personnalisation IA de chaque détail",
      "Réservation directe ou via conciergerie",
    ],
    cta: "/inspirations",
    ctaLabel: "Voir les bundles",
    tier: "explorer",
    active: true,
    img: `${CDN}/tokyo-luxury-hotel_be1c6ef3.jpg`,
  },
  {
    id: "off-market",
    icon: Lock,
    title: "Accès Off-Market",
    tagline: "Ce qui n'est jamais publié — propriétés, yachts, jets",
    description:
      "Propriétés d'exception, yachts privés, jets, montres rares, œuvres d'art... Des opportunités exclusives accessibles uniquement aux membres Élite, négociées par notre réseau de partenaires internationaux. Cette section est en cours de construction.",
    features: [
      "Propriétés et villas non listées",
      "Yachts et jets privés",
      "Objets de collection et art",
      "Négociation par notre équipe dédiée",
    ],
    cta: "/pricing",
    ctaLabel: "Être notifié à l'ouverture",
    tier: "elite",
    active: false, // EN COURS DE CRÉATION
    img: `${CDN}/santorini-suite-sunset_4226a6f6.jpg`,
  },
  {
    id: "reservation",
    icon: Globe,
    title: "Réservation & Partage",
    tagline: "Réservez, déléguez ou partagez en un clic",
    description:
      "Chaque fiche peut être réservée directement en ligne, envoyée à un proche, transmise à votre assistant personnel, ou confiée à une conciergerie partenaire Baymora qui négocie pour vous.",
    features: [
      "Réservation directe en ligne",
      "Partage vers un proche ou assistant",
      "Envoi à votre conciergerie préférée",
      "Conciergerie partenaire Baymora",
    ],
    cta: "/chat",
    ctaLabel: "Essayer maintenant",
    tier: "explorer",
    active: true,
    img: `${CDN}/tropical-pool-luxury_b3d67c1a.jpg`,
  },
];

const TIERS_INFO: Record<string, { label: string; color: string }> = {
  gratuit: { label: "Gratuit", color: "bg-green-500/10 text-green-400 border-green-400/20" },
  explorer: { label: "Explorer", color: "bg-[#c8a94a]/10 text-[#c8a94a] border-[#c8a94a]/20" },
  premium: { label: "Premium", color: "bg-blue-500/10 text-blue-400 border-blue-400/20" },
  elite: { label: "Élite", color: "bg-purple-500/10 text-purple-400 border-purple-400/20" },
};

// Les 3 niveaux du Mode Fantôme — distincts et clairs
const FANTOME_LEVELS = [
  {
    icon: Eye,
    title: "Niveau 1 — Vos données restent vôtres",
    description:
      "Chez Baymora, nous ne vendons pas vos données. Jamais. Aucune revente à des tiers, aucun profilage publicitaire. Vos préférences de voyage servent uniquement à améliorer vos recommandations personnelles.",
    badge: "Par défaut pour tous",
    color: "border-green-400/20 bg-green-400/5",
    badgeColor: "bg-green-500/10 text-green-400",
  },
  {
    icon: EyeOff,
    title: "Niveau 2 — Anonymat sur l'application",
    description:
      "Vous choisissez de ne pas afficher votre nom réel dans l'application. Votre profil est visible uniquement par vous. Vos échanges avec l'assistant sont privés et non partagés avec d'autres utilisateurs.",
    badge: "Explorer & Premium",
    color: "border-[#c8a94a]/20 bg-[#c8a94a]/5",
    badgeColor: "bg-[#c8a94a]/10 text-[#c8a94a]",
  },
  {
    icon: UserX,
    title: "Niveau 3 — Anonymat dans la vraie vie",
    description:
      "Pour les clients qui exigent une discrétion totale dans le monde réel. Réservations effectuées sous pseudonyme ou via société, communication chiffrée, aucune trace dans les systèmes des partenaires. Votre identité n'apparaît nulle part.",
    badge: "Élite uniquement — En cours de création",
    color: "border-purple-400/20 bg-purple-400/5",
    badgeColor: "bg-purple-500/10 text-purple-400",
  },
];

export default function Services() {
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
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <img
          src={`${CDN}/paris-michelin-restaurant_3a9c5f21.jpg`}
          alt="Services Baymora"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080c14]/80 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">Conciergerie Premium</p>
          <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl mb-6 max-w-3xl leading-tight">
            Nos <em className="text-[#c8a94a] not-italic">Services</em>
          </h1>
          <p className="text-white/60 text-lg max-w-xl font-light leading-relaxed">
            J'ai conçu Baymora pour que vous n'ayez qu'à choisir — l'IA et l'équipe font le reste.
            Chaque service est pensé pour vous faire gagner du temps et vivre mieux.
          </p>
        </div>
      </section>

      {/* Services — avec images et statut actif/en cours */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            const tierInfo = TIERS_INFO[service.tier];
            return (
              <div
                key={service.id}
                className={`group relative overflow-hidden border transition-all ${
                  service.active
                    ? "border-white/10 hover:border-[#c8a94a]/30 bg-[#0a0f1a]"
                    : "border-white/5 bg-[#0a0f1a]/50 opacity-75"
                }`}
              >
                {/* Badge "En cours de création" */}
                {!service.active && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-xl text-[10px]">
                      En cours de création
                    </Badge>
                  </div>
                )}

                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className={`relative overflow-hidden md:w-72 shrink-0 ${!service.active ? "filter grayscale" : ""}`}>
                    <img
                      src={service.img}
                      alt={service.title}
                      className="w-full h-48 md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0f1a] hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] to-transparent md:hidden" />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 bg-[#c8a94a]/10 flex items-center justify-center shrink-0">
                        <Icon className="text-[#c8a94a]" size={22} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="font-['Playfair_Display'] text-xl font-semibold">{service.title}</h3>
                          <Badge className={`text-[9px] rounded-xl border ${tierInfo.color}`}>
                            {tierInfo.label}
                          </Badge>
                          {service.active && (
                            <span className="flex items-center gap-1 text-green-400 text-[10px]">
                              <CheckCircle size={10} /> Disponible
                            </span>
                          )}
                        </div>
                        <p className="text-[#c8a94a] text-xs">{service.tagline}</p>
                      </div>
                    </div>

                    <p className="text-white/50 text-sm leading-relaxed mb-5 font-light">
                      {service.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                      {service.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                          <div className="w-1 h-1 bg-[#c8a94a] shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>

                    <Link href={service.cta}>
                      <Button
                        className={`rounded-xl text-xs px-6 ${
                          service.active
                            ? "bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a]"
                            : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 cursor-default"
                        }`}
                      >
                        {service.ctaLabel} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mode Fantôme — section dédiée avec 3 niveaux distincts */}
      <section id="mode-fantome" className="py-24 px-6 bg-[#0a0f1a]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">Discrétion & Confidentialité</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl mb-6">
              Mode <em className="text-[#c8a94a] not-italic">Fantôme</em>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto font-light text-lg leading-relaxed">
              La confidentialité chez Baymora, c'est trois choses très différentes.
              Voici ce que chacune signifie concrètement pour vous.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FANTOME_LEVELS.map((level, i) => {
              const Icon = level.icon;
              return (
                <div
                  key={i}
                  className={`relative p-8 border ${level.color} transition-all`}
                >
                  <div className="mb-6">
                    <Icon className="text-white/60 mb-4" size={28} />
                    <Badge className={`${level.badgeColor} rounded-xl text-[10px] border mb-4`}>
                      {level.badge}
                    </Badge>
                    <h3 className="font-['Playfair_Display'] text-lg font-semibold mb-3 leading-snug">
                      {level.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed font-light">
                      {level.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-white/30 text-sm font-light mb-4">
              Les niveaux 1 et 2 sont actifs dès aujourd'hui. Le niveau 3 arrive prochainement.
            </p>
            <Link href="/pricing">
              <Button variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 rounded-xl px-8">
                Voir les forfaits <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#c8a94a] tracking-[0.3em] uppercase text-xs mb-4">Simple comme bonjour</p>
          <h2 className="font-['Playfair_Display'] text-3xl mb-16">Comment ça marche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: "01", icon: MessageCircle, title: "Parlez", desc: "Dites à l'IA ce dont vous rêvez, en quelques mots" },
              { step: "02", icon: Sparkles, title: "Choisissez", desc: "3 parcours générés, vous sélectionnez celui qui vous ressemble" },
              { step: "03", icon: Globe, title: "Réservez", desc: "Directement en ligne ou via notre conciergerie" },
              { step: "04", icon: Heart, title: "Vivez", desc: "Map GPS, notifications, le jour J se déroule parfaitement" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-[#c8a94a]/10 flex items-center justify-center mx-auto mb-4 border border-[#c8a94a]/20">
                  <s.icon className="text-[#c8a94a]" size={22} />
                </div>
                <span className="text-[10px] text-[#c8a94a] font-mono tracking-widest">{s.step}</span>
                <h3 className="font-semibold text-sm mt-2 mb-1">{s.title}</h3>
                <p className="text-xs text-white/40 font-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative py-32 overflow-hidden">
        <img
          src={`${CDN}/santorini-sunset-luxury_82477c2d.jpg`}
          alt="Luxury experience"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[#080c14]/80" />
        <div className="relative z-10 max-w-lg mx-auto px-6 text-center">
          <Sparkles className="text-[#c8a94a] mx-auto mb-6" size={32} />
          <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl mb-6">
            Prêt à vivre l'<em className="text-[#c8a94a] not-italic">extraordinaire</em> ?
          </h2>
          <p className="text-white/40 font-light mb-10">
            3 messages gratuits. Aucune carte bancaire requise.
          </p>
          <Link href="/chat">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-xl px-12 py-5 tracking-wider text-base">
              Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
