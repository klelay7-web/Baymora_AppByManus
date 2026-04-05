import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ArrowRight, Globe, Crown, Shield, Users,
  Building2, Heart, MessageCircle, MapPin, Star, Gem,
  Zap, Eye, Lock, Handshake, Utensils,
} from "lucide-react";

const TIMELINE = [
  { year: "2024", event: "Naissance de l'idée : un concierge IA qui anticipe vos désirs" },
  { year: "2025", event: "Développement de la plateforme et premiers partenariats premium" },
  { year: "2026", event: "Lancement officiel de Maison Baymora — l'IA au service du luxe" },
  { year: "2027", event: "Expansion internationale : 50 pays, 500+ partenaires" },
];

const VALUES = [
  {
    icon: Eye,
    title: "Anticipation",
    description: "Nous savons ce que vous voulez avant que vous ne le demandiez. Notre IA apprend de chaque interaction.",
  },
  {
    icon: Shield,
    title: "Discrétion",
    description: "Vos données, vos préférences, votre identité — tout est protégé. Le Mode Fantôme existe pour une raison.",
  },
  {
    icon: Gem,
    title: "Excellence",
    description: "Chaque partenaire est sélectionné, chaque recommandation est vérifiée. Nous ne proposons que le meilleur.",
  },
  {
    icon: Zap,
    title: "Instantanéité",
    description: "Pas d'attente, pas de formulaire. Parlez, cliquez, réservez. L'IA fait le travail en temps réel.",
  },
];

const TEAM_DEPARTMENTS = [
  { name: "IA Concierge", role: "Conversation, recommandations, parcours", icon: Sparkles, status: "24/7" },
  { name: "IA SEO", role: "Création de fiches, optimisation, indexation", icon: Globe, status: "24/7" },
  { name: "IA Contenu", role: "Rédaction, images, vidéos, publications", icon: Star, status: "24/7" },
  { name: "IA Veille", role: "Tendances, prix, disponibilités, alertes", icon: Eye, status: "24/7" },
];

const PARTNER_TYPES = [
  {
    icon: Building2,
    title: "Hôtels & Resorts",
    description: "Palaces, boutique-hôtels, lodges d'exception. Nous sélectionnons les établissements qui partagent notre vision de l'excellence.",
    benefits: ["Visibilité premium auprès de clients qualifiés", "Fiches SEO optimisées par notre IA", "Commission sur réservations directes"],
  },
  {
    icon: Utensils,
    title: "Restaurants & Chefs",
    description: "Tables étoilées, chefs privés, expériences gastronomiques. Chaque adresse est testée et validée.",
    benefits: ["Recommandations IA ciblées", "Intégration dans les parcours voyage", "Avis et photos premium"],
  },
  {
    icon: Globe,
    title: "Conciergeries Partenaires",
    description: "Conciergeries locales et internationales. Quand le client demande une prise en charge humaine, nous vous connectons.",
    benefits: ["Flux de clients qualifiés", "Commission partagée", "Outils de gestion intégrés"],
  },
  {
    icon: Crown,
    title: "Marques de Luxe",
    description: "Yachts, jets, immobilier, montres, art. L'accès off-market pour nos membres Élite.",
    benefits: ["Audience ultra-qualifiée", "Transactions discrètes", "Marketplace VIP dédiée"],
  },
];


export default function About() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c8a94a]/5 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] mb-6">
            <Building2 className="mr-1 h-3 w-3" /> Maison Baymora
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Ne rien posséder. <span className="text-[#c8a94a]">Tout contrôler.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Maison Baymora est la plateforme qui orchestre l'écosystème du luxe :
            clients, prestataires, destinations, expériences — sans posséder un seul hôtel.
            Le système est l'actif.
          </p>
        </div>
      </section>

      {/* Notre Vision */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl font-bold mb-8 text-center">Notre Vision</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="p-6 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#c8a94a]/10 flex items-center justify-center">
                      <Icon className="text-[#c8a94a]" size={20} />
                    </div>
                    <h3 className="font-serif text-lg font-semibold">{v.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold mb-8 text-center">Notre Histoire</h2>
          <div className="space-y-4">
            {TIMELINE.map((item, i) => (
              <div key={item.year} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i <= 2 ? "bg-[#c8a94a]" : "bg-white/20"}`} />
                  {i < TIMELINE.length - 1 && <div className="w-px h-8 bg-white/10" />}
                </div>
                <div>
                  <span className="text-sm font-mono text-[#c8a94a]">{item.year}</span>
                  <p className="text-sm text-muted-foreground">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Équipes IA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl font-bold mb-2">Nos Équipes IA</h2>
            <p className="text-sm text-muted-foreground">
              4 départements d'intelligence artificielle travaillent 24/7 pour vous et pour Maison Baymora
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEAM_DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              return (
                <div key={dept.name} className="p-5 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="text-[#c8a94a]" size={18} />
                      <h3 className="font-semibold text-sm">{dept.name}</h3>
                    </div>
                    <Badge variant="outline" className="border-green-400/30 text-green-400 text-[9px]">
                      {dept.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{dept.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Prestataires & Partenaires B2B */}
      <section id="b2b" className="py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] mb-4">
              <Handshake className="mr-1 h-3 w-3" /> B2B
            </Badge>
            <h2 className="font-serif text-2xl font-bold mb-2">Prestataires & Partenaires</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Rejoignez le réseau Maison Baymora. Accédez à une clientèle qualifiée et bénéficiez
              de nos outils IA pour développer votre activité.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PARTNER_TYPES.map((partner) => {
              const Icon = partner.icon;
              return (
                <div key={partner.title} className="p-6 rounded-lg border border-white/10 bg-white/5 hover:border-[#c8a94a]/20 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#c8a94a]/10 flex items-center justify-center">
                      <Icon className="text-[#c8a94a]" size={20} />
                    </div>
                    <h3 className="font-serif text-lg font-semibold">{partner.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{partner.description}</p>
                  <div className="space-y-1.5">
                    {partner.benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-[#c8a94a]" />
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/chat">
              <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8">
                Devenir partenaire <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Programme Ambassadeur Teaser */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="text-[#c8a94a] mx-auto mb-4" size={32} />
          <h2 className="font-serif text-2xl font-bold mb-3">
            Programme <span className="text-[#c8a94a]">Ambassadeur</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Parrainez vos proches et gagnez jusqu'à 22% de commissions récurrentes.
            Chaque personne que vous invitez devient un client potentiel — et vous touchez
            sur chaque transaction, à vie.
          </p>
          <div className="flex items-center justify-center gap-6 mb-8">
            {[
              { label: "Bronze", rate: "10%", min: "0 filleuls" },
              { label: "Argent", rate: "15%", min: "5 filleuls" },
              { label: "Or", rate: "18%", min: "15 filleuls" },
              { label: "Platine", rate: "22%", min: "30 filleuls" },
            ].map((tier) => (
              <div key={tier.label} className="text-center">
                <span className="text-lg font-bold text-[#c8a94a]">{tier.rate}</span>
                <p className="text-[10px] text-muted-foreground">{tier.label}</p>
              </div>
            ))}
          </div>
          <Link href="/ambassadeur">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8">
              Rejoindre le programme <Crown className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 text-center border-t border-white/5">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-2xl font-bold mb-3">
            Prêt à rejoindre <span className="text-[#c8a94a]">Maison Baymora</span> ?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Que vous soyez client, prestataire ou ambassadeur — il y a une place pour vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/chat">
              <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-6">
                <MessageCircle className="mr-2 h-4 w-4" /> Parler à l'assistant
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 rounded-none px-6">
                Voir les forfaits <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
