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
  const [mapExpanded, setMapExpanded] = useState(false);

  const trackOutbound = trpc.tracking.outboundClick.useMutation();

  const { data: establishment, isLoading } = trpc.establishments.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Fire-and-forget outbound tracker; never blocks navigation
  const handleOutbound = (type: "website" | "phone" | "maps" | "reservation", url: string) => {
    if (!establishment?.id) return;
    try {
      trackOutbound.mutate({ establishmentId: establishment.id, type, url });
    } catch { /* ignore */ }
  };

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
      <div
        className="pb-16"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          paddingLeft: "clamp(16px, 4vw, 32px)",
          paddingRight: "clamp(16px, 4vw, 32px)",
        }}
      >
        {/* Back button — retour à la page d'où vient le Membre */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white/40 text-sm">{categoryLabel}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm truncate">{establishment.name}</span>
        </div>

        {/* Hero Gallery */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-white/5" style={{ height: "55vh", maxHeight: 560 }}>
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

        {/* Mini-carte Google Maps — aperçu mobile 200px / desktop 280px, expand 70vh */}
        {establishment.lat != null && establishment.lng != null && (
          <div className="mb-8">
            <div
              className="relative w-full overflow-hidden"
              style={{
                height: mapExpanded ? "70vh" : undefined,
                borderRadius: 12,
                transition: "height 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {import.meta.env.VITE_GOOGLE_MAPS_KEY ? (
                <iframe
                  title={`Carte ${establishment.name}`}
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=${establishment.lat},${establishment.lng}&zoom=15`}
                  className={cn(
                    "w-full block border-0",
                    mapExpanded ? "h-full" : "h-[200px] md:h-[280px]"
                  )}
                  style={{
                    borderRadius: 12,
                    transition: "height 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div
                  className={cn(
                    "w-full flex items-center justify-center text-white/40 text-xs",
                    mapExpanded ? "h-full" : "h-[200px] md:h-[280px]"
                  )}
                  style={{
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  Carte indisponible — VITE_GOOGLE_MAPS_KEY non configurée
                </div>
              )}
            </div>

            {/* Actions carte : bouton principal expand/collapse + bouton secondaire ouverture Google Maps */}
            <button
              type="button"
              onClick={() => setMapExpanded((v) => !v)}
              className="mt-3 inline-flex items-center justify-center gap-2 w-full rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                minHeight: 48,
                background: "linear-gradient(135deg, #C8A96E, #E8D5A8)",
                color: "#070B14",
              }}
            >
              <MapPin className="w-4 h-4" />
              {mapExpanded ? "Réduire la carte" : "Voir sur la carte"}
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${establishment.lat},${establishment.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleOutbound("maps", `https://www.google.com/maps/dir/?api=1&destination=${establishment.lat},${establishment.lng}`)}
              className="mt-2 inline-flex items-center justify-center gap-1.5 w-full rounded-xl text-xs transition-colors"
              style={{
                minHeight: 44,
                color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
              }}
            >
              Ouvrir dans Google Maps
              <ExternalLink className="w-3 h-3" />
              <span className="text-[10px] opacity-60 ml-1">· vous sortez de La Maison</span>
            </a>
          </div>
        )}

        {/* Séparation dorée */}
        <div className="mb-8" style={{ borderTop: "1px solid rgba(200,169,110,0.2)" }} />

        {/* Signature + description */}
        <div className="mb-8" style={{ maxWidth: "85ch" }}>
          {establishment.signature && (
            <p
              className="mb-4"
              style={{
                fontSize: "1.05rem",
                fontStyle: "italic",
                color: "#C8A96E",
                lineHeight: 1.5,
              }}
            >
              ✦ {establishment.signature}
            </p>
          )}
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {establishment.description}
          </p>
        </div>

        {/* Séparation dorée */}
        {((establishment as any).editorialContent ||
          highlights.length > 0 ||
          (establishment as any).secretTip) && (
          <div className="mb-8" style={{ borderTop: "1px solid rgba(200,169,110,0.2)" }} />
        )}

        {/* Editorial magazine content avec lettrine sobre */}
        {(establishment as any).editorialContent && (
          <div className="mb-8" style={{ maxWidth: "85ch" }}>
            <h2
              className="mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#F0EDE6",
                fontSize: "1.15rem",
                fontWeight: 600,
              }}
            >
              Le point de vue Maison Baymora
            </h2>
            <div>
              {(() => {
                const paragraphs = String((establishment as any).editorialContent)
                  .split(/\n\s*\n/)
                  .map((p) => p.trim())
                  .filter((p) => p.length > 0);
                return paragraphs.map((p, i) => {
                  if (i === 0 && p.length > 1) {
                    const first = p.charAt(0);
                    const rest = p.slice(1);
                    return (
                      <p
                        key={i}
                        style={{
                          fontSize: "1rem",
                          lineHeight: 1.75,
                          marginBottom: "1.2rem",
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        <span
                          style={{
                            float: "left",
                            fontSize: "2.2rem",
                            fontFamily: "'Playfair Display', serif",
                            color: "rgba(255,255,255,0.85)",
                            lineHeight: 1,
                            marginRight: 6,
                            marginTop: 2,
                          }}
                        >
                          {first}
                        </span>
                        {rest}
                      </p>
                    );
                  }
                  return (
                    <p
                      key={i}
                      style={{
                        fontSize: "1rem",
                        lineHeight: 1.75,
                        marginBottom: "1.2rem",
                        color: "rgba(255,255,255,0.75)",
                      }}
                    >
                      {p}
                    </p>
                  );
                });
              })()}
              <div style={{ clear: "both" }} />
            </div>
          </div>
        )}

        {/* Secret tip Maison Baymora */}
        {(establishment as any).secretTip && (
          <>
            <div className="mb-8" style={{ borderTop: "1px solid rgba(200,169,110,0.2)" }} />
            <div className="mb-8 p-5 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(232,213,168,0.06))", border: "1px solid rgba(200,169,110,0.3)" }}>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "#E8D5A8" }}>
                <Sparkles className="w-4 h-4" />
                Le secret Maison Baymora
              </h2>
              <p className="text-white/80 text-sm leading-relaxed italic">
                {(establishment as any).secretTip}
              </p>
            </div>
          </>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, color: "#F0EDE6" }}>Points forts</h2>
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
            <h2 className="mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, color: "#F0EDE6" }}>À savoir</h2>
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
            <h2 className="mb-4 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, color: "#F0EDE6" }}>
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

        {/* Practical info — en colonne sur mobile, 2 cols desktop */}
        <div className="mb-8 flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
          {establishment.phone && (
            <a
              href={`tel:${establishment.phone}`}
              onClick={() => handleOutbound("phone", `tel:${establishment.phone}`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
              style={{ minHeight: 48 }}
            >
              <Phone className="w-5 h-5 text-white/40 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/40 mb-0.5">Téléphone</p>
                <p className="text-white text-sm">{establishment.phone}</p>
              </div>
            </a>
          )}
          {establishment.website && (
            <a
              href={establishment.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleOutbound("website", establishment.website!)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
              style={{ minHeight: 48 }}
            >
              <Globe className="w-5 h-5 text-white/40 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/40 mb-0.5 flex items-center gap-1">
                  Site web
                  <ExternalLink className="w-3 h-3" />
                </p>
                <p className="text-white text-sm truncate">{establishment.website.replace(/^https?:\/\//, "")}</p>
              </div>
            </a>
          )}
        </div>

        {/* Affiliate CTA — touch targets + tracking */}
        {(Object.keys(affiliateLinks).length > 0 || establishment.affiliateUrl) && (
          <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
            <h2
              className="mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "#F0EDE6",
              }}
            >
              Réserver
            </h2>
            <div className="flex flex-col gap-3">
              {establishment.affiliateUrl && (
                <a
                  href={establishment.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOutbound("reservation", establishment.affiliateUrl!)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{
                    minHeight: 48,
                    background: "#F59E0B",
                    color: "#070B14",
                  }}
                >
                  Réserver maintenant
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {Object.entries(affiliateLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOutbound("reservation", url)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl text-sm transition-colors"
                  style={{
                    minHeight: 48,
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, color: "#F0EDE6" }}>Avis sélectionnés</h2>
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

        {/* Similar establishments — scroll horizontal snap mobile, stack desktop */}
        {similar && similar.length > 0 && (
          <div>
            <h2
              className="mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "#F0EDE6",
              }}
            >
              Dans le même esprit
            </h2>
            <div
              className="flex md:flex-col gap-3 md:gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {similar.map((s) => (
                <div
                  key={s.id}
                  className="flex-shrink-0 w-[85%] md:w-auto"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <EstablishmentCard establishment={s} variant="compact" />
                </div>
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
