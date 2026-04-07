import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft, Check, Crown, Sparkles, Brain, Globe, Shield, Clock,
  Zap, Star, Users, Lock, CreditCard, Gift, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const FREE_FEATURES = [
  "Accès aux offres remisées",
  "3 parcours maximum (1 enregistrable)",
  "Essai IA Maya limité",
  "Pseudo, email et parcours enregistré conservés",
  "Destinations réservées visibles dans le profil",
];

const SOCIAL_STANDARD_FEATURES = [
  "15 crédits / mois (≈ 5 parcours)",
  "1 parcours = 3 crédits (3 propositions)",
  "1 recherche simple Maya = 1 crédit",
  "Profil enrichi + mémoire IA",
  "Offres remisées + bundles",
  "Sauvegarde illimitée de favoris",
  "Partage de parcours",
  "Mise en pause possible (1 mois/an)",
];

const SOCIAL_UNLIMITED_FEATURES = [
  "Crédits illimités",
  "Parcours personnalisés illimités",
  "Carte GPS interactive",
  "Mémoire client complète",
  "Fiches détaillées & secrets d'initiés",
  "Collections & favoris illimités",
  "Programme ambassadeur",
  "Conciergerie par chat",
  "Mise en pause possible (2 mois/an)",
];

const CLUB_PRIVE_FEATURES = [
  "Tout Social Club Illimité inclus",
  "Recommandations proactives",
  "Accès off-market exclusif",
  "Mode Fantôme (anonymat total)",
  "Réservations anonymisées",
  "Conciergerie prioritaire 24/7",
  "Accès ventes privées & yachts",
  "Mise en pause illimitée",
];

const CREDIT_PACKS = [
  { credits: 5, price: "4,90€", perCredit: "0,98€" },
  { credits: 15, price: "11,90€", perCredit: "0,79€" },
  { credits: 30, price: "19,90€", perCredit: "0,66€" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [billingMode, setBillingMode] = useState<"solo" | "duo">("solo");
  const [showCredits, setShowCredits] = useState(false);

  const handleSubscribe = (planName: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/pricing");
      return;
    }
    toast.info(`L'abonnement ${planName} sera bientôt disponible. Stripe en cours d'intégration.`);
  };

  const handleWaitlist = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/pricing");
      return;
    }
    toast.success("Vous êtes inscrit sur la liste d'attente du Club Privé. Nous vous contacterons.");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/">
            <button className="text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1 className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
            Forfaits & Crédits
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        {/* Titre */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-10">
          <p className="text-amber-400 tracking-[0.3em] uppercase text-xs mb-3">Tarifs</p>
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Choisissez votre expérience
          </h2>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            De l'essai gratuit au Club Privé sur mesure — trouvez le forfait qui correspond à votre style de voyage.
          </p>
        </motion.div>

        {/* Toggle Solo / Duo */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex justify-center mb-10">
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => setBillingMode("solo")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingMode === "solo"
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => setBillingMode("duo")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                billingMode === "duo"
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Users size={14} />
              Duo
            </button>
          </div>
        </motion.div>

        {/* Grille forfaits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Gratuit */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0 }}
            className="rounded-2xl p-6 bg-white/[0.02] border border-white/8 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-white/40" />
                <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Gratuit</h3>
              </div>
              <p className="text-white/40 text-xs">Découvrez Baymora sans engagement</p>
            </div>
            <div className="mb-5">
              <span className="text-white text-3xl font-bold">0€</span>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                  <Check size={14} className="text-white/30 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/chat">
              <Button variant="outline" className="w-full border-white/10 text-white/60 hover:border-white/20 hover:text-white">
                Essayer gratuitement
              </Button>
            </Link>
          </motion.div>

          {/* Social Club Standard */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 bg-white/[0.03] border border-amber-400/15 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={16} className="text-amber-400" />
                <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Social Club</h3>
              </div>
              <p className="text-amber-400/60 text-xs">Standard — 15 crédits/mois</p>
            </div>
            <div className="mb-5">
              <span className="text-amber-400 text-3xl font-bold">{billingMode === "solo" ? "9,90€" : "14,30€"}</span>
              <span className="text-white/40 text-sm">/mois</span>
              {billingMode === "duo" && (
                <p className="text-amber-400/50 text-xs mt-1 flex items-center gap-1">
                  <Users size={11} /> 25 crédits partagés
                </p>
              )}
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {SOCIAL_STANDARD_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/20 font-semibold gap-2"
              onClick={() => handleSubscribe("Social Club Standard")}
            >
              <CreditCard size={16} />
              Choisir Standard
            </Button>
          </motion.div>

          {/* Social Club Illimité */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 bg-gradient-to-b from-amber-400/5 to-transparent border border-amber-400/30 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Populaire
            </div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-amber-400" />
                <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Social Club</h3>
              </div>
              <p className="text-amber-400/60 text-xs">Illimité — crédits sans limite</p>
            </div>
            <div className="mb-5">
              <span className="text-amber-400 text-3xl font-bold">{billingMode === "solo" ? "29,90€" : "37€"}</span>
              <span className="text-white/40 text-sm">/mois</span>
              {billingMode === "duo" && (
                <p className="text-amber-400/50 text-xs mt-1 flex items-center gap-1">
                  <Users size={11} /> Crédits illimités pour 2
                </p>
              )}
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {SOCIAL_UNLIMITED_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                  <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/20 font-semibold gap-2"
              onClick={() => handleSubscribe("Social Club Illimité")}
            >
              <Sparkles size={16} />
              Devenir Illimité
            </Button>
          </motion.div>

          {/* Club Privé */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 bg-white/[0.02] border border-purple-500/20 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border border-purple-500/30">
              Sur invitation
            </div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} className="text-purple-400" />
                <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Club Privé</h3>
              </div>
              <p className="text-purple-400/60 text-xs">Le privilège absolu — sur mesure</p>
            </div>
            <div className="mb-5">
              <span className="text-purple-400 text-2xl font-bold">Sur mesure</span>
              <p className="text-white/30 text-xs mt-1">Tarif personnalisé selon vos besoins</p>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {CLUB_PRIVE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/50">
                  <Check size={14} className="text-purple-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full border-purple-500/30 text-purple-300 hover:border-purple-500/50 hover:text-purple-200 gap-2"
              onClick={handleWaitlist}
            >
              <Lock size={14} />
              Liste d'attente
            </Button>
          </motion.div>
        </div>

        {/* Recharges crédits */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}>
          <button
            onClick={() => setShowCredits(!showCredits)}
            className="w-full flex items-center justify-center gap-2 text-white/40 text-sm hover:text-white/60 transition-colors mb-4"
          >
            <CreditCard size={14} />
            Recharges de crédits à la carte
            {showCredits ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showCredits && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-6 mb-8">
              <p className="text-white/50 text-xs mb-4 text-center">
                Pour les membres Social Club Standard — rechargez vos crédits sans changer de forfait
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CREDIT_PACKS.map((pack) => (
                  <button
                    key={pack.credits}
                    onClick={() => toast.info("Les recharges seront disponibles prochainement.")}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl border border-white/8 hover:border-amber-400/20 hover:bg-amber-400/5 transition-all"
                  >
                    <span className="text-amber-400 text-2xl font-bold">{pack.credits}</span>
                    <span className="text-white/40 text-xs">crédits</span>
                    <span className="text-white font-semibold text-lg">{pack.price}</span>
                    <span className="text-white/30 text-[10px]">{pack.perCredit}/crédit</span>
                  </button>
                ))}
              </div>
              <p className="text-white/25 text-[10px] text-center mt-4">
                Astuce : si vous rechargez souvent, passez à l'Illimité — c'est plus rentable dès 2 recharges/mois.
              </p>
            </div>
          )}
        </motion.div>

        {/* 1 parcours offert */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.5 }}
          className="rounded-2xl bg-gradient-to-r from-amber-400/5 to-orange-500/5 border border-amber-400/15 p-6 mb-12 text-center">
          <Gift size={24} className="text-amber-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            1 parcours offert à la création de profil
          </h3>
          <p className="text-white/50 text-sm max-w-md mx-auto mb-4">
            Créez votre profil gratuitement et recevez un parcours complet offert pour découvrir la puissance de Maya.
          </p>
          {!isAuthenticated && (
            <a
              href={getLoginUrl("/pricing")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/20 transition-all"
            >
              <Sparkles size={14} />
              Créer mon profil
            </a>
          )}
        </motion.div>

        {/* Trust badges */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Brain, label: "IA de pointe" },
            { icon: Globe, label: "Couverture mondiale" },
            { icon: Shield, label: "Données sécurisées" },
            { icon: Clock, label: "Disponible 24/7" },
          ].map((item, i) => (
            <div key={i} className="text-center py-4">
              <item.icon size={20} className="text-amber-400/50 mx-auto mb-2" />
              <p className="text-white/40 text-xs">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
