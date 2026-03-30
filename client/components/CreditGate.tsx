/**
 * CreditGate — "La Porte Dorée"
 *
 * S'affiche quand les crédits sont épuisés. S'adapte au plan actuel :
 *
 *   Guest (découverte)  → 3 paliers déblocage + CTA Voyageur 9,90€
 *   Voyageur             → 3 paliers + CTA Explorateur 29€
 *   Explorateur          → 3 paliers + CTA Privé 79€
 *   Privé                → 3 paliers + CTA Fondateur 199€
 *   Fondateur            → Packs de crédits uniquement
 *
 * Les prix des déblocages sont volontairement élevés pour rendre
 * l'abonnement supérieur évident (9,90€ = 5 crédits OU 100/mois).
 */

import { useState } from 'react';
import { Sparkles, ArrowRight, Crown, Zap, Gift, TrendingUp, X, AlertCircle } from 'lucide-react';
import type { UpgradeOptions, CreditsInfo } from '@/hooks/useChat';

// ─── Config des plans pour l'affichage ──────────────────────────────────────

const PLAN_DISPLAY: Record<string, {
  name: string;
  badge: string;
  credits: number;
  price: string;
  priceValue: number;
  color: string;
  features: string[];
}> = {
  voyageur: {
    name: 'Voyageur',
    badge: '✦',
    credits: 100,
    price: '9,90 €/mois',
    priceValue: 9.90,
    color: 'from-blue-500/20 to-blue-600/10',
    features: [
      '100 crédits/mois (rollover)',
      '20 recherches temps réel',
      '3 plans de voyage',
      'Mémoire de vos préférences',
    ],
  },
  explorateur: {
    name: 'Explorateur',
    badge: '✦✦',
    credits: 350,
    price: '29 €/mois',
    priceValue: 29,
    color: 'from-emerald-500/20 to-emerald-600/10',
    features: [
      '350 crédits/mois (rollover)',
      'Recherches temps réel illimitées',
      '10 plans de voyage',
      'Conciergerie IA',
      'Boutique Gold',
    ],
  },
  prive: {
    name: 'Cercle Privé',
    badge: '✦✦✦',
    credits: 1200,
    price: '79 €/mois',
    priceValue: 79,
    color: 'from-amber-500/20 to-amber-600/10',
    features: [
      '1 200 crédits/mois (rollover)',
      'Tout illimité',
      'Conciergerie prioritaire',
      'Boutique Platinum',
      'Tarifs partenaires négociés',
    ],
  },
  fondateur: {
    name: 'Fondateur',
    badge: '✦✦✦✦',
    credits: 4000,
    price: '199 €/mois',
    priceValue: 199,
    color: 'from-purple-500/20 to-purple-600/10',
    features: [
      '4 000 crédits/mois (rollover)',
      'Conciergerie humaine dédiée',
      'Boutique Diamond',
      'Accès VIP partenaires',
    ],
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  isAuthenticated: boolean;
  currentCircle?: string;
  credits?: CreditsInfo | null;
  upgradeOptions?: UpgradeOptions | null;
  conversationId?: string;
  onClose?: () => void;
  onSignup?: () => void;
}

export default function CreditGate({
  isAuthenticated,
  currentCircle = 'decouverte',
  credits,
  upgradeOptions,
  conversationId,
  onClose,
  onSignup,
}: Props) {
  const [loadingUnlock, setLoadingUnlock] = useState<string | null>(null);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPlan = upgradeOptions?.nextPlan;
  const nextPlanInfo = nextPlan ? PLAN_DISPLAY[nextPlan] : null;
  const isTopTier = currentCircle === 'fondateur';

  // ── Déblocage ponctuel ─────────────────────────────────────────────────────

  const handleUnlock = async (unlockId: string) => {
    setLoadingUnlock(unlockId);
    try {
      const response = await fetch('/api/stripe/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unlockId,
          fingerprint: !isAuthenticated ? await getFingerprint() : undefined,
          conversationId,
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setLoadingUnlock(null);
    }
  };

  // ── Upgrade de plan ────────────────────────────────────────────────────────

  const handleUpgrade = async () => {
    if (!nextPlan) return;

    if (!isAuthenticated) {
      onSignup?.();
      return;
    }

    setLoadingUpgrade(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circle: nextPlan }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Erreur lors de la mise à niveau. Veuillez réessayer.');
    } finally {
      setLoadingUpgrade(false);
    }
  };

  // ── Calcul du "X fois plus avantageux" ─────────────────────────────────────

  const unlockTiers = upgradeOptions?.unlockTiers || [];
  const cheapestUnlock = unlockTiers[0]; // 5 crédits pour 9.90€
  const savingsMultiplier = nextPlanInfo && cheapestUnlock
    ? Math.round((nextPlanInfo.credits / nextPlanInfo.priceValue) / (cheapestUnlock.credits / cheapestUnlock.priceEur))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop avec blur doré */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-secondary/20 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-secondary/10 overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Shimmer top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />

        {/* Close */}
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white z-10">
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="p-6 sm:p-8">

          {/* ── Erreur ── */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 ml-auto"><X className="h-3 w-3" /></button>
            </div>
          )}

          {/* ── Header ── */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {credits && credits.used > 0
                ? `${credits.used} échanges — vous avez bon goût`
                : 'Vos crédits sont épuisés'}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {isAuthenticated
                ? 'Rechargez ou passez au niveau supérieur'
                : 'Continuez l\'aventure — 3 options'}
            </p>
          </div>

          {/* ── Option 1 : Déblocage ponctuel (3 paliers) ── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-white/50" />
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Déblocage immédiat</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {unlockTiers.map((tier, i) => (
                <button
                  key={tier.id}
                  onClick={() => handleUnlock(tier.id)}
                  disabled={!!loadingUnlock}
                  className={`relative p-3 rounded-xl border transition-all text-center ${
                    i === 2
                      ? 'border-secondary/30 bg-secondary/5 hover:bg-secondary/10'
                      : 'border-white/10 bg-white/3 hover:bg-white/5'
                  } ${loadingUnlock === tier.id ? 'opacity-50' : ''}`}
                >
                  {i === 2 && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Meilleur
                    </span>
                  )}
                  <p className="text-white font-bold text-lg">{tier.credits}</p>
                  <p className="text-white/40 text-[10px] mb-1">crédits</p>
                  <p className="text-white font-semibold text-sm">{tier.priceEur.toFixed(2).replace('.', ',')} €</p>
                  <p className="text-white/30 text-[10px] mt-0.5">
                    {(tier.priceEur / tier.credits).toFixed(2).replace('.', ',')} €/crédit
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Séparateur avec flèche de comparaison ── */}
          {nextPlanInfo && (
            <>
              <div className="relative flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-bold px-3 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  {savingsMultiplier ? `${savingsMultiplier}x plus avantageux` : 'Bien plus avantageux'}
                </div>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* ── Option 2 : Abonnement (le vrai CTA) ── */}
              <div className={`relative p-5 rounded-2xl border-2 border-secondary/30 bg-gradient-to-br ${nextPlanInfo.color} mb-4`}>
                {/* Badge recommandé */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-secondary text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg shadow-secondary/30 flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Recommandé
                  </span>
                </div>

                <div className="flex items-start justify-between mt-1 mb-3">
                  <div>
                    <p className="text-white font-bold text-lg flex items-center gap-2">
                      {nextPlanInfo.badge} {nextPlanInfo.name}
                    </p>
                    <p className="text-secondary font-bold text-xl">{nextPlanInfo.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-2xl">{nextPlanInfo.credits}</p>
                    <p className="text-white/40 text-xs">crédits/mois</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1.5 mb-4">
                  {nextPlanInfo.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-secondary" />
                      <p className="text-white/70 text-xs">{f}</p>
                    </div>
                  ))}
                </div>

                {/* Rollover callout */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 mb-4">
                  <p className="text-white/60 text-xs flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                    <span>
                      <strong className="text-white/80">Rollover inclus</strong> — vos crédits non utilisés s'additionnent d'un mois sur l'autre.
                      Pas de perte, même quand l'app est en sommeil.
                    </span>
                  </p>
                </div>

                {/* Comparaison */}
                {cheapestUnlock && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 mb-4">
                    <p className="text-white/50 text-xs">
                      <span className="text-red-400/80 line-through">{cheapestUnlock.credits} crédits pour {cheapestUnlock.priceEur.toFixed(2).replace('.', ',')} €</span>
                      {' '}→{' '}
                      <span className="text-green-400 font-semibold">{nextPlanInfo.credits} crédits pour {nextPlanInfo.price}</span>
                    </p>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handleUpgrade}
                  disabled={loadingUpgrade}
                  className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-secondary/25 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingUpgrade
                    ? 'Chargement...'
                    : isAuthenticated
                      ? <>Passer à {nextPlanInfo.name} <ArrowRight className="h-4 w-4" /></>
                      : <>Créer mon profil + {nextPlanInfo.name} <ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                {!isAuthenticated && (
                  <p className="text-center text-white/25 text-xs mt-2">
                    Inscription gratuite — vous choisissez votre forfait après
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Option 3 pour guests : inscription gratuite ── */}
          {!isAuthenticated && (
            <div className="mt-3">
              <div className="relative flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <button
                onClick={onSignup}
                className="w-full h-11 border border-white/15 bg-white/5 text-white/80 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/25 transition-all text-sm"
              >
                Créer un profil gratuit (15 crédits offerts)
              </button>
              <p className="text-center text-white/20 text-xs mt-1.5">
                Sans carte bancaire · Vos préférences sont conservées
              </p>
            </div>
          )}

          {/* ── Fondateur : top tier, seulement les packs ── */}
          {isTopTier && (
            <div className="mt-4 text-center">
              <p className="text-white/40 text-xs mb-3">Vous êtes au sommet. Ajoutez des crédits supplémentaires :</p>
              <div className="grid grid-cols-2 gap-2">
                {(upgradeOptions?.creditPacks || []).map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => handleBuyPack(pack.id)}
                    className="p-3 rounded-xl border border-white/10 bg-white/3 hover:bg-white/5 transition-all text-center"
                  >
                    <p className="text-white font-bold">{pack.credits}</p>
                    <p className="text-white/40 text-[10px]">crédits</p>
                    <p className="text-secondary font-semibold text-sm">{pack.priceEur?.toFixed(2).replace('.', ',')} €</p>
                    {pack.bonusLabel && <p className="text-green-400 text-[10px] mt-1">{pack.bonusLabel}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getFingerprint(): Promise<string> {
  // Simple fingerprint basé sur des signaux browser
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('baymora', 10, 10);
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    canvas.toDataURL(),
  ].join('::');

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
}

async function handleBuyPack(packId: string) {
  try {
    const response = await fetch('/api/stripe/buy-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId }),
    });
    const data = await response.json();
    if (data.url) window.location.href = data.url;
  } catch {
    console.error('[CreditGate] Erreur achat pack');
  }
}
