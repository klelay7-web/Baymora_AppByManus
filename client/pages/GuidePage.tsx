import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Lock, Star, Sparkles, Crown } from "lucide-react";

const gold = { background: "linear-gradient(135deg,#c8a94a 0%,#f5d87a 35%,#e4c057 65%,#f0d070 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as const;

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  restaurants: { label: "Restaurants", emoji: "🍽️" },
  hotels: { label: "Hôtels", emoji: "🏨" },
  activites: { label: "Activités", emoji: "🎯" },
  bars: { label: "Bars", emoji: "🍸" },
  spas: { label: "Spas", emoji: "🧖" },
  parcours: { label: "Parcours", emoji: "🗺️" },
  "bons-plans": { label: "Bons plans", emoji: "💎" },
};

const TYPE_EMOJI: Record<string, string> = {
  restaurant: "🍽️", hotel: "🏨", bar: "🍸", spa: "🧖", activity: "🎯", shop: "🛍️", cafe: "☕",
};

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/guides/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setGuide)
      .catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (!guide) return;
    document.title = guide.metaTitle || guide.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", guide.metaDescription || guide.description || "");
  }, [guide]);

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/50 text-lg mb-4">Guide introuvable</p>
        <Link to="/" className="text-secondary hover:underline text-sm">← Retour à l'accueil</Link>
      </div>
    </div>
  );

  if (!guide) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
    </div>
  );

  const cat = CATEGORY_LABELS[guide.category] || { label: guide.category, emoji: "📌" };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Accueil
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="bg-white/5 border border-white/10 text-xs px-2.5 py-1 rounded-full">{cat.emoji} {cat.label}</span>
          {guide.city && <span className="flex items-center gap-1 text-white/30 text-xs"><MapPin className="w-3 h-3" />{guide.city}</span>}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={gold}>{guide.title}</h1>
        {guide.subtitle && <p className="text-white/50 text-base mb-3">{guide.subtitle}</p>}
        {guide.description && <p className="text-white/30 text-sm leading-relaxed mb-6">{guide.description}</p>}
        <p className="text-white/20 text-xs">{guide.totalItems} adresses · {guide.viewCount || 0} vues</p>
      </div>

      {/* Items */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {guide.items.map((item: any, i: number) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{TYPE_EMOJI[item.type] || "📍"}</span>
                <h3 className="font-semibold text-white">{item.name}</h3>
              </div>
              {item.rating && (
                <span className="flex items-center gap-1 text-amber-400 text-sm">
                  <Star className="w-3.5 h-3.5 fill-current" />{item.rating}
                </span>
              )}
            </div>
            {item.description && <p className="text-white/40 text-sm mb-2">{item.description}</p>}
            <div className="flex items-center gap-3 text-xs text-white/30">
              {item.price && <span>{item.price}</span>}
              {item.showBaymoraPrice && item.baymoraPrice && (
                <span className="font-semibold" style={{ color: "#d4a843" }}>
                  <Crown className="w-3 h-3 inline mr-0.5" />Baymora : {item.baymoraPrice}
                </span>
              )}
            </div>
            {item.insiderTip && (
              <div className="mt-3 bg-amber-400/5 border border-amber-400/10 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-300/70"><Sparkles className="w-3 h-3 inline mr-1" />Conseil insider : {item.insiderTip}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paywall */}
      {guide.locked && (
        <div className="max-w-3xl mx-auto px-4 pb-16">
          <div className="relative">
            {/* Blurred placeholders */}
            {[1, 2].map(n => (
              <div key={n} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 mb-3 blur-[6px] select-none pointer-events-none">
                <div className="h-4 bg-white/5 rounded w-1/3 mb-2" />
                <div className="h-3 bg-white/3 rounded w-2/3" />
              </div>
            ))}
            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm rounded-2xl">
              <div className="text-center px-6 py-8">
                <Lock className="w-8 h-8 text-secondary/60 mx-auto mb-3" />
                <p className="text-white/70 font-medium mb-1">
                  {guide.lockReason === "signup"
                    ? `Inscrivez-vous gratuitement pour voir les ${guide.hiddenCount} autres`
                    : `Débloquer pour ${guide.unlockOptions?.price || "4.90€"} ou ${guide.unlockOptions?.points || 500} points`}
                </p>
                {guide.unlockOptions?.upgradePlan && guide.lockReason !== "signup" && (
                  <p className="text-white/30 text-xs mb-4">Ou passez au plan {guide.unlockOptions.upgradePlan} pour un accès illimité</p>
                )}
                <Link
                  to={guide.lockReason === "signup" ? "/auth" : "/club"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-slate-900 transition-transform hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#c8a94a,#f5d87a,#e4c057)" }}
                >
                  {guide.lockReason === "signup" ? "S'inscrire" : "Débloquer"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
