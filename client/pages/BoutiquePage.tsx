import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, ExternalLink, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoutiqueOffer {
  id: string;
  type: string;
  title: string;
  description?: string;
  normalPrice?: number;
  baymoraPrice?: number;
  currency: string;
  bookingUrl?: string;
  minTier: string;
  partner: {
    id: string;
    name: string;
    slug: string;
    type: string;
    city: string;
    affiliateCode: string;
    photos: string[];
    vibe?: string;
    tags: string[];
  };
}

// ─── Données tiers ────────────────────────────────────────────────────────────

const TIERS = [
  {
    slug: 'crystal', name: 'Crystal', min: 0, emoji: '💎',
    textClass: 'text-sky-400', bgClass: 'bg-sky-400/10 border-sky-400/25',
    benefit: 'Accès aux offres membres de base',
    perks: ['Tarifs exclusifs Baymora sur toutes les offres Crystal', 'Badge membre sur votre profil', 'Recommandations personnalisées par l\'IA'],
  },
  {
    slug: 'gold', name: 'Gold', min: 500, emoji: '🌟',
    textClass: 'text-amber-400', bgClass: 'bg-amber-400/10 border-amber-400/25',
    benefit: 'Offres Gold + avantages Crystal',
    perks: ['Accès aux offres Gold exclusives', 'Priorité sur les nouvelles fiches partenaires', 'Mention Gold sur le leaderboard Club'],
  },
  {
    slug: 'platinum', name: 'Platinum', min: 2000, emoji: '✨',
    textClass: 'text-violet-400', bgClass: 'bg-violet-400/10 border-violet-400/25',
    benefit: 'Offres Platinum + remises supplémentaires',
    perks: ['Accès aux offres Platinum confidentielles', 'Invitations en avant-première aux nouvelles expériences', 'Support concierge prioritaire'],
  },
  {
    slug: 'diamond', name: 'Diamond', min: 5000, emoji: '👑',
    textClass: 'text-white', bgClass: 'bg-white/8 border-white/20',
    benefit: 'Accès total + service Diamond',
    perks: ['Toutes les offres déverrouillées', 'Service concierge dédié 24h/24', 'Accès aux expériences privées Baymora', 'Tarif négocié maximisé'],
  },
];

const TIER_ORDER: Record<string, number> = { crystal: 0, gold: 1, platinum: 2, diamond: 3 };

const OFFER_ICONS: Record<string, string> = {
  stay_1night: '🌙', stay_2nights: '🌙🌙', stay_3nights: '🌙🌙🌙',
  day_pass: '☀️', spa: '🧖', massage: '💆', activity: '🎯', custom: '✨',
};

const PARTNER_TYPE_LABELS: Record<string, string> = {
  hotel: 'Hôtel', spa: 'Spa', restaurant: 'Restaurant',
  transport: 'Transport', activity: 'Activité', villa: 'Villa',
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function BoutiquePage() {
  const { isAuthenticated, authHeader } = useAuth();
  const [offers, setOffers] = useState<BoutiqueOffer[]>([]);
  const [clubMe, setClubMe] = useState<{ points: number; tier: { name: string }; inviteCode: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Tier slug depuis nom
  const userTierSlug = clubMe?.tier.name.toLowerCase() ?? 'crystal';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const offerRes = await fetch('/api/partners/boutique');
        if (offerRes.ok) setOffers((await offerRes.json()).offers ?? []);
        if (isAuthenticated) {
          const meRes = await fetch('/api/club/me', { headers: authHeader });
          if (meRes.ok) setClubMe(await meRes.json());
        }
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated]);

  const canAccess = (minTier: string) =>
    TIER_ORDER[userTierSlug] >= TIER_ORDER[minTier];

  const filterTypes = ['all', ...Array.from(new Set(offers.map(o => o.partner.type)))];

  const filteredOffers = activeFilter === 'all'
    ? offers
    : offers.filter(o => o.partner.type === activeFilter);

  // Grouper par minTier
  const grouped = TIERS.map(tier => ({
    tier,
    offers: filteredOffers.filter(o => o.minTier === tier.slug),
  })).filter(g => g.offers.length > 0);

  const buildBookingUrl = (offer: BoutiqueOffer) => {
    const base = `/api/partners/track/${offer.partner.affiliateCode}`;
    return offer.bookingUrl ? `${base}?redirect=${encodeURIComponent(offer.bookingUrl)}` : base;
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#080c14]/90 backdrop-blur-md border-b border-white/8 px-5 py-3 flex items-center gap-4">
        <Link to="/club" className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="text-xs text-secondary/80 font-semibold uppercase tracking-widest">Club exclusif</div>
          <h1 className="text-white font-bold">Boutique Baymora</h1>
        </div>
        {clubMe && (
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
            TIERS.find(t => t.slug === userTierSlug)?.bgClass ?? 'bg-white/5 border-white/10'
          } ${TIERS.find(t => t.slug === userTierSlug)?.textClass ?? 'text-white/40'}`}>
            {TIERS.find(t => t.slug === userTierSlug)?.emoji}
            <span className="font-semibold">{clubMe.tier.name}</span>
            <span className="opacity-60">· {clubMe.points} pts</span>
          </div>
        )}
      </div>

      {/* Tiers benefits table */}
      <div className="border-b border-white/6 overflow-x-auto">
        <div className="flex gap-0 min-w-max px-5 py-4 mx-auto max-w-5xl">
          {TIERS.map(tier => {
            const isUnlocked = TIER_ORDER[userTierSlug] >= TIER_ORDER[tier.slug];
            const isCurrent = userTierSlug === tier.slug;
            return (
              <div
                key={tier.slug}
                className={`flex-1 min-w-[160px] px-4 py-3 rounded-2xl mx-1 border transition-all ${
                  isCurrent
                    ? tier.bgClass
                    : isUnlocked
                    ? 'bg-white/3 border-white/8'
                    : 'bg-white/2 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-lg">{tier.emoji}</span>
                  <span className={`font-bold text-sm ${isCurrent ? tier.textClass : 'text-white/60'}`}>
                    {tier.name}
                  </span>
                  {isCurrent && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tier.bgClass} ${tier.textClass}`}>
                      Votre niveau
                    </span>
                  )}
                  {!isUnlocked && !isCurrent && (
                    <span className="text-white/20 text-xs">{tier.min.toLocaleString('fr-FR')} pts</span>
                  )}
                </div>
                <ul className="space-y-1">
                  {tier.perks.map((perk, i) => (
                    <li key={i} className={`text-xs flex items-start gap-1 ${isUnlocked ? 'text-white/55' : 'text-white/20'}`}>
                      <span className="mt-0.5 flex-shrink-0">{isUnlocked ? '✓' : '·'}</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6 space-y-8">
        {/* Filters par type */}
        {filterTypes.length > 2 && (
          <div className="flex gap-2 flex-wrap">
            {filterTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeFilter === type
                    ? 'bg-secondary/20 border-secondary/40 text-secondary'
                    : 'bg-white/4 border-white/8 text-white/50 hover:text-white/70'
                }`}
              >
                {type === 'all' ? '✦ Tout' : PARTNER_TYPE_LABELS[type] ?? type}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map(j => <div key={j} className="bg-white/5 border border-white/8 rounded-2xl h-44 animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-10 w-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucune offre disponible pour l'instant</p>
            <p className="text-white/15 text-xs mt-1">Les partenaires approuvés ajouteront leurs offres ici</p>
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">Aucune offre pour ce filtre</p>
        ) : (
          grouped.map(({ tier, offers: tierOffers }) => (
            <div key={tier.slug}>
              {/* Section header */}
              <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl w-fit border ${tier.bgClass}`}>
                <span className="text-base">{tier.emoji}</span>
                <span className={`font-bold text-sm ${tier.textClass}`}>Offres {tier.name}</span>
                {!canAccess(tier.slug) && (
                  <span className="text-white/30 text-xs ml-1">
                    · Débloqué à {tier.min.toLocaleString('fr-FR')} Crystals
                  </span>
                )}
                {canAccess(tier.slug) && (
                  <span className={`text-xs ${tier.textClass} opacity-60`}>· Déverrouillé</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tierOffers.map(offer => {
                  const unlocked = canAccess(offer.minTier);
                  const icon = OFFER_ICONS[offer.type] || '✨';
                  const heroPhoto = (offer.partner.photos as string[])[0] ?? null;

                  return (
                    <div
                      key={offer.id}
                      className={`relative rounded-2xl overflow-hidden border transition-all ${
                        unlocked
                          ? 'border-white/10 bg-slate-900 hover:border-white/20'
                          : 'border-white/5 bg-slate-950/50 opacity-60'
                      }`}
                    >
                      {/* Hero */}
                      <div className="h-24 relative overflow-hidden">
                        {heroPhoto ? (
                          <img src={heroPhoto} alt={offer.partner.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                            <span className="text-3xl opacity-30">{icon}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                        {/* Tier badge */}
                        <div className={`absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.bgClass} ${tier.textClass}`}>
                          {tier.emoji} {tier.name}
                        </div>
                        {/* Lock overlay */}
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="text-center">
                              <Lock className="h-5 w-5 text-white/40 mx-auto mb-1" />
                              <p className="text-white/40 text-[10px]">{tier.min.toLocaleString('fr-FR')} Crystals</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3 space-y-1.5">
                        <div>
                          <p className="text-white font-semibold text-sm leading-tight line-clamp-1">
                            {icon} {offer.title}
                          </p>
                          <p className="text-white/40 text-xs mt-0.5">
                            🤝 {offer.partner.name} · {offer.partner.city}
                          </p>
                          <p className="text-white/25 text-[10px]">
                            {PARTNER_TYPE_LABELS[offer.partner.type] ?? offer.partner.type}
                          </p>
                        </div>
                        {offer.description && (
                          <p className="text-white/45 text-xs leading-relaxed line-clamp-2">{offer.description}</p>
                        )}
                        <div className="flex items-end justify-between gap-2 pt-1">
                          <div>
                            {offer.baymoraPrice ? (
                              <div>
                                <p className="text-secondary font-bold text-sm">{offer.baymoraPrice}{offer.currency}</p>
                                {offer.normalPrice && (
                                  <p className="text-white/25 text-[10px] line-through">{offer.normalPrice}{offer.currency}</p>
                                )}
                              </div>
                            ) : offer.normalPrice ? (
                              <p className="text-white/60 text-sm">{offer.normalPrice}{offer.currency}</p>
                            ) : null}
                          </div>
                          {unlocked ? (
                            <a
                              href={buildBookingUrl(offer)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 bg-secondary/15 border border-secondary/35 text-secondary text-[10px] font-bold px-2.5 py-1.5 rounded-xl hover:bg-secondary/25 transition-all flex-shrink-0"
                            >
                              Réserver <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <Link
                              to="/club"
                              className="flex items-center gap-1 bg-white/5 border border-white/10 text-white/30 text-[10px] font-medium px-2.5 py-1.5 rounded-xl flex-shrink-0"
                            >
                              <Lock className="h-2.5 w-2.5" /> Débloquer
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* CTA non connecté */}
        {!isAuthenticated && (
          <div className="bg-secondary/8 border border-secondary/20 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-white font-bold mb-2">Connectez-vous pour accéder aux offres</h3>
            <p className="text-white/40 text-sm mb-4">Créez votre compte Baymora gratuit et débutez avec 50 Crystals</p>
            <Link to="/auth">
              <button className="bg-secondary hover:bg-secondary/90 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-all">
                Rejoindre gratuitement →
              </button>
            </Link>
          </div>
        )}

        {/* Lien Club */}
        <div className="text-center pt-2 pb-8">
          <Link to="/club" className="text-white/20 hover:text-white/40 text-xs transition-colors">
            ← Revenir au Club · Gagner plus de Crystals
          </Link>
        </div>
      </div>
    </div>
  );
}
