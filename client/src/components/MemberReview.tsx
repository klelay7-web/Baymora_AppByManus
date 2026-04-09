import { useState } from "react";
import { Star, ThumbsUp, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  memberName: string;
  memberCity?: string;
  memberInitial: string;
  rating: number;
  title?: string;
  text: string;
  date: string;
  scenario?: string; // Signature | Privilège | Prestige | Sur-Mesure
  establishmentName?: string;
  helpful?: number;
  verified?: boolean;
}

interface MemberReviewProps {
  reviews?: Review[];
  showTitle?: boolean;
  maxVisible?: number;
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: "r1",
    memberName: "Sophie M.",
    memberCity: "Paris",
    memberInitial: "S",
    rating: 5,
    title: "Week-end à Venise — parfait",
    text: "Maya m'a ouvert des adresses que je ne connaissais pas. Week-end à Venise planifié en 3 messages. Hôtel, restos, gondole privée. Le tout avec -25% sur le Cipriani. Je recommande à 100%.",
    date: "Mars 2026",
    scenario: "Prestige",
    establishmentName: "Hotel Cipriani, Venise",
    helpful: 24,
    verified: true,
  },
  {
    id: "r2",
    memberName: "Thomas R.",
    memberCity: "Lyon",
    memberInitial: "T",
    rating: 5,
    title: "Dubai en accès Signature",
    text: "J'ai économisé 340€ sur mon accès Dubai. Les remises Baymora sont réelles et négociées. Le Cercle vaut chaque centime. Maya connaît mes goûts — elle ne propose jamais deux fois la même adresse.",
    date: "Février 2026",
    scenario: "Signature",
    establishmentName: "Atlantis The Palm, Dubai",
    helpful: 18,
    verified: true,
  },
  {
    id: "r3",
    memberName: "Camille D.",
    memberCity: "Bordeaux",
    memberInitial: "C",
    rating: 5,
    title: "Le Cercle vaut largement l'abonnement",
    text: "Première fois que j'utilise une IA pour planifier un voyage. Maya m'a posé les bonnes questions, compris mes contraintes (budget serré, 2 enfants) et proposé un accès Privilège parfait pour la famille.",
    date: "Janvier 2026",
    scenario: "Privilège",
    establishmentName: "Four Seasons Bali",
    helpful: 31,
    verified: true,
  },
];

const SCENARIO_COLORS: Record<string, string> = {
  "Signature": "#C8A96E",
  "Privilège": "#8B5CF6",
  "Prestige": "#10B981",
  "Sur-Mesure": "#F59E0B",
};

export default function MemberReview({
  reviews = DEFAULT_REVIEWS,
  showTitle = true,
  maxVisible = 3,
}: MemberReviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  const visible = expanded ? reviews : reviews.slice(0, maxVisible);

  const handleHelpful = (id: string) => {
    if (helpfulClicked[id]) return;
    setHelpfulClicked((prev) => ({ ...prev, [id]: true }));
    toast("Merci pour votre retour ✓");
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} color="#C8A96E" />
            <h2 className="text-sm font-semibold" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>
              Avis membres
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} fill="#C8A96E" color="#C8A96E" />
            ))}
            <span className="text-xs ml-1" style={{ color: "#8B8D94" }}>4.9/5</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl p-4"
            style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                >
                  {review.memberInitial}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold" style={{ color: "#F0EDE6" }}>{review.memberName}</p>
                    {review.verified && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                        ✓ Vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "#8B8D94" }}>
                    {review.memberCity && `${review.memberCity} · `}{review.date}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={11} fill="#C8A96E" color="#C8A96E" />
                  ))}
                </div>
                {review.scenario && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${SCENARIO_COLORS[review.scenario]}20`, color: SCENARIO_COLORS[review.scenario] }}
                  >
                    {review.scenario}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            {review.title && (
              <p className="text-xs font-semibold mb-1" style={{ color: "#F0EDE6" }}>
                {review.title}
              </p>
            )}

            {/* Text */}
            <p className="text-xs leading-relaxed mb-2" style={{ color: "#8B8D94" }}>
              {review.text}
            </p>

            {/* Establishment */}
            {review.establishmentName && (
              <p className="text-xs mb-2" style={{ color: "rgba(200,169,110,0.6)" }}>
                📍 {review.establishmentName}
              </p>
            )}

            {/* Helpful */}
            <button
              onClick={() => handleHelpful(review.id)}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: helpfulClicked[review.id] ? "#C8A96E" : "#8B8D94" }}
            >
              <ThumbsUp size={12} />
              Utile ({(review.helpful || 0) + (helpfulClicked[review.id] ? 1 : 0)})
            </button>
          </div>
        ))}
      </div>

      {reviews.length > maxVisible && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs"
          style={{ background: "rgba(200,169,110,0.06)", color: "#8B8D94", border: "1px solid rgba(200,169,110,0.1)" }}
        >
          {expanded ? (
            <><ChevronUp size={14} /> Voir moins</>
          ) : (
            <><ChevronDown size={14} /> Voir les {reviews.length - maxVisible} autres avis</>
          )}
        </button>
      )}
    </div>
  );
}
