import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, MapPin, Star, Lock, Shield, ArrowRight,
  MessageCircle, Globe, Crown, Clock, Gem, Users,
  Plane, Utensils, Building2, Heart,
} from "lucide-react";

const SERVICES = [
  {
    id: "assistant-ia",
    icon: Sparkles,
    title: "Assistant IA Premium",
    tagline: "Votre concierge intelligent, 24/7",
    description:
      "Notre IA conversationnelle apprend vos goûts, anticipe vos envies et propose des recommandations personnalisées. Elle pose les bonnes questions, vous propose des réponses cliquables, et construit votre parcours en temps réel.",
    features: [
      "Conversation interactive avec boutons de réponse",
      "Mémoire de vos préférences et historique",
      "Génération de 3 parcours comparatifs",
      "Recommandations proactives avant votre demande",
    ],
    cta: "/chat",
    ctaLabel: "Parler à l'assistant",
    tier: "gratuit",
  },
  {
    id: "parcours",
    icon: MapPin,
    title: "Parcours Sur-Mesure",
    tagline: "Itinéraires GPS jour par jour",
    description:
      "Chaque jour de votre voyage est planifié avec une carte interactive, des horaires, des options de transport (Uber, chauffeur, métro) et des fiches détaillées pour chaque établissement. Synchronisable avec Google Calendar.",
    features: [
      "Map interactive jour par jour",
      "Choix de transport : Uber, chauffeur, métro, à pied",
      "Notifications en temps réel le jour J",
      "Synchronisation avec votre calendrier",
    ],
    cta: "/chat",
    ctaLabel: "Créer mon parcours",
    tier: "explorer",
  },
  {
    id: "bundles",
    icon: Star,
    title: "Bundles & Sélections",
    tagline: "Expériences clé en main",
    description:
      "Des packages curatés par nos experts : week-end romantique, safari ultime, gastronomie toscane... Chaque bundle est personnalisable par l'IA selon vos préférences et votre budget.",
    features: [
      "Top 10 des adresses les plus demandées",
      "Bundles par thème : romance, aventure, business",
      "Personnalisation IA de chaque détail",
      "Réservation directe ou via conciergerie",
    ],
    cta: "/inspirations",
    ctaLabel: "Voir les bundles",
    tier: "explorer",
  },
  {
    id: "off-market",
    icon: Lock,
    title: "Accès Off-Market",
    tagline: "Ce qui n'est jamais publié",
    description:
      "Propriétés d'exception, yachts privés, jets, montres rares, œuvres d'art... Des opportunités exclusives accessibles uniquement aux membres Élite, négociées par notre réseau de partenaires internationaux.",
    features: [
      "Propriétés et villas non listées",
      "Yachts et jets privés",
      "Objets de collection et art",
      "Négociation par notre équipe dédiée",
    ],
    cta: "/pricing",
    ctaLabel: "Devenir Élite",
    tier: "elite",
  },
  {
    id: "fantome",
    icon: Shield,
    title: "Mode Fantôme",
    tagline: "Discrétion absolue",
    description:
      "Pour les clients qui exigent l'anonymat total. Réservations sous pseudonyme, communication chiffrée, aucune trace numérique. Votre identité reste protégée à chaque étape.",
    features: [
      "Réservations anonymes",
      "Communication chiffrée de bout en bout",
      "Aucune trace dans les systèmes partenaires",
      "Interlocuteur unique dédié",
    ],
    cta: "/pricing",
    ctaLabel: "En savoir plus",
    tier: "elite",
  },
  {
    id: "reservation",
    icon: Globe,
    title: "Réservation & Partage",
    tagline: "Réservez ou déléguez",
    description:
      "Chaque fiche peut être réservée directement en ligne, envoyée à un proche, transmise à votre assistant personnel, ou confiée à une conciergerie partenaire Baymora (locale ou internationale) qui négocie pour vous.",
    features: [
      "Réservation directe en ligne",
      "Partage vers un proche ou assistant",
      "Envoi à votre conciergerie préférée",
      "Conciergerie partenaire Baymora",
    ],
    cta: "/chat",
    ctaLabel: "Essayer maintenant",
    tier: "explorer",
  },
];

const TIERS_INFO: Record<string, { label: string; color: string }> = {
  gratuit: { label: "Gratuit", color: "border-green-400/30 text-green-400" },
  explorer: { label: "Explorer", color: "border-[#c8a94a]/30 text-[#c8a94a]" },
  premium: { label: "Premium", color: "border-blue-400/30 text-blue-400" },
  elite: { label: "Élite", color: "border-purple-400/30 text-purple-400" },
};

export default function Services() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c8a94a]/5 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] mb-6">
            <Crown className="mr-1 h-3 w-3" /> Conciergerie Premium
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Nos <span className="text-[#c8a94a]">Services</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            De l'intelligence artificielle à la conciergerie humaine, chaque service est conçu
            pour que vous n'ayez qu'à choisir — nous faisons le reste.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            const tierInfo = TIERS_INFO[service.tier];
            return (
              <div
                key={service.id}
                className="group p-6 md:p-8 rounded-lg border border-white/10 hover:border-[#c8a94a]/20 bg-white/5 hover:bg-white/8 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#c8a94a]/10 flex items-center justify-center">
                        <Icon className="text-[#c8a94a]" size={20} />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-semibold">{service.title}</h3>
                        <p className="text-xs text-[#c8a94a]">{service.tagline}</p>
                      </div>
                      <Badge variant="outline" className={`ml-auto text-[9px] ${tierInfo.color}`}>
                        {tierInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {service.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {service.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-[#c8a94a]" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex md:flex-col items-center justify-center gap-3 md:min-w-[160px]">
                    <Link href={service.cta}>
                      <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs w-full">
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

      {/* How it works */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-2xl font-bold mb-8">Comment ça marche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: "01", icon: MessageCircle, title: "Parlez", desc: "Dites à l'IA ce dont vous rêvez" },
              { step: "02", icon: Sparkles, title: "Choisissez", desc: "3 parcours générés, vous sélectionnez" },
              { step: "03", icon: Globe, title: "Réservez", desc: "Directement ou via conciergerie" },
              { step: "04", icon: Heart, title: "Vivez", desc: "Map GPS, notifications, jour J parfait" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#c8a94a]/10 flex items-center justify-center mx-auto mb-3">
                  <s.icon className="text-[#c8a94a]" size={20} />
                </div>
                <span className="text-[10px] text-[#c8a94a] font-mono">{s.step}</span>
                <h3 className="font-semibold text-sm mt-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center border-t border-white/5">
        <div className="max-w-lg mx-auto">
          <Sparkles className="text-[#c8a94a] mx-auto mb-4" size={32} />
          <h2 className="font-serif text-2xl font-bold mb-3">
            Prêt à vivre l'<span className="text-[#c8a94a]">extraordinaire</span> ?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            3 messages gratuits. Aucune carte bancaire requise.
          </p>
          <Link href="/chat">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8">
              Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
