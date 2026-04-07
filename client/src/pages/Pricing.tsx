import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles, Brain, Globe, Shield, Clock, Zap, Star, Users } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useState } from "react";

const FREE_FEATURES = [
  "Accès aux offres avec réductions",
  "3 parcours MAYA (1 enregistrable)",
  "Pseudo, email et parcours sauvegardé",
  "Destinations réservées enregistrées",
];

const STANDARD_FEATURES = [
  "15 crédits/mois (solo) — 25 crédits/mois (duo)",
  "≈ 5 parcours MAYA par mois (solo)",
  "Profil enrichi & mémoire IA",
  "Offres exclusives premium",
  "Sauvegarde illimitée de favoris",
  "Accès programme ambassadeur",
  "Recharge crédits possible à la carte",
  "Mise en pause possible",
];

const UNLIMITED_FEATURES = [
  "Crédits illimités — parcours sans limite",
  "Tout Standard inclus",
  "Conciergerie par chat prioritaire",
  "Parcours personnalisés avec carte GPS",
  "Fiches détaillées & secrets d'initiés",
  "Collections & favoris illimités",
  "Notifications proactives MAYA",
  "Mise en pause possible (2 mois/an)",
];

const CLUB_FEATURES = [
  "Tout Illimité inclus",
  "Recommandations proactives off-market",
  "Mode Fantôme (anonymat total)",
  "Réservations anonymisées",
  "Conciergerie prioritaire 24/7",
  "Accès ventes privées & yachts",
  "Événements exclusifs Club Privé",
  "Mise en pause illimitée",
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [isDuo, setIsDuo] = useState(false);

  const handleSubscribe = (planName: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    toast.info(`L'abonnement ${planName} sera bientôt disponible. Stripe en cours d'intégration.`);
  };

  const handleWaitlist = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    toast.success("Vous êtes inscrit à la liste d'attente du Club Privé.");
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      <header className="border-b border-white/8 px-4 py-3 sticky top-0 z-20 bg-[#080c14]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/">
            <ArrowLeft size={20} className="text-white/40 hover:text-[#c8a94a] transition-colors" />
          </Link>
          <h1 className="font-['Playfair_Display'] text-lg font-semibold">Forfaits</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold mb-4">
            Votre concierge IA,<br />
            <span className="text-[#c8a94a]">sans limites</span>
          </h2>
          <p className="text-white/50 max-w-md mx-auto text-sm">Des forfaits pensés pour chaque ambition de voyage.</p>
        </motion.div>

        {/* Toggle Solo / Duo */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#111118] rounded-full p-1 flex gap-1 border border-white/8">
            <button
              onClick={() => setIsDuo(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isDuo ? "bg-[#c8a94a] text-[#080c14]" : "text-white/50 hover:text-white/70"}`}
            >
              Solo
            </button>
            <button
              onClick={() => setIsDuo(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${isDuo ? "bg-[#c8a94a] text-[#080c14]" : "text-white/50 hover:text-white/70"}`}
            >
              <Users size={14} /> Duo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Social Club Standard */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111118] rounded-2xl p-7 flex flex-col border border-white/8">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-[#c8a94a]" />
                <h3 className="font-['Playfair_Display'] text-xl font-semibold">Social Club</h3>
              </div>
              <p className="text-xs text-white/40">Standard — Crédits mensuels</p>
            </div>
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#c8a94a]">{isDuo ? "14,30€" : "9,90€"}</span>
                <span className="text-white/40 text-sm">/mois</span>
              </div>
              <p className="text-white/30 text-xs mt-1">
                {isDuo ? "25 crédits/mois · 2 profils" : "15 crédits/mois · 1 profil"}
              </p>
              <p className="text-white/20 text-[10px] mt-1">1 parcours = 3 crédits · 1 recherche = 1 crédit</p>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {STANDARD_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check size={14} className="text-[#c8a94a] shrink-0 mt-0.5" />
                  <span className="text-white/60">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-semibold rounded-xl"
              onClick={() => handleSubscribe(isDuo ? "Social Club Standard Duo" : "Social Club Standard Solo")}
            >
              {isDuo ? "Choisir Duo — 14,30€/mois" : "Choisir Standard — 9,90€/mois"}
            </Button>
          </motion.div>

          {/* Social Club Illimité */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111118] rounded-2xl p-7 border border-[#c8a94a]/30 relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#c8a94a] text-[#080c14] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Le plus populaire
            </div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={16} className="text-[#c8a94a]" />
                <h3 className="font-['Playfair_Display'] text-xl font-semibold">Social Club</h3>
              </div>
              <p className="text-xs text-white/40">Illimité — Sans restriction</p>
            </div>
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#c8a94a]">{isDuo ? "37€" : "29,90€"}</span>
                <span className="text-white/40 text-sm">/mois</span>
              </div>
              <p className="text-white/30 text-xs mt-1">
                {isDuo ? "Crédits illimités · 2 profils" : "Crédits illimités · 1 profil"}
              </p>
              <p className="text-white/20 text-[10px] mt-1">Sans engagement — Annulable à tout moment</p>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {UNLIMITED_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check size={14} className="text-[#c8a94a] shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-semibold gap-2 rounded-xl"
              onClick={() => handleSubscribe(isDuo ? "Social Club Illimité Duo" : "Social Club Illimité Solo")}
            >
              <Sparkles size={16} />
              {isDuo ? "Devenir Illimité Duo — 37€/mois" : "Devenir Illimité — 29,90€/mois"}
            </Button>
          </motion.div>
        </div>

        {/* Club Privé */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111118] rounded-2xl p-7 border border-purple-500/20 relative mb-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} className="text-purple-400" />
                <h3 className="font-['Playfair_Display'] text-xl font-semibold">Club Privé</h3>
              </div>
              <p className="text-xs text-white/40 mb-4">L'excellence absolue — Sur invitation</p>
              <div className="mb-5">
                <span className="text-3xl font-bold text-purple-400">Sur mesure</span>
                <p className="text-white/30 text-xs mt-1">Tarification personnalisée selon vos besoins</p>
              </div>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleWaitlist}
                  className="bg-purple-500/20 text-purple-300 text-sm font-medium px-5 py-2.5 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                >
                  S'inscrire à la liste d'attente
                </button>
                <span className="flex items-center text-white/30 text-xs px-3 border border-white/8 rounded-xl">
                  Sur invitation
                </span>
              </div>
              <p className="text-white/30 text-xs leading-relaxed">
                Accumulez 10 000 points via le programme ambassadeur pour accéder à la liste d'attente, ou achetez directement 10 000 points.
              </p>
            </div>
            <div>
              <ul className="space-y-2.5">
                {CLUB_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-white/60">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Forfait Gratuit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#0e0e16] rounded-2xl p-6 mb-10 border border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Playfair_Display'] text-lg font-semibold mb-1">Compte Gratuit</h3>
              <p className="text-sm text-white/40">Essayez Baymora sans carte bancaire</p>
              <ul className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-white/50">
                    <Check size={12} className="text-white/30 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white/70 hover:border-[#c8a94a]/30 shrink-0 rounded-xl"
            >
              <a href={isAuthenticated ? "/chat" : getLoginUrl()}>
                Essayer gratuitement
              </a>
            </Button>
          </div>
        </motion.div>

        {/* 1 parcours offert */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-gradient-to-r from-[#c8a94a]/10 to-[#c8a94a]/5 rounded-2xl p-6 mb-10 border border-[#c8a94a]/20 text-center">
          <Sparkles className="h-6 w-6 text-[#c8a94a] mx-auto mb-2" />
          <h3 className="font-['Playfair_Display'] text-lg font-semibold mb-1">1 parcours offert</h3>
          <p className="text-white/50 text-sm">Créez votre profil et recevez un parcours MAYA complet offert, sans engagement.</p>
        </motion.div>

        {/* Recharges crédits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-12">
          <h3 className="font-['Playfair_Display'] text-xl text-center mb-2">Crédits à la carte</h3>
          <p className="text-sm text-white/40 text-center mb-6">Besoin de plus ? Rechargez sans changer de forfait.</p>
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {[
              { credits: 5, price: "4,90€", unit: "0,98€/crédit" },
              { credits: 15, price: "11,90€", unit: "0,79€/crédit" },
              { credits: 30, price: "19,90€", unit: "0,66€/crédit" },
            ].map((pack) => (
              <button
                key={pack.credits}
                onClick={() => toast.info("Les recharges seront disponibles prochainement.")}
                className="bg-[#111118] rounded-xl border border-white/8 hover:border-[#c8a94a]/30 transition-all p-4 text-center"
              >
                <div className="text-[#c8a94a] font-bold text-xl mb-0.5">{pack.credits}</div>
                <div className="text-white/70 text-sm font-medium">{pack.price}</div>
                <div className="text-white/30 text-[10px] mt-1">{pack.unit}</div>
              </button>
            ))}
          </div>
          <p className="text-center text-white/20 text-xs mt-4">
            Astuce : si vous rechargez souvent, l'Illimité à {isDuo ? "37€" : "29,90€"}/mois est plus rentable.
          </p>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: "IA de pointe" },
            { icon: Globe, label: "Couverture mondiale" },
            { icon: Shield, label: "Données sécurisées" },
            { icon: Clock, label: "Disponible 24/7" },
          ].map((item, i) => (
            <div key={i} className="text-center py-4">
              <item.icon size={20} className="text-[#c8a94a] mx-auto mb-2" />
              <p className="text-xs text-white/40">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
