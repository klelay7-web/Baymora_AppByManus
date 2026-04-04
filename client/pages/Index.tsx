import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Sparkles, Crown, Users, Star, MessageSquare, Menu, X, CheckCircle, TrendingUp, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── i18n ─────────────────────────────────────────────────────────────────────

const T = {
  fr: {
    nav: { login: "Se connecter", mySpace: "Mon espace", start: "Commencer", partners: "Partenaires" },
    hero: {
      badge: "Conciergerie de voyage · Intelligence artificielle",
      h1a: "L'expérience",
      h1b: "de votre vie",
      h1c: "commence ici.",
      sub: "Dites-nous ce que vous voulez. Baymora crée le voyage. Comme si vous aviez un concierge haut de gamme disponible à toute heure.",
      cta: "Commencer — c'est gratuit",
      ctaSub: "Voir les cercles",
      fine: "15 échanges gratuits · Aucune carte requise · Anonymat possible",
    },
    how: {
      title: "Aussi simple que d'envoyer un message",
      steps: [
        { msg: "Je veux un week-end romantique, Europe, budget 3 000€ pour deux.", who: "Vous" },
        { msg: "Prague ou San Sebastián ? Les deux sont parfaits pour ça. Vous préférez culture & gastronomie, ou mer & détente ?", who: "Baymora" },
        { msg: "Gastronomie. Et on aime les hôtels avec du cachet.", who: "Vous" },
        { msg: "Parfait. Je vous prépare 3 options San Sebastián avec palais historiques et tables étoilées — budget respecté.", who: "Baymora" },
      ],
    },
    why: {
      title: "Pourquoi Baymora",
      items: [
        { icon: "✦", title: "Mémoire permanente", desc: "Vos proches, leurs allergies, leurs anniversaires, leurs tailles. Baymora retient tout — chaque voyage devient plus précis." },
        { icon: "🔒", title: "Discrétion absolue", desc: "Pseudonyme possible. Aucun partage, aucun tracking. Vos données ne quittent jamais Baymora." },
        { icon: "⚡", title: "Propulsé par Claude Opus", desc: "Le modèle IA le plus avancé du marché. Des réponses de niveau concierge, pas de chatbot basique." },
        { icon: "🌍", title: "Mondial, illimité", desc: "De Paris à Bali, d'un week-end impromptu à un safari sur-mesure. Aucune limite géographique ni thématique." },
      ],
    },
    plans: {
      title: "Les Cercles",
      sub: "Commencez gratuitement. Évoluez à votre rythme.",
      cta: ["Commencer", "Rejoindre", "Accéder", "Nous contacter"],
      popular: "Populaire",
    },
    privacy: {
      title: "Vos données, votre vie privée",
      text: "Baymora mémorise pour vous, jamais pour les autres. Pseudonyme possible, suppression complète à tout moment. Hébergé en Europe.",
      tags: ["Pseudonyme possible", "Données en Europe", "Suppression totale", "Aucun tracking"],
    },
    finalCta: {
      title: "À 15 échanges de\nl'expérience de votre vie.",
      sub: "Commencez maintenant. Aucune carte requise.",
      btn: "Parler à Baymora",
    },
    affiliate: {
      title: "Programme partenaire",
      desc: "15% de commission récurrente par client référé. Tableau de bord dédié.",
      cta: "Devenir partenaire →",
    },
    footer: {
      tagline: "Conciergerie de voyage privée",
      links: ["Chat", "Connexion", "Partenaires", "Admin"],
    },
  },
  en: {
    nav: { login: "Sign in", mySpace: "My space", start: "Get started", partners: "Partners" },
    hero: {
      badge: "Travel concierge · Artificial intelligence",
      h1a: "The experience",
      h1b: "of a lifetime",
      h1c: "starts here.",
      sub: "Tell us what you want. Baymora creates the journey. Like having a premium concierge available around the clock.",
      cta: "Get started — it's free",
      ctaSub: "See the Circles",
      fine: "10 free messages · No card required · Anonymity possible",
    },
    how: {
      title: "As simple as sending a message",
      steps: [
        { msg: "I want a romantic weekend in Europe, budget €3,000 for two.", who: "You" },
        { msg: "Prague or San Sebastián? Both are perfect. Do you prefer culture & gastronomy, or sea & relaxation?", who: "Baymora" },
        { msg: "Gastronomy. And we love hotels with character.", who: "You" },
        { msg: "Perfect. I'll prepare 3 San Sebastián options with historic palaces and starred restaurants — within budget.", who: "Baymora" },
      ],
    },
    why: {
      title: "Why Baymora",
      items: [
        { icon: "✦", title: "Permanent memory", desc: "Your companions, their allergies, birthdays, sizes. Baymora remembers everything — each trip gets more precise." },
        { icon: "🔒", title: "Total discretion", desc: "Pseudonym possible. No sharing, no tracking. Your data never leaves Baymora." },
        { icon: "⚡", title: "Powered by Claude Opus", desc: "The most advanced AI model on the market. Concierge-level answers, not a basic chatbot." },
        { icon: "🌍", title: "Global, unlimited", desc: "From Paris to Bali, from a spontaneous weekend to a bespoke safari. No geographic or thematic limits." },
      ],
    },
    plans: {
      title: "The Circles",
      sub: "Start free. Evolve at your own pace.",
      cta: ["Start", "Join", "Access", "Contact us"],
      popular: "Popular",
    },
    privacy: {
      title: "Your data, your privacy",
      text: "Baymora memorizes for you, never for others. Pseudonym possible, complete deletion at any time. Hosted in Europe.",
      tags: ["Pseudonym possible", "Data in Europe", "Full deletion", "No tracking"],
    },
    finalCta: {
      title: "5 exchanges away from\nthe experience of a lifetime.",
      sub: "Start now. No card required.",
      btn: "Talk to Baymora",
    },
    affiliate: {
      title: "Partner program",
      desc: "15% recurring commission per referred client. Dedicated dashboard.",
      cta: "Become a partner →",
    },
    footer: {
      tagline: "Private travel concierge",
      links: ["Chat", "Sign in", "Partners", "Admin"],
    },
  },
} as const;

type Lang = "fr" | "en";

// ─── Plans data ───────────────────────────────────────────────────────────────

// ─── Packs thématiques (visuels landing) ────────────────────────────────────

const THEME_PACKS = [
  { id: 'ski', emoji: '⛷️', title: 'Ski & Montagne', subtitle: 'Courchevel · Megève · Verbier', gradient: 'from-blue-600/30 to-cyan-500/10', prompt: 'Je veux un séjour au ski dans une station premium' },
  { id: 'beach', emoji: '🏖️', title: 'Plage & Soleil', subtitle: 'St-Tropez · Mykonos · Maldives', gradient: 'from-amber-500/30 to-orange-400/10', prompt: 'Je cherche une destination plage et soleil premium' },
  { id: 'city', emoji: '🌃', title: 'City Break', subtitle: 'NYC · Paris · Tokyo · Milan', gradient: 'from-purple-600/30 to-pink-500/10', prompt: 'Je veux un city break dans une grande ville' },
  { id: 'gastro', emoji: '🍽️', title: 'Gastronomie', subtitle: 'Étoilés · Caves · Dégustations', gradient: 'from-red-600/30 to-rose-400/10', prompt: 'Je veux un séjour gastronomique avec restaurants étoilés' },
  { id: 'romantic', emoji: '💑', title: 'Romantique', subtitle: 'Venise · Santorin · Bora Bora', gradient: 'from-pink-500/30 to-red-400/10', prompt: 'Je cherche un séjour romantique en couple' },
  { id: 'nightlife', emoji: '🌙', title: 'Nightlife & Fête', subtitle: 'Ibiza · Miami · Dubai', gradient: 'from-violet-600/30 to-blue-500/10', prompt: 'Je veux faire la fête dans les meilleurs clubs et beach clubs' },
  { id: 'wellness', emoji: '🧘', title: 'Détente & Spa', subtitle: 'Thalasso · Yoga · Retraites', gradient: 'from-emerald-500/30 to-teal-400/10', prompt: 'Je cherche un séjour détente spa et bien-être' },
  { id: 'adventure', emoji: '🧭', title: 'Aventure', subtitle: 'Safari · Trek · Expéditions', gradient: 'from-orange-600/30 to-yellow-500/10', prompt: 'Je veux une aventure unique et hors des sentiers battus' },
];

const PLANS = [
  { circle: "Découverte", badge: "○", price: "Gratuit", color: "border-white/12", highlight: false,
    features: { fr: ["15 échanges gratuits", "IA Opus complète", "Recommandations 100% IA", "Aucun compte requis"], en: ["15 free exchanges", "Full Opus AI", "100% AI recommendations", "No account needed"] } },
  { circle: "Premium", badge: "✦", price: "14,90€/mois", color: "border-secondary/40", highlight: true,
    features: { fr: ["200 crédits/mois + rollover", "Mémoire permanente + 5 proches", "5 plans de voyage sauvegardés", "Fiches & parcours Baymora", "Échappées Baymora (offres partenaires)", "Accès Expériences VIP en option"], en: ["200 credits/month + rollover", "Permanent memory + 5 companions", "5 saved trip plans", "Baymora curated guides", "Baymora Escapes (partner offers)", "VIP Experiences available as add-on"] } },
  { circle: "Privé", badge: "✦✦✦", price: "49,90€/mois", color: "border-amber-400/35", highlight: false,
    features: { fr: ["Crédits illimités", "Cercle familial complet", "Conciergerie humaine", "Expériences Privées VIP incluses", "Réservation par Baymora", "Tout inclus, zéro limite"], en: ["Unlimited credits", "Full family circle", "Human concierge", "VIP Private Experiences included", "Booking by Baymora", "All-inclusive, zero limits"] } },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const shimmer = {
  background: "linear-gradient(135deg, #ffffff 0%, #ece4d4 40%, #c8bfa8 70%, #ffffff 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  filter: "drop-shadow(0 0 12px rgba(255,245,220,0.25))",
};

const gold = {
  background: "linear-gradient(135deg, #c8a94a 0%, #f5d87a 35%, #e4c057 65%, #f0d070 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  filter: "drop-shadow(0 0 14px rgba(212,168,80,0.45))",
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Index() {
  const { isAuthenticated } = useAuth();
  const [lang, setLang] = useState<Lang>("fr");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#080c14]/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/40 to-secondary/10 border border-secondary/20 flex items-center justify-center">
              <span className="text-secondary font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-white text-base tracking-tight">Baymora</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Lang switcher */}
            <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5 mr-2">
              {(["fr","en"] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${lang === l ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <Link to="/partner" className="text-white/30 hover:text-white/60 text-xs transition-colors whitespace-nowrap">
              {t.nav.partners}
            </Link>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <button className="bg-white/6 border border-white/12 text-white/70 text-xs px-3.5 py-1.5 rounded-full hover:bg-white/12 transition-all whitespace-nowrap">
                  {t.nav.mySpace}
                </button>
              </Link>
            ) : (
              <Link to="/auth">
                <button className="bg-white/6 border border-white/12 text-white/70 text-xs px-3.5 py-1.5 rounded-full hover:bg-white/12 transition-all whitespace-nowrap">
                  {t.nav.login}
                </button>
              </Link>
            )}

            <Link to="/chat">
              <button className="bg-secondary text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-secondary/90 transition-all flex items-center gap-1.5 whitespace-nowrap">
                {t.nav.start} <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </div>

          {/* Mobile nav: lang switcher + CTA + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5">
              {(["fr","en"] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${lang === l ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <Link to="/chat">
              <button className="bg-secondary text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-secondary/90 transition-all flex items-center gap-1 whitespace-nowrap">
                {t.nav.start} <ArrowRight className="h-3 w-3" />
              </button>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white/50 hover:text-white/80 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/8 bg-[#080c14]/95 backdrop-blur-md px-4 py-3 space-y-2">
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-white/60 text-sm py-2 whitespace-nowrap">
                {t.nav.mySpace}
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="block text-white/60 text-sm py-2 whitespace-nowrap">
                {t.nav.login}
              </Link>
            )}
            <Link to="/partner" onClick={() => setMobileMenuOpen(false)} className="block text-white/30 text-sm py-2 whitespace-nowrap">
              {t.nav.partners}
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero — Barre de recherche (comme Perplexity/Airbnb) ── */}
      <section className="relative pt-16 pb-12 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary/6 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-4 tracking-tight">
            <span style={shimmer}>{lang === 'fr' ? 'Dites ce que vous voulez.' : 'Say what you want.'}</span>
            <br />
            <span style={gold}>{lang === 'fr' ? 'Baymora organise tout.' : 'Baymora handles it all.'}</span>
          </h1>

          <p className="text-white/35 text-sm sm:text-base max-w-md mx-auto mb-8">
            {lang === 'fr' ? 'Voyages, sorties, cadeaux, lifestyle — votre concierge personnel disponible 24/7.' : 'Travel, dining, gifts, lifestyle — your personal concierge available 24/7.'}
          </p>

          {/* Barre de recherche directe */}
          <form onSubmit={(e) => { e.preventDefault(); const input = (e.target as any).querySelector('input'); if (input?.value?.trim()) window.location.href = `/chat?prompt=${encodeURIComponent(input.value.trim())}`; }} className="max-w-lg mx-auto mb-6">
            <div className="flex bg-white/5 border border-white/15 rounded-2xl overflow-hidden hover:border-secondary/30 transition-all focus-within:border-secondary/50 focus-within:ring-1 focus-within:ring-secondary/20">
              <input
                type="text"
                placeholder={lang === 'fr' ? 'Week-end romantique à Venise, budget 3000€...' : 'Romantic weekend in Venice, budget $3000...'}
                className="flex-1 bg-transparent text-white text-sm px-5 py-4 placeholder:text-white/25 focus:outline-none"
              />
              <button type="submit" className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-6 text-sm transition-all whitespace-nowrap">
                {lang === 'fr' ? 'Parler →' : 'Go →'}
              </button>
            </div>
          </form>

          <p className="text-white/15 text-xs">{lang === 'fr' ? '15 échanges gratuits · Aucune carte requise' : '15 free exchanges · No card needed'}</p>

          {/* Social proof */}
          <div className="flex justify-center gap-6 mt-6 text-white/20 text-xs">
            <span>⭐ 4.8/5</span>
            <span>🗺️ 1 200+ parcours</span>
            <span>📍 850+ lieux vérifiés</span>
          </div>
        </div>
      </section>

      {/* ── Parcours populaires (preuve sociale + SEO) ── */}
      <ParcoursSection lang={lang} />

      {/* ── Guides & Sélections (SEO) ── */}
      <GuidesSection lang={lang} />

      {/* ── Plans ── */}
      <section id="plans" className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2" style={gold}>{t.plans.title}</h2>
          <p className="text-white/30 text-sm text-center mb-12">{t.plans.sub}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {PLANS.map((p, i) => (
              <div
                key={p.circle}
                className={`relative bg-white/3 border rounded-2xl p-5 flex flex-col ${p.color} ${p.highlight ? "ring-1 ring-amber-400/25 bg-amber-500/4" : ""}`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                    {t.plans.popular}
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-secondary text-lg font-semibold">{p.badge}</p>
                  <h3 className="text-white font-bold text-base whitespace-nowrap">{p.circle}</h3>
                  <p className="text-white/60 font-bold text-lg sm:text-xl mt-1 whitespace-nowrap">{p.price}</p>
                </div>
                <ul className="space-y-1.5 flex-1 mb-5">
                  {p.features[lang].map(f => (
                    <li key={f} className="flex items-start gap-2 text-white/40 text-[11px] leading-snug">
                      <span className="text-secondary mt-0.5 text-[11px] flex-shrink-0">✓</span>
                      <span className="min-w-0">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/chat">
                  <button className={`w-full py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    p.highlight
                      ? "bg-secondary text-white hover:bg-secondary/90"
                      : "bg-white/6 border border-white/12 text-white/60 hover:bg-white/12"
                  }`}>
                    {t.plans.cta[i]}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary/20 border border-secondary/20 flex items-center justify-center">
                <span className="text-secondary font-bold text-xs">B</span>
              </div>
              <span className="text-white/50 text-sm font-semibold">Baymora</span>
            </div>
            <div className="flex items-center gap-5 text-white/25 text-xs">
              <Link to="/chat" className="hover:text-white/50 transition-colors whitespace-nowrap">Concierge IA</Link>
              <Link to="/boutique" className="hover:text-white/50 transition-colors whitespace-nowrap">Boutique</Link>
              <Link to="/partner" className="hover:text-white/50 transition-colors whitespace-nowrap">Partenaires</Link>
              <Link to="/auth" className="hover:text-white/50 transition-colors whitespace-nowrap">Connexion</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
            <p className="text-white/15 text-[10px]">Données privées · Pseudonyme possible · Hébergé en Europe · © 2026 Baymora</p>
            <p className="text-white/10 text-[10px]">Propulsé par Claude Opus · L'IA la plus avancée du marché</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARCOURS POPULAIRES — Section landing avec trips publics
// ═══════════════════════════════════════════════════════════════════════════════
// GuidesSection — Guides & Sélections curatées
// ═══════════════════════════════════════════════════════════════════════════════

const GUIDE_CAT: Record<string, { label: string; emoji: string }> = {
  restaurants: { label: "Restaurants", emoji: "🍽️" }, hotels: { label: "Hôtels", emoji: "🏨" },
  activites: { label: "Activités", emoji: "🎯" }, bars: { label: "Bars", emoji: "🍸" },
  spas: { label: "Spas", emoji: "🧖" }, parcours: { label: "Parcours", emoji: "🗺️" },
  "bons-plans": { label: "Bons plans", emoji: "💎" },
};

function GuidesSection({ lang }: { lang: 'fr' | 'en' }) {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guides?limit=6')
      .then(r => r.ok ? r.json() : [])
      .then(data => setGuides(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || guides.length === 0) return null;

  return (
    <section className="py-20 px-4 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2" style={{
          background: "linear-gradient(135deg,#c8a94a 0%,#f5d87a 35%,#e4c057 65%,#f0d070 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {lang === 'fr' ? 'Guides & Sélections' : 'Curated Guides'}
        </h2>
        <p className="text-white/30 text-sm text-center mb-10">
          {lang === 'fr' ? 'Nos meilleures adresses, testées et approuvées.' : 'Our best addresses, tested and approved.'}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((g: any) => {
            const cat = GUIDE_CAT[g.category] || { label: g.category, emoji: "📌" };
            const visible = g.previewCount || 3;
            const total = g.itemCount || 0;
            return (
              <Link
                key={g.slug}
                to={`/guide/${g.slug}`}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/12 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{g.coverEmoji || cat.emoji}</span>
                  <span className="bg-white/5 border border-white/10 text-[10px] text-white/50 px-2 py-0.5 rounded-full">{cat.label}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-amber-200 transition-colors line-clamp-2">{g.title}</h3>
                {g.city && (
                  <p className="flex items-center gap-1 text-white/30 text-xs mb-3">
                    <MapPin className="w-3 h-3" />{g.city}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[11px] text-white/25">{visible} visibles sur {total}</span>
                  <span className="text-xs text-secondary/70 group-hover:text-secondary transition-colors">
                    Voir la sélection →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════

const BUDGET_TIERS = [
  { label: 'Découverte', max: 2000, color: 'border-white/15', access: 'gratuit', badge: '○' },
  { label: 'Premium', max: 8000, color: 'border-secondary/40', access: 'premium', badge: '✦' },
  { label: 'Privé', max: Infinity, color: 'border-amber-400/35', access: 'prive', badge: '✦✦✦' },
];

const PARCOURS_EMOJI: Record<string, string> = {
  'Paris': '🇫🇷', 'New York': '🗽', 'NYC': '🗽', 'Tokyo': '🇯🇵', 'Mykonos': '🏝️', 'Saint-Tropez': '⛵',
  'Courchevel': '⛷️', 'Dubai': '🏙️', 'Dubaï': '🏙️', 'Bali': '🌴', 'Maldives': '🏖️', 'Milan': '🇮🇹',
  'London': '🇬🇧', 'Londres': '🇬🇧', 'Miami': '🌴', 'Los Angeles': '🌅', 'LA': '🌅',
};

function ParcoursSection({ lang }: { lang: 'fr' | 'en' }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trips/feed?limit=9')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTrips(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || trips.length === 0) return null;

  // Trier par budget (petit → gros) et appliquer le système 40/30/30
  const sorted = [...trips].sort((a, b) => {
    const ba = parseInt((a.budget || '0').replace(/[^\d]/g, '')) || 0;
    const bb = parseInt((b.budget || '0').replace(/[^\d]/g, '')) || 0;
    return ba - bb;
  });

  const total = sorted.length;
  const freeCount = Math.ceil(total * 0.4);      // 40% visible
  const premiumCount = Math.ceil(total * 0.3);    // 30% semi-voilé
  // reste = 30% verrouillé

  return (
    <section className="py-20 px-4 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2" style={{
          background: "linear-gradient(135deg, #c8a94a 0%, #f5d87a 35%, #e4c057 65%, #f0d070 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {lang === 'fr' ? 'Parcours prêts à vivre' : 'Ready-to-go Itineraries'}
        </h2>
        <p className="text-white/30 text-sm text-center mb-3">
          {lang === 'fr' ? 'Sélectionnés, testés, personnalisables sur mesure.' : 'Selected, tested, fully customizable.'}
        </p>

        {/* Légende des niveaux */}
        <div className="flex justify-center gap-4 mb-8">
          <span className="flex items-center gap-1.5 text-[10px] text-white/40"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Accessible</span>
          <span className="flex items-center gap-1.5 text-[10px] text-white/40"><span className="w-2 h-2 rounded-full bg-secondary" /> Premium</span>
          <span className="flex items-center gap-1.5 text-[10px] text-white/40"><span className="w-2 h-2 rounded-full bg-amber-400" /> Privé</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((trip: any, index: number) => {
            const emoji = Object.entries(PARCOURS_EMOJI).find(([key]) => trip.destination?.includes(key))?.[1] || '🌍';
            const isVerified = trip.isVerified;
            const isTrending = (trip.forkCount || 0) >= 3;

            // Déterminer le niveau d'accès
            const accessLevel: 'free' | 'premium' | 'locked' =
              index < freeCount ? 'free' :
              index < freeCount + premiumCount ? 'premium' : 'locked';

            const isBlurred = accessLevel === 'locked';
            const isSemiBlurred = accessLevel === 'premium';

            // Couleur de bordure selon le niveau
            const borderColor = accessLevel === 'free' ? 'border-emerald-500/20 hover:border-emerald-500/40'
              : accessLevel === 'premium' ? 'border-secondary/20 hover:border-secondary/40'
              : 'border-amber-500/20 hover:border-amber-500/30';

            // Lien vers la page détail du parcours (pas le chat)
            const slug = trip.seoSlug || trip.shareCode || trip.id;
            const linkTarget = isBlurred ? '/auth' : `/parcours/${slug}`;

            return (
              <Link
                key={trip.id}
                to={linkTarget}
                className={`group relative bg-white/3 border rounded-2xl overflow-hidden transition-all ${borderColor} ${!isBlurred ? 'hover:scale-[1.02]' : ''}`}
              >
                {/* Header visuel */}
                <div className={`h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden ${isSemiBlurred ? 'opacity-80' : ''}`}>
                  <span className={`text-5xl transition-transform duration-500 ${isBlurred ? 'opacity-10 blur-sm' : 'opacity-30 group-hover:scale-110'}`}>{emoji}</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {accessLevel === 'free' && (
                      <span className="bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        Accessible
                      </span>
                    )}
                    {accessLevel === 'premium' && (
                      <span className="bg-secondary/20 backdrop-blur-sm text-secondary text-[9px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        ✦ Premium
                      </span>
                    )}
                    {accessLevel === 'locked' && (
                      <span className="bg-amber-500/20 backdrop-blur-sm text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-0.5">
                        <Lock className="h-2.5 w-2.5" /> Privé
                      </span>
                    )}
                    {isVerified && !isBlurred && (
                      <span className="bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 whitespace-nowrap">
                        <CheckCircle className="h-2.5 w-2.5" /> Vérifié
                      </span>
                    )}
                    {isTrending && !isBlurred && (
                      <span className="bg-purple-500/20 backdrop-blur-sm text-purple-400 text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 whitespace-nowrap">
                        <TrendingUp className="h-2.5 w-2.5" /> Populaire
                      </span>
                    )}
                  </div>

                  {/* Destination */}
                  <div className={`absolute bottom-2 left-3 right-3 ${isBlurred ? 'blur-[6px]' : ''}`}>
                    <p className="text-white font-bold text-sm truncate">{trip.title || trip.destination}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {trip.destination && <span className="text-white/50 text-[10px] flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {trip.destination}</span>}
                      {trip.duration && <span className="text-white/30 text-[10px]">{trip.duration}</span>}
                    </div>
                  </div>
                </div>

                {/* Overlay verrouillé pour Privé */}
                {isBlurred && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                    <Lock className="h-5 w-5 text-amber-400/70 mb-1.5" />
                    <p className="text-amber-400/80 text-xs font-semibold">Parcours Privé</p>
                    <p className="text-white/30 text-[10px] mt-0.5">Débloquer avec le plan Privé</p>
                  </div>
                )}

                {/* Semi-voile pour Premium */}
                {isSemiBlurred && (
                  <div className="absolute top-0 right-0 left-0 h-32 flex items-start justify-end p-2 z-10 pointer-events-none">
                    <span className="bg-slate-900/80 backdrop-blur-sm text-secondary text-[9px] px-2 py-1 rounded-lg font-medium">
                      Aperçu · Plan Premium
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className={`p-3 flex items-center justify-between ${isBlurred ? 'blur-[4px]' : ''}`}>
                  <div>
                    {trip.budget && <span className="text-secondary text-xs font-semibold">{trip.budget}</span>}
                    {trip.user && <span className="text-white/20 text-[10px] ml-2">par {trip.user.prenom || trip.user.pseudo}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {(trip.forkCount || 0) > 0 && !isBlurred && <span className="text-white/20 text-[10px]">{trip.forkCount}× utilisé</span>}
                    <span className="text-secondary/60 text-xs font-medium group-hover:text-secondary transition-colors whitespace-nowrap">
                      {isBlurred ? '' : isSemiBlurred ? 'Voir →' : 'Personnalisable →'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA conversion */}
        <div className="mt-10 text-center">
          <p className="text-white/25 text-xs mb-4">
            {lang === 'fr' ? 'Chaque parcours est personnalisable sur mesure selon vos envies et votre budget.' : 'Each itinerary is fully customizable to your preferences and budget.'}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/chat" className="bg-secondary hover:bg-secondary/90 text-slate-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all whitespace-nowrap">
              Créer mon parcours
            </Link>
            <Link to="/auth" className="border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm px-6 py-2.5 rounded-xl transition-all whitespace-nowrap">
              Voir tous les parcours
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
