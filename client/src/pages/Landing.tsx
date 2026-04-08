import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Sparkles, Star, Shield, Zap, ChevronRight, Users } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";
const HERO_IMG = `${CDN}/hero_yacht_sunset_b173a771.jpg`;
const GASTRO_IMG = `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`;
const SPA_IMG = `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`;
const HOTEL_IMG = `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`;
const TOKYO_IMG = `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`;
const MARRAKECH_IMG = `${CDN}/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp`;
const SANTORINI_IMG = `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`;

const FEATURES = [
  {
    icon: "✨",
    title: "Maya, votre IA de conciergerie",
    desc: "Dites a Maya ce dont vous revez. Elle cree votre parcours ideal de A a Z : hotel, restaurants, activites, transport.",
  },
  {
    icon: "🏷️",
    title: "Jusqu'a -40% sur des adresses premium",
    desc: "Remises negociees en direct avec les meilleurs etablissements. Exclusif aux membres Baymora.",
  },
  {
    icon: "🗺️",
    title: "Parcours sur-mesure illimites",
    desc: "Creez, sauvegardez et partagez vos voyages. Chaque parcours est unique, coordonne et personnalise.",
  },
  {
    icon: "👑",
    title: "Club prive & evenements",
    desc: "Acces a des experiences exclusives, des soirees privees et des rencontres entre membres selectifs.",
  },
];

const TESTIMONIALS = [
  {
    name: "Camille R.",
    role: "Membre Social Club",
    text: "Maya a organise mon voyage a Tokyo en 10 minutes. Hotel, restaurants, activites — tout etait parfait. Je n'aurais jamais trouve ca seule.",
    rating: 5,
  },
  {
    name: "Alexandre M.",
    role: "Membre depuis 2024",
    text: "Les remises sont reelles. J'ai economise 340€ sur mon week-end a Paris. L'abonnement se rembourse en une seule reservation.",
    rating: 5,
  },
  {
    name: "Sofia L.",
    role: "Membre Duo",
    text: "Nous utilisons Baymora pour tous nos voyages en couple. Maya connait nos gouts et ne se trompe jamais. Indispensable.",
    rating: 5,
  },
];

const STATS = [
  { value: "12 000+", label: "Membres actifs" },
  { value: "340+", label: "Adresses partenaires" },
  { value: "-35%", label: "Remise moyenne" },
  { value: "4.9/5", label: "Satisfaction" },
];

export default function Landing() {
  const loginUrl = getLoginUrl("/maison");

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6" }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(7, 11, 20, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
          >
            <span className="font-bold text-sm" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
          </div>
          <span className="font-semibold hidden sm:block" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Maison Baymora
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={loginUrl}
            className="text-sm font-medium px-4 py-2 rounded-full"
            style={{ color: "#8B8D94" }}
          >
            Se connecter
          </a>
          <a
            href={loginUrl}
            className="text-sm font-semibold px-5 py-2 rounded-full"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            Rejoindre
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(7,11,20,0.85) 0%, rgba(7,11,20,0.6) 50%, rgba(7,11,20,0.8) 100%)" }}
        />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(200, 169, 110, 0.15)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.3)" }}
          >
            <Sparkles size={12} />
            Club prive de conciergerie IA
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Vivez les experiences
            <span className="block" style={{ color: "#C8A96E" }}>que vous meritez</span>
          </h1>

          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(240, 237, 230, 0.7)" }}>
            Maya, votre IA de conciergerie, cree vos voyages sur-mesure et negocie pour vous jusqu'a -40% dans les meilleurs etablissements du monde.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={loginUrl}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            >
              <Sparkles size={18} />
              Parler a Maya gratuitement
            </a>
            <Link href="/offres">
              <button
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-medium"
                style={{ background: "rgba(200, 169, 110, 0.1)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.25)" }}
              >
                Voir les offres
                <ChevronRight size={16} />
              </button>
            </Link>
          </div>

          <p className="text-xs mt-4" style={{ color: "#8B8D94" }}>
            3 conversations gratuites · Sans carte bancaire
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-0.5 h-8 rounded-full" style={{ background: "rgba(200, 169, 110, 0.3)" }} />
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4" style={{ borderTop: "1px solid rgba(200, 169, 110, 0.08)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl md:text-3xl font-bold mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "#C8A96E" }}
              >
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "#8B8D94" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Galerie adresses */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Des adresses d'exception
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>
            Selectionnees et negociees par notre equipe
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { img: HOTEL_IMG, name: "Plaza Athenee", city: "Paris", pct: 28 },
              { img: SPA_IMG, name: "Four Seasons", city: "Bali", pct: 35 },
              { img: SANTORINI_IMG, name: "Canaves Oia", city: "Santorini", pct: 22 },
              { img: TOKYO_IMG, name: "Aman Tokyo", city: "Tokyo", pct: 15 },
              { img: MARRAKECH_IMG, name: "La Mamounia", city: "Marrakech", pct: 18 },
              { img: GASTRO_IMG, name: "Le Cinq", city: "Paris", pct: 22 },
            ].map((item, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden card-hover cursor-pointer"
                style={{ paddingTop: "66.67%" }}
              >
                <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.8) 0%, transparent 50%)" }} />
                <div
                  className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "#16a34a", color: "white" }}
                >
                  -{item.pct}%
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="text-sm font-semibold" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>{item.name}</div>
                  <div className="text-xs" style={{ color: "#8B8D94" }}>{item.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Tout ce que vous meritez
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "#8B8D94" }}>
            Un club concu pour les personnes qui exigent le meilleur
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 flex gap-4"
                style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.1)" }}
              >
                <div className="text-3xl flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: "#F0EDE6" }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8B8D94" }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Temoignages */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Ce que disent nos membres
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.1)" }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={12} color="#C8A96E" fill="#C8A96E" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#8B8D94" }}>"{t.text}"</p>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: "#C8A96E" }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing simplifie */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Choisissez votre acces
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>
            Commencez gratuitement, evoluez a votre rythme
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Decouverte",
                price: "Gratuit",
                features: ["3 conversations Maya", "Offres avec remise", "1 parcours essai"],
                highlight: false,
                cta: "Commencer",
              },
              {
                name: "Social Club",
                price: "9,90€/mois",
                features: ["Maya illimitee", "Parcours illimites", "Offres exclusives", "Evenements prives"],
                highlight: true,
                cta: "Rejoindre le Club",
              },
              {
                name: "Duo",
                price: "14,90€/mois",
                features: ["Tout Social Club", "2 profils lies", "Parcours en commun"],
                highlight: false,
                cta: "Choisir Duo",
              },
              {
                name: "Annuel",
                price: "89€/an",
                features: ["Social Club 12 mois", "25% de reduction", "Acces prioritaire", "Cadeau de bienvenue"],
                highlight: false,
                cta: "Economiser 25%",
              },
            ].map((plan, i) => (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{
                  background: plan.highlight ? "rgba(200, 169, 110, 0.06)" : "#0D1117",
                  border: plan.highlight ? "1px solid rgba(200, 169, 110, 0.35)" : "1px solid rgba(200, 169, 110, 0.1)",
                }}
              >
                <h3 className="font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>{plan.name}</h3>
                <div className="text-xl font-bold mb-3" style={{ color: plan.highlight ? "#C8A96E" : "#F0EDE6" }}>{plan.price}</div>
                <div className="space-y-1.5 mb-4">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs" style={{ color: "#8B8D94" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C8A96E" }} />
                      {f}
                    </div>
                  ))}
                </div>
                <a href={loginUrl}>
                  <button
                    className="w-full py-2.5 rounded-full text-sm font-semibold"
                    style={{
                      background: plan.highlight ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(200, 169, 110, 0.1)",
                      color: plan.highlight ? "#070B14" : "#C8A96E",
                      border: plan.highlight ? "none" : "1px solid rgba(200, 169, 110, 0.2)",
                    }}
                  >
                    {plan.cta}
                  </button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
          >
            <Sparkles size={28} color="#070B14" />
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Pret a vivre autrement ?
          </h2>
          <p className="text-sm mb-6" style={{ color: "#8B8D94" }}>
            Rejoignez 12 000 membres qui voyagent mieux, pour moins cher.
          </p>
          <a
            href={loginUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            <Sparkles size={18} />
            Commencer gratuitement
          </a>
          <p className="text-xs mt-3" style={{ color: "#8B8D94" }}>
            Sans carte bancaire · Annulation a tout moment
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8" style={{ borderTop: "1px solid rgba(200, 169, 110, 0.08)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
            >
              <span className="font-bold text-xs" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
            </div>
            <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>Maison Baymora</span>
          </div>
          <div className="flex gap-5 text-xs" style={{ color: "#8B8D94" }}>
            <a href="#" className="hover:text-[#C8A96E] transition-colors">Mentions legales</a>
            <a href="#" className="hover:text-[#C8A96E] transition-colors">Confidentialite</a>
            <a href="#" className="hover:text-[#C8A96E] transition-colors">CGU</a>
            <a href="#" className="hover:text-[#C8A96E] transition-colors">Contact</a>
          </div>
          <span className="text-xs" style={{ color: "#8B8D94" }}>© 2025 Maison Baymora</span>
        </div>
      </footer>
    </div>
  );
}
