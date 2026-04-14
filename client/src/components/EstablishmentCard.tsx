/**
 * EstablishmentCard.tsx
 * Carte luxe pour afficher un établissement dans les listes, résultats Maya, parcours.
 * Variantes : "compact" (liste), "featured" (hero), "inline" (dans chat Maya)
 */

import { useState } from "react";
import { Link } from "wouter";
import { Star, MapPin, ExternalLink, Heart, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EstablishmentCardData {
  id: number;
  slug: string;
  name: string;
  category: string;
  city: string;
  country: string;
  description: string;
  shortDescription?: string | null;
  heroImageUrl?: string | null;
  featuredPhoto?: string | null;
  photos?: string[] | string | null;
  rating?: string | null;
  reviewCount?: number | null;
  priceLevel?: string | null;
  privilegeDescription?: string | null;
  isAffiliated?: boolean | null;
  affiliateUrl?: string | null;
  ambiance?: string | null;
  signature?: string | null;
  timesRecommended?: number | null;
}

function resolveCardImage(e: EstablishmentCardData): string | null {
  // Priorité : photos[0] (enrichi Google) → heroImageUrl → featuredPhoto
  try {
    if (Array.isArray(e.photos) && e.photos.length > 0) return e.photos[0];
    if (typeof e.photos === "string" && e.photos.trim().length > 0) {
      const parsed = JSON.parse(e.photos);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") return parsed[0];
    }
  } catch {
    /* ignore malformed json */
  }
  return e.heroImageUrl || e.featuredPhoto || null;
}

interface EstablishmentCardProps {
  establishment: EstablishmentCardData;
  variant?: "compact" | "featured" | "inline";
  onSave?: (id: number) => void;
  saved?: boolean;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  hotel: "Hôtel",
  bar: "Bar",
  spa: "Spa",
  museum: "Musée",
  park: "Parc",
  beach: "Plage",
  nightclub: "Club",
  shopping: "Shopping",
  transport: "Transport",
  activity: "Activité",
  experience: "Expérience",
  wellness: "Bien-être",
};

const PRICE_LABELS: Record<string, string> = {
  budget: "€",
  moderate: "€€",
  upscale: "€€€",
  luxury: "€€€€",
};

export function EstablishmentCard({
  establishment: e,
  variant = "compact",
  onSave,
  saved = false,
  className,
}: EstablishmentCardProps) {
  const [isSaved, setIsSaved] = useState(saved);
  const imageUrl = resolveCardImage(e);
  const rating = e.rating ? parseFloat(e.rating) : null;
  const priceLabel = e.priceLevel ? PRICE_LABELS[e.priceLevel] || "€€€" : "€€€";
  const categoryLabel = CATEGORY_LABELS[e.category] || e.category;

  function handleSave(ev: React.MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    setIsSaved(!isSaved);
    onSave?.(e.id);
  }

  // ─── Variant: inline (dans chat Maya) ────────────────────────────────
  if (variant === "inline") {
    return (
      <Link href={`/lieu/${e.slug}`}>
        <div className={cn(
          "flex gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group",
          className
        )}>
          {imageUrl && (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img src={imageUrl} alt={e.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-white truncate">{e.name}</p>
                <p className="text-xs text-white/50">{categoryLabel} · {e.city}</p>
              </div>
              {rating && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {e.privilegeDescription && (
              <Badge variant="outline" className="mt-1.5 text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10 px-1.5 py-0">
                {e.privilegeDescription}
              </Badge>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 self-center" />
        </div>
      </Link>
    );
  }

  // ─── Variant: featured (hero card) ───────────────────────────────────
  if (variant === "featured") {
    return (
      <Link href={`/lieu/${e.slug}`}>
        <div className={cn(
          "relative rounded-2xl overflow-hidden cursor-pointer group h-80",
          className
        )}>
          {/* Background image */}
          {imageUrl ? (
            <img src={imageUrl} alt={e.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Save button */}
          <button
            onClick={handleSave}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors z-10"
          >
            <Heart className={cn("w-4 h-4", isSaved ? "fill-red-400 text-red-400" : "text-white")} />
          </button>

          {/* Privilege badge */}
          {e.privilegeDescription && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-amber-500/90 text-black text-[10px] font-semibold px-2 py-0.5">
                {e.privilegeDescription}
              </Badge>
            </div>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 mb-1">{categoryLabel} · {priceLabel}</p>
                <h3 className="text-xl font-bold text-white leading-tight mb-1">{e.name}</h3>
                <div className="flex items-center gap-1.5 text-white/60">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{e.city}</span>
                </div>
              </div>
              {rating && (
                <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex-shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 mb-0.5" />
                  <span className="text-white font-bold text-sm">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {e.shortDescription && (
              <p className="text-white/60 text-xs mt-2 line-clamp-2">{e.shortDescription}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ─── Variant: compact (liste par défaut) ─────────────────────────────
  return (
    <Link href={`/lieu/${e.slug}`}>
      <div className={cn(
        "flex gap-4 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/7 transition-all cursor-pointer group",
        className
      )}>
        {/* Image */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
          {imageUrl ? (
            <img src={imageUrl} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">
              {categoryLabel[0]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">{e.name}</h3>
              <p className="text-xs text-white/50">{categoryLabel} · {priceLabel} · {e.city}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">{rating.toFixed(1)}</span>
                </div>
              )}
              <button
                onClick={handleSave}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Heart className={cn("w-3.5 h-3.5", isSaved ? "fill-red-400 text-red-400" : "text-white/40")} />
              </button>
            </div>
          </div>

          {e.privilegeDescription && (
            <Badge variant="outline" className="mb-1.5 text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10 px-1.5 py-0">
              {e.privilegeDescription}
            </Badge>
          )}

          <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
            {e.shortDescription || e.description}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 self-center" />
      </div>
    </Link>
  );
}

export default EstablishmentCard;
