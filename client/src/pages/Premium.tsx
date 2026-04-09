import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, Crown, Zap, Star, ArrowLeft, Loader2, Users, Gem } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Compteur fondateurs
const FOUNDER_TOTAL = 500;

const PLANS = [
  {
    id: "invite",
    stripeId: null,
    name: "Invité",
    price: "0",
    period: "",
    badge: "Gratuit",
    highlight: false,
    color: "#8B8D94",
    icon: Star,
    description: "Découvrez la Maison avec 3 conversations gratuites.",
    features: [
      "3 conversations avec Maya",
      "Accès aux adresses publiques",
      "Aperçu des privilèges",
    ],
  },
  {
    id: "membre",
    stripeId: "membre",
    name: "Membre",
    price: "9,90",
    period: "mois",
    annualPrice: "99",
    annualSavings: "économisez 20%",
    badge: "Le plus choisi",
    highlight: true,
    color: "#C8A96E",
    icon: Star,
    description: "L'accès complet à Maya et aux meilleures adresses de la Maison.",
    features: [
      "Maya illimitée",
      "Parcours & cartes illimités",
      "Privilèges partenaires",
      "Feed local \"Ma position\"",
      "Mode Business",
    ],
  },
  {
    id: "duo",
    stripeId: "duo",
    name: "Duo",
    price: "14,90",
    period: "mois",
    annualPrice: "149",
    annualSavings: "économisez 17%",
    badge: "Pour deux",
    highlight: false,
    color: "#8B8D94",
    icon: Users,
    description: "Tout Membre pour 2 profils avec parcours en commun.",
    features: [
      "Tout Membre pour 2 profils",
      "Parcours en commun",
      "Préférences croisées",
    ],
  },
  {
    id: "cercle",
    stripeId: "cercle",
    name: "Le Cercle",
    price: "149",
    period: "an",
    badge: "Membre Fondateur — à vie",
    highlight: false,
    color: "#E8D5A8",
    icon: Gem,
    description: "L'adhésion fondatrice. Accès à vie aux privilèges exclusifs de la Maison.",
    features: [
      "Tout Membre",
      "Maya mode Prestige (scénarios Sur-Mesure par défaut)",
      "Le Secret du Jour chaque matin",
      "Événements privés Cercle (1/mois min.)",
      "Offres flash 24h avant les Membres",
      "2 invitations/mois pour vos proches",
      "Badge Fondateur (500 premières places)",
      "Cadeau de bienvenue",
      "Support prioritaire (réponse sous 2h)",
      "Accès aux expériences Sur-Mesure exclusives",
    ],
    cercleHighlight: true,
  },
] as const;

type PlanId = typeof PLANS[number]["id"];

export default function Premium() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [founderLeft, setFounderLeft] = useState(FOUNDER_TOTAL);

  // Animation compteur fondateurs (valeur initiale = 423 prises, 77 restantes)
  useEffect(() => {
    const FOUNDER_TAKEN_INIT = 423;
    const target = FOUNDER_TOTAL - FOUNDER_TAKEN_INIT;
    setFounderLeft(FOUNDER_TOTAL);
    const interval = setInterval(() => {
      setFounderLeft(prev => {
        if (prev > target) return prev - 1;
        clearInterval(interval);
        return prev;
      });
    }, 8);
    return () => clearInterval(interval);
  }, []);

  const createCheckoutSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirection vers le paiement sécurisé...");
      }
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la création du paiement");
      setLoadingPlan(null);
    },
  });

  const handleChoose = (plan: typeof PLANS[number]) => {
    if (plan.id === "invite") {
      navigate("/maison");
      return;
    }
    if (!user) {
      toast.error("Connecte-toi pour rejoindre la Maison");
      navigate("/auth");
      return;
    }
    if (!plan.stripeId) return;
    setLoadingPlan(plan.id);
    createCheckoutSession.mutate({
      planId: plan.stripeId as "membre" | "duo" | "cercle",
      origin: window.location.origin,
    });
  };

  const founderEpuise = founderLeft === 0;

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1 as any)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.2)" }}
          >
            <ArrowLeft size={16} color="#C8A96E" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
              Votre adhésion
            </h1>
            <p className="text-sm" style={{ color: "#8B8D94" }}>Sans engagement · Résiliable en 1 clic</p>
          </div>
        </div>

        {/* Bannière fondateurs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 mt-4 rounded-xl px-5 py-3 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(232,213,168,0.08))", border: "1px solid rgba(200,169,110,0.3)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#C8A96E" }}>
              🏅 Places Fondateurs — Le Cercle
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8B8D94" }}>
              {founderEpuise
                ? "Les places fondateurs sont épuisées — tarif passé à 249€/an"
                : "Badge exclusif · Accès à vie aux événements Maison · Tarif bloqué"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "#E8D5A8", fontFamily: "'Playfair Display', serif" }}>
              {founderEpuise ? "0" : founderLeft}
            </p>
            <p className="text-xs" style={{ color: "#8B8D94" }}>restantes / {FOUNDER_TOTAL}</p>
          </div>
        </motion.div>

        {/* Grille forfaits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isLoading = loadingPlan === plan.id;
            const isCercle = plan.id === "cercle";
            const displayPrice = isCercle && founderEpuise ? "249" : plan.price;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: plan.highlight
                    ? "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(232,213,168,0.06))"
                    : isCercle
                    ? "linear-gradient(135deg, rgba(232,213,168,0.08), rgba(200,169,110,0.04))"
                    : "#0D1117",
                  border: plan.highlight
                    ? "2px solid #C8A96E"
                    : isCercle
                    ? "1px solid rgba(232,213,168,0.4)"
                    : "1px solid rgba(200,169,110,0.12)",
                  boxShadow: plan.highlight ? "0 0 40px rgba(200,169,110,0.1)" : isCercle ? "0 0 20px rgba(232,213,168,0.05)" : "none",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: plan.highlight
                        ? "linear-gradient(135deg, #C8A96E, #E8D5A8)"
                        : isCercle
                        ? "rgba(232,213,168,0.15)"
                        : "rgba(200,169,110,0.12)",
                      color: plan.highlight ? "#070B14" : isCercle ? "#E8D5A8" : "#C8A96E",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${plan.color}18` }}
                  >
                    <Icon size={18} color={plan.color} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
                      {plan.name}
                    </h2>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold" style={{ color: plan.highlight ? "#C8A96E" : isCercle ? "#E8D5A8" : "#F0EDE6" }}>
                        {plan.price === "0" ? "Gratuit" : `${displayPrice}€`}
                      </span>
                      {plan.period && (
                        <span className="text-sm" style={{ color: "#8B8D94" }}>/{plan.period}</span>
                      )}
                    </div>
                    {/* Option annuelle pour Membre et Duo */}
                    {"annualPrice" in plan && plan.annualPrice && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(200,169,110,0.7)" }}>
                        ou {plan.annualPrice}€/an ({plan.annualSavings})
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm mb-4" style={{ color: "#8B8D94" }}>{plan.description}</p>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={14} color={isCercle ? "#E8D5A8" : "#C8A96E"} className="flex-shrink-0 mt-0.5" />
                      <span style={{ color: "#D4D0C8" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoose(plan)}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                  style={
                    plan.highlight
                      ? { background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }
                      : isCercle
                      ? { background: "linear-gradient(135deg, rgba(232,213,168,0.2), rgba(200,169,110,0.1))", color: "#E8D5A8", border: "1px solid rgba(232,213,168,0.4)" }
                      : plan.id === "invite"
                      ? { background: "transparent", color: "#8B8D94", border: "1px solid rgba(200,169,110,0.2)" }
                      : { background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }
                  }
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  {plan.id === "invite"
                    ? "Continuer en tant qu'Invité"
                    : plan.highlight
                    ? "Rejoindre la Maison"
                    : isCercle
                    ? "Rejoindre Le Cercle"
                    : `Choisir ${plan.name}`}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Packs crédits */}
        <div className="mt-8 p-5 rounded-2xl" style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.12)" }}>
          <h3 className="text-base font-semibold mb-1" style={{ color: "#F0EDE6" }}>Packs conversations</h3>
          <p className="text-xs mb-4" style={{ color: "#8B8D94" }}>Sans abonnement — utilisables à tout moment</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "5 conv.", price: "4,99€", id: "pack_5" },
              { label: "15 conv.", price: "9,99€", id: "pack_15", popular: true },
              { label: "40 conv.", price: "19,99€", id: "pack_40" },
            ].map((pack) => (
              <div
                key={pack.id}
                className="rounded-xl p-3 text-center relative"
                style={{
                  background: pack.popular ? "rgba(200,169,110,0.08)" : "rgba(255,255,255,0.02)",
                  border: pack.popular ? "1px solid rgba(200,169,110,0.3)" : "1px solid rgba(200,169,110,0.08)",
                }}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "#C8A96E", color: "#070B14" }}>
                    Populaire
                  </div>
                )}
                <p className="text-sm font-semibold mt-1" style={{ color: "#F0EDE6" }}>{pack.label}</p>
                <p className="text-base font-bold" style={{ color: "#C8A96E" }}>{pack.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Garantie */}
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: "#8B8D94" }}>
            Paiement sécurisé Stripe · Résiliation en 1 clic · Aucun engagement
          </p>
          <p className="text-xs mt-2" style={{ color: "rgba(139,141,148,0.5)" }}>
            © 2026 Maison Baymora — Les prix sont TTC
          </p>
        </div>
      </div>
    </div>
  );
}
