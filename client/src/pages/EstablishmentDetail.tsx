/**
 * EstablishmentDetail.tsx
 * Page fiche luxe complète d'un établissement.
 * Route: /lieu/:slug
 */

import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Star, MapPin, Phone, Globe, Clock, Heart, Share2, ArrowLeft,
  ChevronLeft, ChevronRight, ExternalLink, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import DashboardLayout from "@/components/DashboardLayout";

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
  budget: "€ — Accessible",
  moderate: "€€ — Modéré",
  upscale: "€€€ — Haut de gamme",
  luxury: "€€€€ — Ultra-luxe",
};

export default function EstablishmentDetail() {
  const [, params] = useRoute("/lieu/:slug");
  const slug = params?.slug || "";
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [saved, setSaved] = useState(false);

  const { data: establishment, isLoading } = trpc.establishments.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const { data: similar } = trpc.establishments.getSimilar.useQuery(
    { id: establishment?.id || 0, city: establishment?.city || "", limit: 3 },
    { enabled: !!establishment?.id }
  );

  if (isLoading) return <LoadingSkeleton />;
  if (!establishment) return <NotFound />;

  const photos: string[] = (() => {
    try {
      if (Array.isArray(establishment.photos)) return establishment.photos as string[];
      if (typeof establishment.photos === "string") return JSON.parse(establishment.photos);
    } catch { /* empty */ }
    return establishment.heroImageUrl ? [establishment.heroImageUrl] : [];
  })();

  const heroImage = photos[currentPhoto] || establishment.heroImageUrl || establishment.featuredPhoto;
  const rating = establishment.rating ? parseFloat(establishment.rating) : null;
  const priceLabel = establishment.priceLevel ? PRICE_LABELS[establishment.priceLevel] || "€€€" : null;
  const categoryLabel = CATEGORY_LABELS[establishment.category] || establishment.category;

  const highlights: string[] = (() => {
    try { return JSON.parse(establishment.highlights || "[]"); } catch { return []; }
  })();

  const thingsToKnow: string[] = (() => {
    try { return JSON.parse(establishment.thingsToKnow || "[]"); } catch { return []; }
  })();

  const anecdotes: string[] = (() => {
    try { return JSON.parse(establishment.anecdotes || "[]"); } catch { return []; }
  })();

  const reviews: Array<{ text: string; rating: number; author?: string }> = (() => {
    try { return JSON.parse(establishment.reviews || "[]"); } catch { return []; }
  })();

  const affiliateLinks: Record<string, string> = (() => {
    try { return JSON.parse(establishment.affiliateLinks || "{}"); } catch { return {}; }
  })();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-16">
        {/* Back button */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/maison">
            <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/40 text-sm">{categoryLabel}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm truncate">{establishment.name}</span>
        </div>

        {/* Hero Gallery */}
        <div className="relative rounded-2xl overflow-hidden mb-8 h-72 md:h-96 bg-white/5">
          {heroImage ? (
            <img
              src={heroImage}
              alt={establishment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-6xl">
              {categoryLabel[0]}
            </div>
          )}

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Photo navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhoto((p) => Math.max(0, p - 1))}
                disabled={currentPhoto === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setCurrentPhoto((p) => Math.min(photos.length - 1, p + 1))}
                disabled={currentPhoto === photos.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentPhoto ? "bg-white w-4" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <Heart className={cn("w-4 h-4", saved ? "fill-red-400 text-red-400" : "text-white")} />
            </button>
            <button
              onClick={() => navigator.share?.({ title: establishment.name, url: window.location.href })}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Privilege badge */}
          {establishment.privilegeDescription && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-amber-500/90 text-black text-xs font-semibold px-2.5 py-1">
                ✦ {establishment.privilegeDescription}
              </Badge>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs border-white/20 text-white/50">
                  {categoryLabel}
                </Badge>
                {priceLabel && (
                  <span className="text-xs text-white/40">{priceLabel}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white leading-tight">{establishment.name}</h1>
              {establishment.subtitle && (
                <p className="text-white/50 mt-1">{establishment.subtitle}</p>
              )}
            </div>
            {rating && (
              <div className="flex flex-col items-center bg-white/8 rounded-2xl px-4 py-3 flex-shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400 mb-1" />
                <span className="text-white font-bold text-xl leading-none">{rating.toFixed(1)}</span>
                {establishment.reviewCount ? (
                  <span className="text-white/40 text-xs mt-0.5">{establishment.reviewCount.toLocaleString()} avis</span>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{establishment.address || `${establishment.city}, ${establishment.country}`}</span>
            </div>
            {establishment.ambiance && (
              <span className="capitalize">· {establishment.ambiance}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-white/80 leading-relaxed text-base">{establishment.description}</p>
          {establishment.signature && (
            <p className="mt-3 text-amber-400/80 italic text-sm">✦ {establishment.signature}</p>
          )}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Points forts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <span className="text-amber-400 mt-0.5">✦</span>
                  <span className="text-white/70 text-sm">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Things to know */}
        {thingsToKnow.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">À savoir</h2>
            <div className="space-y-2">
              {thingsToKnow.map((t, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="text-white/30 mt-0.5">→</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anecdotes */}
        {anecdotes.length > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-500/8 border border-amber-500/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Le saviez-vous ?
            </h2>
            <div className="space-y-3">
              {anecdotes.map((a, i) => (
                <p key={i} className="text-white/70 text-sm leading-relaxed">{a}</p>
              ))}
            </div>
          </div>
        )}

        {/* Practical info */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {establishment.phone && (
            <a href={`tel:${establishment.phone}`} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
              <Phone className="w-5 h-5 text-white/40" />
              <div>
                <p className="text-xs text-white/40 mb-0.5">Téléphone</p>
                <p className="text-white text-sm">{establishment.phone}</p>
              </div>
            </a>
          )}
          {establishment.website && (
            <a href={establishment.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
              <Globe className="w-5 h-5 text-white/40" />
              <div>
                <p className="text-xs text-white/40 mb-0.5">Site web</p>
                <p className="text-white text-sm truncate">{establishment.website.replace(/^https?:\/\//, "")}</p>
              </div>
            </a>
          )}
        </div>

        {/* Affiliate CTA */}
        {(Object.keys(affiliateLinks).length > 0 || establishment.affiliateUrl) && (
          <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-base font-semibold text-white mb-3">Réserver</h2>
            <div className="flex flex-wrap gap-2">
              {establishment.affiliateUrl && (
                <Button
                  asChild
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <a href={establishment.affiliateUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Réserver maintenant
                  </a>
                </Button>
              )}
              {Object.entries(affiliateLinks).map(([platform, url]) => (
                <Button key={platform} variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Avis sélectionnés</h2>
            <div className="space-y-3">
              {reviews.slice(0, 3).map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className={cn("w-3 h-3", s < r.rating ? "fill-amber-400 text-amber-400" : "text-white/20")} />
                      ))}
                    </div>
                    {r.author && <span className="text-white/40 text-xs">{r.author}</span>}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar establishments */}
        {similar && similar.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Dans le même esprit</h2>
            <div className="space-y-3">
              {similar.map((s) => (
                <EstablishmentCard key={s.id} establishment={s} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function LoadingSkeleton() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-16">
        <Skeleton className="h-96 rounded-2xl mb-8" />
        <Skeleton className="h-8 w-64 mb-3" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-24 mb-8" />
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function NotFound() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-white/40 text-lg mb-4">Établissement introuvable</p>
        <Link href="/maison">
          <Button variant="outline" className="border-white/20 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la Maison
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
