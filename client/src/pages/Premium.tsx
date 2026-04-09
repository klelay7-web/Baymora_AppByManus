import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, Crown, Zap, Star, ArrowLeft, Loader2, Users, Gem } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Compteur fondateurs (simulé — à connecter à la DB)
const FOUNDER_TOTAL = 100;
const FOUNDER_TAKEN = 67; // à remplacer par trpc.ambassador.founderCount.useQuery()

const PLANS = [
  {
    id: "social",
    stripeId: "social",
    name: "Membre",
    price: "9,90",
    period: "mois",
    badge: "Le plus choisi",
    highlight: true,
    color: "#C8A96E",
    icon: Star,
    description: "L'accès complet à Maya et aux meilleures adresses négociées.",
    features: [
      "Conversations illimitées avec Maya",
      "Accès à toutes les adresses négociées",
      "Bundles et parcours premium",
      "Sélections exclusives Maison Baymora",
      "Mémoire de conversation conservée",
      "Alertes privilèges en temps réel",
    ],
  },
  {
    id: "duo",
    stripeId: "duo",
    name: "Duo",
    price: "14,90",
    period: "mois",
    badge: "Pour deux",
    highlight: false,
    color: "#8B8D94",
    icon: Users,
    description: "Partagez l'accès avec votre partenaire ou un proche.",
    features: [
      "Tout le plan Membre",
      "2 profils distincts",
      "Recommandations en couple",
      "Parcours duo personnalisés",
      "Partage de favoris",
    ],
  },
  {
    id: "annuel",
    stripeId: "annuel",
    name: "Le Cercle",
    price: "89",
    period: "an",
    badge: "2 mois offerts",
    highlight: false,
    color: "#E8D5A8",
    icon: Gem,
    description: "L'adhésion annuelle avec accès aux privilèges fondateurs.",
    features: [
      "Tout le plan Membre",
      "Économisez 30€ par an",
      "Accès prioritaire aux nouvelles adresses",
      "Invitations événements Maison Baymora",
      "Badge Fondateur (si < 100 membres)",
      "Support dédié prioritaire",
      "Accès aux expériences Sur-Mesure exclusives",
    ],
    cercleHighlight: true,
  },
  {
    id: "decouverte",
    stripeId: null,
    name: "Invité",
    price: "0",
    period: "",
    badge: "Gratuit",
    highlight: false,
    color: "#8B8D94",
    icon: Star,
    description: "Découvrez Maya avec 3 messages gratuits.",
    features: [
      "3 messages avec Maya",
      "Accès aux adresses publiques",
      "Aperçu des bundles",
    ],
  },
];

export default function Premium() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [founderLeft, setFounderLeft] = useState(FOUNDER_TOTAL - FOUNDER_TAKEN);

  // Animation compteur fondateurs
  useEffect(() => {
    const interval = setInterval(() => {
      setFounderLeft(prev => {
        if (prev > FOUNDER_TOTAL - FOUNDER_TAKEN) return prev - 1;
        clearInterval(interval);
        return prev;
      });
    }, 80);
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

  const handleChoose = (plan: typeof PLANS[0]) => {
    if (plan.id === "decouverte") {
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
      planId: plan.stripeId as "social" | "duo" | "annuel",
      origin: window.location.origin,
    });
  };

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
              Badge exclusif · Accès à vie aux événements Maison · Tarif bloqué
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "#E8D5A8", fontFamily: "'Playfair Display', serif" }}>
              {founderLeft}
            </p>
            <p className="text-xs" style={{ color: "#8B8D94" }}>restantes / {FOUNDER_TOTAL}</p>
          </div>
        </motion.div>

        {/* Grille forfaits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isLoading = loadingPlan === plan.id;
            const isCercle = plan.id === "annuel";
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
                        {plan.price === "0" ? "Gratuit" : `${plan.price}€`}
                      </span>
                      {plan.period && (
                        <span className="text-sm" style={{ color: "#8B8D94" }}>/{plan.period}</span>
                      )}
                    </div>
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
                      : plan.id === "decouverte"
                      ? { background: "transparent", color: "#8B8D94", border: "1px solid rgba(200,169,110,0.2)" }
                      : { background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }
                  }
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  {plan.id === "decouverte"
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
