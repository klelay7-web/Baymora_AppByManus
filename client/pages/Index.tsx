import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Sparkles, Crown, Users, Star, MessageSquare } from "lucide-react";
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
  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#080c14]/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/40 to-secondary/10 border border-secondary/20 flex items-center justify-center">
              <span className="text-secondary font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-white text-base tracking-tight">Baymora</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Lang switcher */}
            <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5 mr-2">
              {(["fr","en"] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${lang === l ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <Link to="/partner" className="text-white/30 hover:text-white/60 text-xs transition-colors hidden sm:block">
              {t.nav.partners}
            </Link>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <button className="bg-white/6 border border-white/12 text-white/70 text-xs px-3.5 py-1.5 rounded-full hover:bg-white/12 transition-all">
                  {t.nav.mySpace}
                </button>
              </Link>
            ) : (
              <Link to="/auth">
                <button className="bg-white/6 border border-white/12 text-white/70 text-xs px-3.5 py-1.5 rounded-full hover:bg-white/12 transition-all">
                  {t.nav.login}
                </button>
              </Link>
            )}

            <Link to="/chat">
              <button className="bg-secondary text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-secondary/90 transition-all flex items-center gap-1.5">
                {t.nav.start} <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-16 px-4 text-center">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary/6 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/12 rounded-full px-4 py-1.5 mb-10">
            <Star className="h-3 w-3 text-secondary" />
            <span className="text-white/50 text-xs tracking-wide">{t.hero.badge}</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-6 tracking-tight">
            <span style={shimmer}>{t.hero.h1a}</span>
            <br />
            <span style={gold}>{t.hero.h1b}</span>
            <br />
            <span style={shimmer}>{t.hero.h1c}</span>
          </h1>

          <p className="text-white/40 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            {t.hero.sub}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/chat">
              <button className="bg-secondary text-white font-bold px-8 py-3.5 rounded-full text-sm hover:bg-secondary/90 transition-all flex items-center justify-center gap-2">
                {t.hero.cta} <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="#plans">
              <button className="bg-white/5 border border-white/12 text-white/50 font-medium px-8 py-3.5 rounded-full text-sm hover:bg-white/10 transition-all">
                {t.hero.ctaSub}
              </button>
            </a>
          </div>

          <p className="text-white/18 text-xs mt-6">{t.hero.fine}</p>
        </div>
      </section>

      {/* ── Chat preview ── */}
      <section className="py-10 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 bg-black/30">
              <div className="w-7 h-7 rounded-full bg-secondary/20 border border-secondary/25 flex items-center justify-center">
                <span className="text-secondary font-bold text-xs">B</span>
              </div>
              <div>
                <p className="text-white font-semibold text-xs">Baymora</p>
                <p className="text-white/25 text-xs">Conciergerie de voyage</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-white/20 text-xs">{lang === "fr" ? "En ligne" : "Online"}</span>
              </div>
            </div>
            {/* Messages */}
            <div className="p-4 space-y-3">
              {t.how.steps.map((s, i) => (
                <div key={i} className={`flex ${s.who === "Vous" || s.who === "You" ? "justify-end" : "justify-start"} gap-2`}>
                  {(s.who === "Baymora") && (
                    <div className="w-6 h-6 rounded-full bg-secondary/20 border border-secondary/25 flex items-center justify-center flex-shrink-0 mt-auto">
                      <span className="text-secondary font-bold" style={{ fontSize: 9 }}>B</span>
                    </div>
                  )}
                  <div className={`text-xs px-3.5 py-2.5 rounded-2xl max-w-[80%] leading-relaxed ${
                    s.who === "Vous" || s.who === "You"
                      ? "bg-secondary/75 text-white rounded-br-sm"
                      : "bg-white/8 border border-white/10 text-white/80 rounded-bl-sm"
                  }`}>
                    {s.msg}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/15 text-xs text-center mt-3">
            {lang === "fr" ? "Exemple de conversation avec Baymora" : "Sample conversation with Baymora"}
          </p>
        </div>
      </section>

      {/* ── Pourquoi ── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={shimmer}>{t.why.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.why.items.map(f => (
              <div key={f.title} className="bg-white/3 border border-white/8 rounded-2xl p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section id="plans" className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2" style={gold}>{t.plans.title}</h2>
          <p className="text-white/30 text-sm text-center mb-12">{t.plans.sub}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <h3 className="text-white font-bold text-base">{p.circle}</h3>
                  <p className="text-white/60 font-bold text-xl mt-1">{p.price}</p>
                </div>
                <ul className="space-y-1.5 flex-1 mb-5">
                  {p.features[lang].map(f => (
                    <li key={f} className="flex items-start gap-2 text-white/40 text-xs">
                      <span className="text-secondary mt-0.5 text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/chat">
                  <button className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
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

      {/* ── Confidentialité ── */}
      <section className="py-14 px-4 border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-4 w-4 text-white/30" />
          </div>
          <h2 className="text-xl font-bold mb-3" style={shimmer}>{t.privacy.title}</h2>
          <p className="text-white/30 text-sm leading-relaxed mb-5">{t.privacy.text}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {t.privacy.tags.map(tag => (
              <span key={tag} className="bg-white/4 border border-white/8 rounded-full px-3 py-1 text-white/25 text-xs">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-lg mx-auto text-center relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-secondary/5 rounded-full blur-[60px]" />
          </div>
          <h2 className="relative text-4xl sm:text-5xl font-bold mb-4 leading-tight whitespace-pre-line" style={gold}>
            {t.finalCta.title}
          </h2>
          <p className="text-white/25 text-sm mb-8">{t.finalCta.sub}</p>
          <Link to="/chat">
            <button className="bg-secondary text-white font-bold px-10 py-4 rounded-full text-base hover:bg-secondary/90 transition-all inline-flex items-center gap-2">
              {t.finalCta.btn} <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* ── Affiliés ── */}
      <section className="py-10 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-secondary/60" />
                <span className="text-white/60 font-semibold text-sm">{t.affiliate.title}</span>
              </div>
              <p className="text-white/25 text-xs">{t.affiliate.desc}</p>
            </div>
            <Link to="/partner" className="flex-shrink-0">
              <button className="bg-white/6 border border-white/12 text-white/45 text-xs font-medium px-4 py-2 rounded-full hover:bg-white/12 transition-all whitespace-nowrap">
                {t.affiliate.cta}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-secondary/20 border border-secondary/20 flex items-center justify-center">
              <span className="text-secondary font-bold" style={{ fontSize: 10 }}>B</span>
            </div>
            <span className="text-white/40 text-sm font-medium">Baymora</span>
            <span className="text-white/12 text-xs hidden sm:block">— {t.footer.tagline}</span>
          </div>
          <div className="flex items-center gap-4 text-white/20 text-xs">
            <Link to="/chat" className="hover:text-white/45 transition-colors">{t.footer.links[0]}</Link>
            <Link to="/auth" className="hover:text-white/45 transition-colors">{t.footer.links[1]}</Link>
            <Link to="/partner" className="hover:text-white/45 transition-colors">{t.footer.links[2]}</Link>
            <Link to="/admin" className="hover:text-white/45 transition-colors">{t.footer.links[3]}</Link>
            <span className="text-white/10">© 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
