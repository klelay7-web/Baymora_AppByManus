import { Link } from "wouter";
import { Gift, Users, TrendingUp, Award, ChevronRight, Star, Zap, Shield } from "lucide-react";
import MobileBackButton from "../components/MobileBackButton";
import { useAuth } from "../_core/hooks/useAuth";
import { getLoginUrl } from "../const";

const TIERS = [
  {
    name: "Bronze",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    commission: "10%",
    condition: "0 filleul",
    perks: ["Lien de parrainage unique", "Dashboard ambassadeur", "Commission sur chaque abonnement"],
  },
  {
    name: "Argent",
    color: "text-gray-300",
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    commission: "15%",
    condition: "5 filleuls actifs",
    perks: ["Tout Bronze", "Badge Argent visible", "Accès prioritaire aux nouveautés"],
  },
  {
    name: "Or",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    commission: "20%",
    condition: "15 filleuls actifs",
    perks: ["Tout Argent", "Invitation événements VIP", "Co-création de parcours exclusifs"],
  },
  {
    name: "Platine",
    color: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    commission: "25%",
    condition: "50 filleuls actifs",
    perks: ["Tout Or", "Conciergerie personnelle offerte", "Revenus passifs récurrents"],
  },
];

const STEPS = [
  { icon: Users, title: "Inscrivez-vous", desc: "Créez votre compte et accédez à votre dashboard ambassadeur avec votre lien unique." },
  { icon: Gift, title: "Partagez", desc: "Envoyez votre lien à vos proches, collègues, communauté. Chaque inscription compte." },
  { icon: TrendingUp, title: "Gagnez", desc: "Recevez une commission récurrente sur chaque abonnement généré par vos filleuls." },
  { icon: Award, title: "Montez en grade", desc: "Plus vous parrainez, plus votre taux de commission augmente. Jusqu'à 25%." },
];

export default function AmbassadeurInfo() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <MobileBackButton />

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-xs text-amber-400 font-medium mb-6">
            <Star size={12} /> Programme Ambassadeur
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Devenez <span className="text-amber-400">Ambassadeur</span> Baymora
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
            Partagez l'excellence du voyage premium et gagnez des commissions récurrentes sur chaque abonnement généré.
          </p>
        </div>

        {/* Comment ça marche */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-8 text-center">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <Icon size={20} className="text-amber-400" />
                  </div>
                  <div className="text-xs text-amber-400 font-semibold mb-1">Étape {i + 1}</div>
                  <h3 className="text-sm font-semibold mb-2">{step.title}</h3>
                  <p className="text-xs text-white/50">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Niveaux */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-2 text-center">Les niveaux Ambassadeur</h2>
          <p className="text-white/50 text-sm text-center mb-8">Plus vous parrainez, plus vous gagnez.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIERS.map((tier) => (
              <div key={tier.name} className={`${tier.bg} border ${tier.border} rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-bold ${tier.color}`}>{tier.name}</h3>
                  <span className={`text-2xl font-bold ${tier.color}`}>{tier.commission}</span>
                </div>
                <p className="text-xs text-white/40 mb-3">{tier.condition}</p>
                <ul className="space-y-1.5">
                  {tier.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <Zap size={10} className={`${tier.color} mt-0.5 flex-shrink-0`} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ rapide */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 text-center">Questions fréquentes</h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              { q: "Combien puis-je gagner ?", a: "De 10% à 25% de commission récurrente sur chaque abonnement de vos filleuls. Un filleul Premium à 29,90€/mois vous rapporte entre 2,99€ et 7,48€/mois — à vie." },
              { q: "Quand suis-je payé ?", a: "Les commissions sont créditées mensuellement sur votre solde Baymora. Vous pouvez demander un virement dès 50€ accumulés." },
              { q: "Mes filleuls ont-ils un avantage ?", a: "Oui ! Chaque filleul bénéficie de 3 messages ARIA gratuits supplémentaires à l'inscription via votre lien." },
              { q: "Puis-je perdre mon niveau ?", a: "Votre niveau est basé sur le nombre de filleuls actifs (avec abonnement en cours). Si des filleuls se désabonnent, votre niveau peut être ajusté." },
            ].map((faq, i) => (
              <details key={i} className="group bg-white/5 border border-white/10 rounded-xl">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-white/80 hover:text-white">
                  {faq.q}
                  <ChevronRight size={14} className="text-white/30 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-xs text-white/50 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Garanties */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-12 text-center">
          <Shield size={24} className="text-amber-400 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Transparence totale</h3>
          <p className="text-xs text-white/50 max-w-lg mx-auto">
            Votre dashboard affiche en temps réel : filleuls, commissions gagnées, en attente, et votre taux actuel. 
            Aucun frais caché, aucun engagement minimum.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          {user ? (
            <Link href="/ambassadeur">
              <button className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold px-8 py-3 rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                Accéder à mon Dashboard Ambassadeur
              </button>
            </Link>
          ) : (
            <a href={getLoginUrl()} className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold px-8 py-3 rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all">
              Rejoindre le programme
            </a>
          )}
          <p className="text-xs text-white/30 mt-3">Inscription gratuite · Aucun engagement</p>
        </div>
      </div>
    </div>
  );
}
