import { useState } from "react";
import { X, Zap, Sparkles, Crown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
}

const PACKS = [
  {
    id: "boost_10",
    name: "Boost",
    credits: 10,
    price: "1,99€",
    description: "Pour continuer une conversation",
    icon: Zap,
    iconColor: "#F59E0B",
    popular: false,
  },
  {
    id: "boost_50",
    name: "Voyage",
    credits: 50,
    price: "7,99€",
    description: "Idéal pour planifier un voyage complet",
    icon: Sparkles,
    iconColor: "#C8A96E",
    popular: true,
  },
  {
    id: "boost_200",
    name: "Cercle",
    credits: 200,
    price: "24,99€",
    description: "L'équivalent d'un mois Social Club",
    icon: Crown,
    iconColor: "#8B5CF6",
    popular: false,
  },
];

export default function CreditsModal({ isOpen, onClose, currentCredits = 0 }: CreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const buyPackMutation = trpc.stripe.buyCreditPack.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast("Redirection vers le paiement sécurisé...");
      }
      setLoading(null);
    },
    onError: (err) => {
      toast(`Erreur : ${err.message}`);
      setLoading(null);
    },
  });

  const handleBuy = (packId: string) => {
    setLoading(packId);
    buyPackMutation.mutate({ packId: packId as "boost_10" | "boost_50" | "boost_200", origin: window.location.origin });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6"
        style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}
            >
              Recharger mes crédits
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#8B8D94" }}>
              Solde actuel : <span style={{ color: "#C8A96E" }}>{currentCredits} crédit{currentCredits !== 1 ? "s" : ""}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(200,169,110,0.08)" }}
          >
            <X size={16} color="#8B8D94" />
          </button>
        </div>

        {/* Packs */}
        <div className="space-y-3 mb-5">
          {PACKS.map((pack) => {
            const Icon = pack.icon;
            const isLoading = loading === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => handleBuy(pack.id)}
                disabled={!!loading}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left relative"
                style={{
                  background: pack.popular ? "rgba(200,169,110,0.08)" : "rgba(255,255,255,0.03)",
                  border: pack.popular ? "1px solid rgba(200,169,110,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {pack.popular && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                  >
                    Populaire
                  </div>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${pack.iconColor}18` }}
                >
                  <Icon size={20} color={pack.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>
                      {pack.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${pack.iconColor}20`, color: pack.iconColor }}
                    >
                      +{pack.credits} crédits
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#8B8D94" }}>{pack.description}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: "#C8A96E" }}>{pack.price}</span>
                  {isLoading ? (
                    <Loader2 size={16} color="#C8A96E" className="animate-spin" />
                  ) : (
                    <ChevronRight size={16} color="#8B8D94" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs" style={{ color: "#8B8D94" }}>
            Paiement sécurisé par Stripe · Les crédits n'expirent pas
          </p>
          <p className="text-xs mt-1" style={{ color: "#8B8D94" }}>
            Vous préférez un abonnement ?{" "}
            <a href="/premium" className="underline" style={{ color: "#C8A96E" }}>
              Voir les plans
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
