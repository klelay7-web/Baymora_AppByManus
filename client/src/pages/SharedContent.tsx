import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { MapPin, Calendar, Clock, Users, ArrowRight, Sparkles, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareModal, useShareModal } from "@/components/ShareModal";

function formatPrice(price: number | null | undefined, currency = "EUR") {
  if (!price) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

export default function SharedContent() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { shareState, openShare, closeShare } = useShareModal();

  const { data, isLoading, error } = trpc.share.getSharedContent.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center">
        <div className="text-[#c8a94a] text-sm tracking-widest animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full border border-[#c8a94a]/20 flex items-center justify-center">
            <Share2 className="w-7 h-7 text-[#c8a94a]/50" />
          </div>
          <h1 className="text-2xl font-serif text-white">Lien expiré ou introuvable</h1>
          <p className="text-white/40">Ce lien de partage n'est plus valide ou a expiré.</p>
          <Link href="/">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a]">
              Découvrir Baymora
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { link, resource } = data;

  return (
    <div className="min-h-screen bg-[#06060a] text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#06060a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-[#c8a94a] font-serif text-lg tracking-widest cursor-pointer">BAYMORA</span>
          </Link>
          <Link href="/">
            <Button size="sm" className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Découvrir l'app
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Shared by banner */}
        <div className="flex items-center gap-2 text-white/30 text-xs mb-6">
          <Share2 className="w-3.5 h-3.5" />
          <span>Partagé via Maison Baymora</span>
          {link.viewCount > 1 && (
            <span className="ml-auto">{link.viewCount} vues</span>
          )}
        </div>

        {/* Content based on type */}
        {link.type === "trip" && resource && (
          <TripSharedView trip={resource} onShare={() => openShare({
            type: "trip",
            resourceId: resource.id,
            title: resource.title,
            description: resource.destination,
            coverImage: resource.coverImage,
          })} />
        )}

        {link.type === "offer" && resource && (
          <OfferSharedView offer={resource} onShare={() => openShare({
            type: "offer",
            resourceId: resource.id,
            title: resource.name,
            description: resource.shortDescription,
            coverImage: resource.coverImage,
          })} />
        )}

        {/* CTA */}
        <div className="mt-10 p-6 bg-[#c8a94a]/5 border border-[#c8a94a]/15 rounded-2xl text-center space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#c8a94a]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#c8a94a]" />
          </div>
          <h3 className="text-white font-semibold">Créez votre parcours sur-mesure</h3>
          <p className="text-white/40 text-sm">MAYA, votre concierge IA, vous accompagne pour planifier chaque détail de votre voyage de luxe.</p>
          <Link href="/chat">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] gap-2">
              Parler à MAYA <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <ShareModal
        isOpen={shareState.isOpen}
        onClose={closeShare}
        type={shareState.type}
        resourceId={shareState.resourceId}
        title={shareState.title}
        description={shareState.description}
        coverImage={shareState.coverImage}
      />
    </div>
  );
}

function TripSharedView({ trip, onShare }: { trip: any; onShare: () => void }) {
  return (
    <div className="space-y-6">
      {/* Cover */}
      {trip.coverImage && (
        <div className="relative h-56 rounded-2xl overflow-hidden">
          <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060a]/80 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#c8a94a]/60 text-xs mb-2 uppercase tracking-widest">
          <MapPin className="w-3.5 h-3.5" />
          {trip.destination}
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-serif text-white leading-tight">{trip.title}</h1>
          <button
            onClick={onShare}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
          >
            <Share2 className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm text-white/50">
        {trip.startDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(trip.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}
        {trip.totalDays && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {trip.totalDays} jours
          </div>
        )}
        {trip.tripType && (
          <span className="bg-[#c8a94a]/10 text-[#c8a94a] px-3 py-1 rounded-full text-xs">
            {trip.tripType}
          </span>
        )}
      </div>

      {/* Summary */}
      {trip.summary && (
        <p className="text-white/60 leading-relaxed">{trip.summary}</p>
      )}

      {/* CTA */}
      <Link href="/offres">
        <Button variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 gap-2 w-full">
          Voir les offres similaires <ExternalLink className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}

function OfferSharedView({ offer, onShare }: { offer: any; onShare: () => void }) {
  return (
    <div className="space-y-6">
      {/* Cover */}
      {offer.coverImage && (
        <div className="relative h-56 rounded-2xl overflow-hidden">
          <img src={offer.coverImage} alt={offer.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060a]/80 to-transparent" />
          {offer.discountPercent && (
            <div className="absolute top-4 left-4 bg-[#c8a94a] text-[#080c14] text-sm font-bold px-3 py-1.5 rounded-full">
              -{offer.discountPercent}%
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#c8a94a]/60 text-xs mb-2 uppercase tracking-widest">
          <MapPin className="w-3.5 h-3.5" />
          {offer.location}
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-serif text-white leading-tight">{offer.name}</h1>
          <button
            onClick={onShare}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
          >
            <Share2 className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Price */}
      {(offer.discountedPrice || offer.originalPrice) && (
        <div className="flex items-end gap-3">
          {offer.discountedPrice && (
            <span className="text-[#c8a94a] font-bold text-3xl">
              {formatPrice(offer.discountedPrice)}
            </span>
          )}
          {offer.originalPrice && offer.discountedPrice && (
            <span className="text-white/30 text-lg line-through mb-1">
              {formatPrice(offer.originalPrice)}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {offer.shortDescription && (
        <p className="text-white/60 leading-relaxed">{offer.shortDescription}</p>
      )}

      {/* CTA */}
      <Link href="/offres">
        <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] gap-2 w-full">
          Voir toutes les offres <ExternalLink className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
