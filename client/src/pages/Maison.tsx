import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sparkles, ChevronRight, Heart, MapPin, Star, Users, Gift } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";
const HERO_IMG = `${CDN}/hero_yacht_sunset_b173a771.jpg`;
const GASTRO_IMG = `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`;
const SPA_IMG = `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`;
const HOTEL_IMG = `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`;
const TOKYO_IMG = `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`;
const MARRAKECH_IMG = `${CDN}/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp`;
const SANTORINI_IMG = `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`;
const ROOFTOP_IMG = `${CDN}/baymora-attiko-ny-ksKuanCuwityQbAeuoUSBB.webp`;

const BUNDLES = [
  { title: "5 rooftops secrets de Paris", tag: "Paris", count: 5, img: HOTEL_IMG },
  { title: "Hotels 5* avec piscine", tag: "Mondial", count: 12, img: HERO_IMG },
  { title: "Tables etoilees abordables", tag: "Gastronomie", count: 8, img: GASTRO_IMG },
  { title: "Spas & bien-etre", tag: "Detente", count: 9, img: SPA_IMG },
  { title: "Escapades romantiques", tag: "Couple", count: 6, img: SANTORINI_IMG },
  { title: "Week-ends urbains", tag: "City", count: 14, img: ROOFTOP_IMG },
];

const EXPERIENCES = [
  { title: "Aman Tokyo", city: "Tokyo", badge: "Exclusif", price: "1 200€", img: TOKYO_IMG },
  { title: "La Mamounia", city: "Marrakech", badge: "-28%", price: "380€", img: MARRAKECH_IMG },
  { title: "Canaves Oia", city: "Santorini", badge: "-22%", price: "520€", img: SANTORINI_IMG },
  { title: "Attiko Rooftop", city: "New York", badge: "Exclusif", price: "180€", img: ROOFTOP_IMG },
];

const OFFRES = [
  { name: "Hotel Plaza Athenee", city: "Paris", pct: 28, price: "680€", original: "940€", img: HOTEL_IMG, tag: "Palace" },
  { name: "Le Cinq — Four Seasons", city: "Paris", pct: 22, price: "280€", original: "360€", img: GASTRO_IMG, tag: "Gastronomie" },
  { name: "Four Seasons Bali", city: "Bali", pct: 35, price: "520€", original: "800€", img: SPA_IMG, tag: "Resort" },
  { name: "La Mamounia", city: "Marrakech", pct: 18, price: "420€", original: "510€", img: MARRAKECH_IMG, tag: "Palace" },
];

const PLANS = [
  { name: "Decouverte", price: "Gratuit", features: ["3 conversations Maya", "Offres avec remise", "1 parcours essai"], highlight: false },
  { name: "Social Club", price: "9,90€/mois", features: ["Maya illimitee", "Parcours illimites", "Offres exclusives", "Evenements prives"], highlight: true },
  { name: "Duo", price: "14,90€/mois", features: ["Tout Social Club", "2 profils lies", "Parcours en commun"], highlight: false },
  { name: "Annuel", price: "89€/an", features: ["Social Club 12 mois", "25% de reduction", "Acces prioritaire", "Cadeau de bienvenue"], highlight: false },
];

const FAQ = [
  { q: "Comment fonctionne le parrainage ?", a: "Invitez un ami avec votre lien unique. Quand il souscrit au Social Club, vous recevez 1 mois offert et lui aussi." },
  { q: "Puis-je annuler mon abonnement ?", a: "Oui, a tout moment depuis votre profil. Aucun engagement, aucune penalite." },
  { q: "Maya retient-elle mes preferences ?", a: "Oui. Maya memorise vos goûts, allergies, cercle familial et habitudes de voyage pour personnaliser chaque recommandation." },
];

export default function Maison() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "vous";

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh" }}>
      {/* Hero leger */}
      <section className="relative overflow-hidden px-4 pt-8 pb-10 md:pt-12">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1
                className="text-2xl md:text-4xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
              >
                Bienvenue, <span style={{ color: "#C8A96E" }}>{firstName}</span>
              </h1>
              <p className="text-sm" style={{ color: "#8B8D94" }}>Votre club, vos experiences, vos avantages.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/maya">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                >
                  <Sparkles size={16} />
                  Parler a Maya
                </button>
              </Link>
              <Link href="/offres">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
                  style={{ background: "rgba(200, 169, 110, 0.1)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.25)" }}
                >
                  Voir les offres
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bundles carrousel */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
              Selections Baymora
            </h2>
            <Link href="/offres">
              <span className="text-xs" style={{ color: "#C8A96E" }}>Tout voir →</span>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {BUNDLES.map((bundle, i) => (
              <Link key={i} href="/offres">
                <div
                  className="flex-shrink-0 w-[160px] rounded-2xl overflow-hidden card-hover cursor-pointer"
                  style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
                >
                  <div className="h-[200px] relative">
                    <img src={bundle.img} alt={bundle.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.9) 0%, transparent 50%)" }} />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div
                        className="text-[10px] px-2 py-0.5 rounded-full inline-block mb-1"
                        style={{ background: "rgba(200, 169, 110, 0.2)", color: "#C8A96E" }}
                      >
                        {bundle.tag}
                      </div>
                      <p className="text-xs font-semibold leading-tight" style={{ color: "#F0EDE6" }}>{bundle.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#8B8D94" }}>{bundle.count} adresses</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences legendaires */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Experiences legendaires
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXPERIENCES.map((exp, i) => (
              <Link key={i} href="/offres">
                <div
                  className="rounded-2xl overflow-hidden card-hover cursor-pointer"
                  style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
                >
                  <div className="relative h-36">
                    <img src={exp.img} alt={exp.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.85) 0%, transparent 50%)" }} />
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: exp.badge.startsWith("-") ? "#16a34a" : "rgba(200, 169, 110, 0.9)",
                        color: exp.badge.startsWith("-") ? "white" : "#070B14",
                      }}
                    >
                      {exp.badge}
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-semibold" style={{ color: "#F0EDE6" }}>{exp.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px]" style={{ color: "#8B8D94" }}>{exp.city}</span>
                        <span className="text-xs font-bold" style={{ color: "#C8A96E" }}>{exp.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Offres a proximite */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
              Offres du moment
            </h2>
            <Link href="/offres">
              <span className="text-xs" style={{ color: "#C8A96E" }}>Tout voir →</span>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {OFFRES.map((offer, i) => (
              <Link key={i} href="/offres">
                <div
                  className="flex-shrink-0 w-[220px] rounded-2xl overflow-hidden card-hover cursor-pointer"
                  style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
                >
                  <div className="relative h-32">
                    <img src={offer.img} alt={offer.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.7) 0%, transparent 60%)" }} />
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "#16a34a", color: "white" }}
                    >
                      -{offer.pct}%
                    </div>
                    <button className="absolute top-2 right-2">
                      <Heart size={14} color="rgba(200,169,110,0.6)" />
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="text-[10px] mb-0.5" style={{ color: "#8B8D94" }}>{offer.tag} · {offer.city}</div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#F0EDE6" }}>{offer.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "#C8A96E" }}>{offer.price}</span>
                      <span className="text-xs line-through" style={{ color: "#8B8D94" }}>{offer.original}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Parcours sur-mesure */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
            style={{
              background: "rgba(200, 169, 110, 0.06)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(200, 169, 110, 0.2)",
            }}
          >
            <div className="flex-1">
              <div
                className="text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3"
                style={{ background: "rgba(200, 169, 110, 0.15)", color: "#C8A96E" }}
              >
                MAYA IA
              </div>
              <h2
                className="text-xl md:text-2xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
              >
                Votre parcours sur-mesure
              </h2>
              <p className="text-sm mb-4" style={{ color: "#8B8D94" }}>
                Maya cree votre voyage ideal de A a Z : hotel, restaurants, activites, transport. Tout coordonne, tout personnalise.
              </p>
              <Link href="/maya">
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                >
                  <Sparkles size={16} />
                  Creer mon parcours
                </button>
              </Link>
            </div>
            <div
              className="w-full md:w-48 h-32 md:h-36 rounded-xl overflow-hidden flex-shrink-0"
            >
              <img src={SANTORINI_IMG} alt="Parcours" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Forfaits */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-2 text-center" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Votre acces
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: "#8B8D94" }}>Evoluez a votre rythme.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{
                  background: plan.highlight ? "rgba(200, 169, 110, 0.08)" : "#0D1117",
                  border: plan.highlight ? "1px solid rgba(200, 169, 110, 0.35)" : "1px solid rgba(200, 169, 110, 0.12)",
                }}
              >
                <h3 className="font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>{plan.name}</h3>
                <div className="text-xl font-bold mb-3" style={{ color: plan.highlight ? "#C8A96E" : "#F0EDE6" }}>{plan.price}</div>
                <div className="space-y-1.5">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs" style={{ color: "#8B8D94" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C8A96E" }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parrainage */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(200, 169, 110, 0.12)" }}
            >
              <Gift size={22} color="#C8A96E" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-0.5" style={{ color: "#F0EDE6" }}>Invitez un ami</h3>
              <p className="text-xs" style={{ color: "#8B8D94" }}>Gagnez 1 mois offert pour vous et votre filleul.</p>
            </div>
            <button
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: "rgba(200, 169, 110, 0.12)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.25)" }}
            >
              Inviter
            </button>
          </div>
        </div>
      </section>

      {/* Partenaire CTA */}
      <section className="px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(200, 169, 110, 0.12)" }}
            >
              <Star size={22} color="#C8A96E" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-0.5" style={{ color: "#F0EDE6" }}>Vous etes un etablissement ?</h3>
              <p className="text-xs" style={{ color: "#8B8D94" }}>Rejoignez le reseau Maison Baymora et touchez une clientele premium.</p>
            </div>
            <ChevronRight size={16} color="#C8A96E" className="flex-shrink-0" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold mb-5 text-center" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Questions frequentes
          </h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
              >
                <h3 className="font-medium text-sm mb-2" style={{ color: "#F0EDE6" }}>{item.q}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#8B8D94" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8" style={{ borderTop: "1px solid rgba(200, 169, 110, 0.1)" }}>
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
            <a href="#" className="hover:text-[#C8A96E]">Mentions legales</a>
            <a href="#" className="hover:text-[#C8A96E]">Confidentialite</a>
            <a href="#" className="hover:text-[#C8A96E]">CGU</a>
          </div>
          <span className="text-xs" style={{ color: "#8B8D94" }}>© 2025 Maison Baymora</span>
        </div>
      </footer>
    </div>
  );
}
