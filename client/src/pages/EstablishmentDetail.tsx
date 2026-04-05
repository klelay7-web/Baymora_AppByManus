import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Phone, Globe, Star, ChevronLeft, Heart, Share2,
  Utensils, Hotel, Camera, ShoppingBag, Sparkles, Eye, ExternalLink,
  Play, Instagram, Music, Quote, Info, AlertCircle, DollarSign
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categoryIcons: Record<string, any> = {
  restaurant: Utensils, hotel: Hotel, bar: Utensils, spa: Sparkles,
  museum: Camera, park: Camera, beach: Camera, nightclub: Music,
  shopping: ShoppingBag, transport: MapPin, activity: Camera,
  experience: Sparkles, wellness: Sparkles,
};

const priceLevelLabels: Record<string, string> = {
  budget: "€", moderate: "€€", upscale: "€€€", luxury: "€€€€",
};

export default function EstablishmentDetail() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [activeMediaTab, setActiveMediaTab] = useState<"photos" | "videos">("photos");
  const [liked, setLiked] = useState(false);

  const { data: establishment, isLoading } = trpc.establishments.getBySlug.useQuery(
    { slug: params.slug || "" },
    { enabled: !!params.slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-3 animate-spin" />
          <p className="text-white/40 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Établissement non trouvé</p>
          <Button onClick={() => navigate("/discover")} variant="outline" className="border-gold/30 text-gold">
            <ChevronLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[establishment.category] || MapPin;
  const photos = establishment.media?.filter((m: any) => m.type === "photo") || [];
  const videos = establishment.media?.filter((m: any) => ["video", "tiktok", "instagram_reel"].includes(m.type)) || [];
  const anecdotes = establishment.anecdotes ? JSON.parse(establishment.anecdotes) : [];
  const thingsToKnow = establishment.thingsToKnow ? JSON.parse(establishment.thingsToKnow) : [];
  const highlights = establishment.highlights ? JSON.parse(establishment.highlights) : [];
  const reviews = establishment.reviews ? JSON.parse(establishment.reviews) : [];
  const viralVideos = establishment.viralVideos ? JSON.parse(establishment.viralVideos) : [];
  const affiliateLinks = establishment.affiliateLinks ? JSON.parse(establishment.affiliateLinks) : [];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {establishment.heroImageUrl ? (
          <img
            src={establishment.heroImageUrl}
            alt={establishment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/20 to-background flex items-center justify-center">
            <CategoryIcon className="w-24 h-24 text-gold/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1 as any)}
            className="bg-background/50 backdrop-blur-sm text-white hover:bg-background/70 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLiked(!liked)}
              className="bg-background/50 backdrop-blur-sm text-white hover:bg-background/70 rounded-full"
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/50 backdrop-blur-sm text-white hover:bg-background/70 rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {establishment.category}
              </Badge>
              {establishment.priceLevel && (
                <Badge variant="outline" className="border-white/20 text-white/80 text-xs">
                  {priceLevelLabels[establishment.priceLevel]}
                </Badge>
              )}
              {establishment.rating && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {establishment.rating}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-1">
              {establishment.name}
            </h1>
            {establishment.subtitle && (
              <p className="text-white/60 text-sm italic">{establishment.subtitle}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-white/50 text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {establishment.city}, {establishment.country}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {establishment.viewCount} vues
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-4xl px-4 mt-6 space-y-8">
        {/* Description */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-white/80 leading-relaxed">{establishment.description}</p>
        </motion.section>

        {/* Quick Info */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {establishment.openingHours && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <Clock className="w-4 h-4 text-gold mb-1" />
              <p className="text-xs text-white/40">Horaires</p>
              <p className="text-sm text-white/80">{establishment.openingHours}</p>
            </div>
          )}
          {establishment.phone && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <Phone className="w-4 h-4 text-gold mb-1" />
              <p className="text-xs text-white/40">Téléphone</p>
              <p className="text-sm text-white/80">{establishment.phone}</p>
            </div>
          )}
          {establishment.priceRange && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <DollarSign className="w-4 h-4 text-gold mb-1" />
              <p className="text-xs text-white/40">Prix</p>
              <p className="text-sm text-white/80">{establishment.priceRange}</p>
            </div>
          )}
          {establishment.cuisineType && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <Utensils className="w-4 h-4 text-gold mb-1" />
              <p className="text-xs text-white/40">Cuisine</p>
              <p className="text-sm text-white/80">{establishment.cuisineType}</p>
            </div>
          )}
        </motion.section>

        {/* Highlights */}
        {highlights.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-lg font-playfair font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" /> Points forts
            </h2>
            <div className="flex flex-wrap gap-2">
              {highlights.map((h: string, i: number) => (
                <Badge key={i} variant="outline" className="border-gold/20 text-gold/80 bg-gold/5 text-xs py-1">
                  {h}
                </Badge>
              ))}
            </div>
          </motion.section>
        )}

        {/* Photos & Videos Gallery */}
        {(photos.length > 0 || videos.length > 0) && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => setActiveMediaTab("photos")}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                  activeMediaTab === "photos" ? "text-gold border-gold" : "text-white/40 border-transparent hover:text-white/60"
                }`}
              >
                📸 Photos ({photos.length})
              </button>
              {videos.length > 0 && (
                <button
                  onClick={() => setActiveMediaTab("videos")}
                  className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                    activeMediaTab === "videos" ? "text-gold border-gold" : "text-white/40 border-transparent hover:text-white/60"
                  }`}
                >
                  🎬 Vidéos ({videos.length})
                </button>
              )}
            </div>

            {activeMediaTab === "photos" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photos.map((photo: any, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-white/5">
                    <img src={photo.url} alt={photo.caption || establishment.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            )}

            {activeMediaTab === "videos" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {videos.map((video: any, i: number) => (
                  <a key={i} href={video.url} target="_blank" rel="noopener noreferrer"
                    className="relative aspect-video rounded-lg overflow-hidden bg-white/5 group"
                  >
                    {video.thumbnailUrl && (
                      <img src={video.thumbnailUrl} alt={video.caption} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                      <Play className="w-12 h-12 text-white/80" />
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      {video.type === "tiktok" && <Music className="w-3 h-3 text-white" />}
                      {video.type === "instagram_reel" && <Instagram className="w-3 h-3 text-white" />}
                      <span className="text-xs text-white/80">{video.caption}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Viral Videos from TikTok/Instagram */}
        {viralVideos.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-lg font-playfair font-semibold text-white mb-3 flex items-center gap-2">
              <Music className="w-5 h-5 text-pink-400" /> Vidéos virales
            </h2>
            <div className="space-y-2">
              {viralVideos.map((v: any, i: number) => (
                <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-gold/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    {v.platform === "tiktok" ? <Music className="w-5 h-5 text-white" /> : <Instagram className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{v.title}</p>
                    <p className="text-xs text-white/40">{v.views} vues · {v.platform}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/30 flex-shrink-0" />
                </a>
              ))}
            </div>
          </motion.section>
        )}

        {/* Anecdotes & Secrets */}
        {anecdotes.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="text-lg font-playfair font-semibold text-white mb-3 flex items-center gap-2">
              <Quote className="w-5 h-5 text-gold" /> Anecdotes & Secrets
            </h2>
            <div className="space-y-3">
              {anecdotes.map((a: string, i: number) => (
                <div key={i} className="pl-4 border-l-2 border-gold/30">
                  <p className="text-sm text-white/70 italic">{a}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Things to Know */}
        {thingsToKnow.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-lg font-playfair font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" /> Ce qu'il faut savoir
            </h2>
            <div className="space-y-2">
              {thingsToKnow.map((t: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <AlertCircle className="w-4 h-4 text-blue-400/60 mt-0.5 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <h2 className="text-lg font-playfair font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> Avis clients
            </h2>
            <div className="space-y-3">
              {reviews.map((r: any, i: number) => (
                <div key={i} className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/80">{r.author}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: r.rating || 5 }).map((_, j) => (
                        <Star key={j} className="w-3 h-3 text-amber-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/60">{r.text}</p>
                  {r.source && <p className="text-xs text-white/30 mt-2">— {r.source}</p>}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Affiliate CTA */}
        {affiliateLinks.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="bg-gradient-to-r from-gold/10 to-gold/5 rounded-xl p-6 border border-gold/20">
              <h3 className="text-lg font-playfair font-semibold text-white mb-2">Réserver maintenant</h3>
              <p className="text-sm text-white/60 mb-4">Profitez des meilleurs tarifs via nos partenaires</p>
              <div className="flex flex-wrap gap-2">
                {affiliateLinks.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-gold text-background hover:bg-gold/90 text-sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {link.label || link.partner}
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Address & Map Link */}
        {establishment.address && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="bg-white/[0.03] rounded-lg p-4 border border-white/5"
          >
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold mt-0.5" />
              <div>
                <p className="text-sm text-white/80">{establishment.address}</p>
                <p className="text-xs text-white/40 mt-1">{establishment.city}, {establishment.country}</p>
                {establishment.lat && establishment.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${establishment.lat},${establishment.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    Voir sur Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Partage Multi-Canal */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="bg-white/[0.03] rounded-lg p-6 border border-white/5">
            <h3 className="text-lg font-playfair font-semibold text-white mb-2">Partager cette fiche</h3>
            <p className="text-xs text-white/40 mb-4">Envoyez cette adresse ou demandez une prise en charge</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:border-gold/30 hover:text-gold text-xs h-auto py-3 flex-col gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Lien copié ! Envoyez-le à un proche.");
                }}
              >
                <Share2 className="w-4 h-4" />
                Un proche
              </Button>
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:border-gold/30 hover:text-gold text-xs h-auto py-3 flex-col gap-1"
                onClick={() => {
                  toast.info("Fonctionnalité bientôt disponible");
                }}
              >
                <Sparkles className="w-4 h-4" />
                Mon assistant
              </Button>
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:border-gold/30 hover:text-gold text-xs h-auto py-3 flex-col gap-1"
                onClick={() => {
                  toast.info("Indiquez le contact de votre conciergerie préférée");
                }}
              >
                <Phone className="w-4 h-4" />
                Ma conciergerie
              </Button>
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:border-gold/30 hover:text-gold text-xs h-auto py-3 flex-col gap-1"
                onClick={() => {
                  toast.info("Demande envoyée à une conciergerie partenaire Baymora");
                }}
              >
                <Globe className="w-4 h-4" />
                Conciergerie Baymora
              </Button>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Sticky CTA Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-white/10 p-3 z-50">
        <div className="container max-w-4xl flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{establishment.name}</p>
            <p className="text-xs text-white/40">
              {establishment.priceRange || priceLevelLabels[establishment.priceLevel || ""] || ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gold/30 text-gold hover:bg-gold/10 rounded-none text-xs"
              onClick={() => {
                toast.success("Ajouté à votre parcours !");
              }}
            >
              <MapPin className="w-3 h-3 mr-1" /> Ajouter au parcours
            </Button>
            {affiliateLinks.length > 0 ? (
              <a href={affiliateLinks[0].url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gold text-background hover:bg-gold/90 rounded-none text-xs">
                  Réserver <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </a>
            ) : (
              <Button
                size="sm"
                className="bg-gold text-background hover:bg-gold/90 rounded-none text-xs"
                onClick={() => navigate("/chat")}
              >
                Réserver via l'assistant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
