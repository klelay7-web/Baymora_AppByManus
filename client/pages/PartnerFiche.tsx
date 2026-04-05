import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, ExternalLink, Star, Tag, Video, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PartnerOffer {
  id: string;
  type: string;
  title: string;
  description?: string;
  normalPrice?: number;
  baymoraPrice?: number;
  currency: string;
  bookingUrl?: string;
  isActive: boolean;
}

interface Partner {
  id: string;
  slug: string;
  name: string;
  type: string;
  city: string;
  address?: string;
  country: string;
  description?: string;
  vibe?: string;
  photos: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  mapQuery?: string;
  tags: string[];
  priceLevel: number;
  affiliateCode: string;
  commissionRate: number;
  website?: string;
  offers: PartnerOffer[];
}

const TYPE_LABELS: Record<string, string> = {
  hotel: 'Hôtel',
  spa: 'Spa',
  restaurant: 'Restaurant',
  transport: 'Transport',
  activity: 'Activité',
  villa: 'Villa',
};

const OFFER_ICONS: Record<string, string> = {
  stay_1night: '🌙',
  stay_2nights: '🌙🌙',
  stay_3nights: '🌙🌙🌙',
  day_pass: '☀️',
  spa: '🧖',
  massage: '💆',
  activity: '🎯',
  custom: '✨',
};

function buildTrackingUrl(affiliateCode: string, redirect?: string): string {
  const base = `/api/partners/track/${affiliateCode}`;
  return redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : base;
}

export default function PartnerFiche() {
  const { slug } = useParams<{ slug: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/partners/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setPartner(data.partner);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !partner) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-center p-6">
        <div>
          <p className="text-white/40 text-lg mb-4">Partenaire introuvable</p>
          <Link to="/"><Button variant="ghost" className="text-secondary">← Retour à l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  const heroPhoto = partner.photos[selectedPhoto] || null;
  const mapQuery = partner.mapQuery || `${partner.name}, ${partner.city}`;
  const bookingUrl = buildTrackingUrl(
    partner.affiliateCode,
    partner.website || undefined,
  );

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#080c14]/90 backdrop-blur-md border-b border-white/8 px-5 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="flex items-center gap-2 bg-secondary/15 border border-secondary/30 rounded-full px-3 py-1">
          <span className="text-secondary text-xs font-bold">🤝 Partenaire Baymora</span>
        </div>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-black font-semibold text-xs">
            Réserver
          </Button>
        </a>
      </div>

      {/* Hero photo */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {heroPhoto ? (
          <img src={heroPhoto} alt={partner.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <span className="text-6xl opacity-30">🏨</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-secondary/20 border border-secondary/40 text-secondary px-2 py-0.5 rounded-full font-semibold">
              {TYPE_LABELS[partner.type] || partner.type}
            </span>
            <span className="text-white/50 text-xs">{'€'.repeat(partner.priceLevel)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{partner.name}</h1>
          <p className="text-white/60 flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {partner.city}{partner.address ? ` — ${partner.address}` : ''}{partner.country !== 'FR' ? `, ${partner.country}` : ''}
          </p>
        </div>
      </div>

      {/* Photo gallery */}
      {partner.photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none">
          {partner.photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setSelectedPhoto(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === selectedPhoto ? 'border-secondary' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 py-6 space-y-8">
        {/* Description & vibe */}
        <div>
          {partner.vibe && (
            <p className="text-secondary/80 text-sm font-semibold italic mb-3">"{partner.vibe}"</p>
          )}
          {partner.description && (
            <p className="text-white/65 leading-relaxed">{partner.description}</p>
          )}
          {partner.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {partner.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 bg-white/6 border border-white/10 text-white/60 text-xs px-3 py-1 rounded-full">
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Offres exclusives */}
        {partner.offers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-secondary text-lg">🤝</span>
              <h2 className="text-white font-bold text-lg">Offres exclusives Baymora</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partner.offers.map(offer => {
                const icon = OFFER_ICONS[offer.type] || '✨';
                const offerBookingUrl = buildTrackingUrl(
                  partner.affiliateCode,
                  offer.bookingUrl || partner.website || undefined,
                );
                return (
                  <div
                    key={offer.id}
                    className="bg-gradient-to-br from-secondary/8 to-secondary/4 border border-secondary/25 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xl mr-2">{icon}</span>
                        <span className="text-white font-semibold text-sm">{offer.title}</span>
                      </div>
                    </div>
                    {offer.description && (
                      <p className="text-white/45 text-xs leading-relaxed mb-3">{offer.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {offer.baymoraPrice ? (
                          <div>
                            <p className="text-secondary font-bold text-sm">
                              {offer.baymoraPrice}{offer.currency} <span className="text-secondary/70 text-xs">membres</span>
                            </p>
                            {offer.normalPrice && (
                              <p className="text-white/30 text-xs line-through">{offer.normalPrice}{offer.currency}</p>
                            )}
                          </div>
                        ) : offer.normalPrice ? (
                          <p className="text-white/60 text-sm">{offer.normalPrice}{offer.currency}</p>
                        ) : null}
                      </div>
                      <a
                        href={offerBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-secondary/20 border border-secondary/40 text-secondary text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-secondary/35 transition-all"
                      >
                        Réserver <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Carte Google Maps */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Map className="h-4 w-4 text-secondary" />
            <h2 className="text-white font-bold">Localisation</h2>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10 h-48">
            <iframe
              title="Localisation"
              width="100%"
              height="100%"
              style={{ filter: 'invert(90%) hue-rotate(180deg)' }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&z=15`}
              allowFullScreen
              loading="lazy"
            />
          </div>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-white/40 hover:text-white/60 text-xs mt-2 transition-colors"
          >
            <MapPin className="h-3 w-3" />
            Ouvrir dans Google Maps
          </a>
        </div>

        {/* Vidéo */}
        {partner.videoUrl && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-4 w-4 text-secondary" />
              <h2 className="text-white font-bold">Découvrir en vidéo</h2>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
              <iframe
                src={partner.videoUrl}
                title="Vidéo partenaire"
                width="100%"
                height="100%"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Visite virtuelle */}
        {partner.virtualTourUrl && (
          <a
            href={partner.virtualTourUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-white/5 border border-white/10 hover:border-white/20 text-white/70 text-sm font-medium py-4 rounded-2xl transition-all"
          >
            🌐 Visite virtuelle 360°
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {/* CTA final */}
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/25 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="text-white font-bold text-lg mb-2">Réserver via Baymora</h3>
          <p className="text-white/45 text-sm mb-5">
            Accédez aux tarifs exclusifs membres et bénéficiez d'un service personnalisé.
          </p>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
            <Button className="bg-secondary hover:bg-secondary/90 text-black font-bold px-8 py-3 text-base rounded-2xl">
              Réserver maintenant →
            </Button>
          </a>
          {partner.website && (
            <p className="text-white/25 text-xs mt-3">
              ou{' '}
              <a href={partner.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40">
                visiter le site officiel
              </a>
            </p>
          )}
        </div>

        {/* Mention Baymora */}
        <div className="text-center border-t border-white/6 pt-6">
          <p className="text-white/25 text-xs">
            Établissement testé et approuvé par l'équipe Baymora.{' '}
            <Link to="/devenir-partenaire" className="text-secondary/50 hover:text-secondary/70">
              Rejoindre le réseau →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
