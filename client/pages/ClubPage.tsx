import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ExternalLink, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClubTier {
  name: string;
  min: number;
  emoji: string;
  color: string;
}

interface ClubMe {
  points: number;
  clubVerified: boolean;
  invitedById: string | null;
  tier: ClubTier;
  nextTier: ClubTier | null;
  progressPercent: number;
  inviteCode: { code: string; usedCount: number; isActive: boolean } | null;
}

interface PointTx {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

interface LeaderEntry {
  rank: number;
  displayName: string;
  points: number;
  clubVerified: boolean;
  tier: ClubTier;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_BG: Record<string, string> = {
  Crystal:  'from-sky-500/15 to-sky-500/5 border-sky-500/25',
  Gold:     'from-amber-500/15 to-amber-500/5 border-amber-500/25',
  Platinum: 'from-violet-500/15 to-violet-500/5 border-violet-500/25',
  Diamond:  'from-white/10 to-white/3 border-white/20',
};
const TIER_TEXT: Record<string, string> = {
  Crystal:  'text-sky-400',
  Gold:     'text-amber-400',
  Platinum: 'text-violet-400',
  Diamond:  'text-white',
};
const TIER_BAR: Record<string, string> = {
  Crystal:  'bg-sky-400',
  Gold:     'bg-amber-400',
  Platinum: 'bg-violet-400',
  Diamond:  'bg-white',
};

function tx_icon(type: string): string {
  switch (type) {
    case 'registration': return '🎉';
    case 'invitation_sent': return '👥';
    case 'invitation_received': return '🤝';
    case 'profile_complete': return '✅';
    case 'message_milestone': return '💬';
    case 'partner_booking': return '🏨';
    case 'admin_grant': return '⭐';
    default: return '💎';
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ClubPage() {
  const { user, isAuthenticated, authHeader } = useAuth();
  const [clubMe, setClubMe] = useState<ClubMe | null>(null);
  const [points, setPoints] = useState<PointTx[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const baseUrl = window.location.origin;

  const fetchClub = async () => {
    try {
      const [meRes, ptsRes, lbRes] = await Promise.all([
        fetch('/api/club/me', { headers: authHeader }),
        fetch('/api/club/points', { headers: authHeader }),
        fetch('/api/club/leaderboard'),
      ]);
      if (meRes.ok) setClubMe(await meRes.json());
      if (ptsRes.ok) setPoints((await ptsRes.json()).transactions ?? []);
      if (lbRes.ok) setLeaderboard((await lbRes.json()).leaderboard ?? []);
    } catch {}
    setLoading(false);
  };

  const ensureInviteCode = async () => {
    if (clubMe?.inviteCode) return;
    const res = await fetch('/api/club/invite', { headers: authHeader });
    if (res.ok) {
      const data = await res.json();
      setClubMe(prev => prev ? { ...prev, inviteCode: data } : prev);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchClub();
    else setLoading(false);
  }, [isAuthenticated]);

  const copyInviteLink = async () => {
    if (!clubMe?.inviteCode) {
      await ensureInviteCode();
      return;
    }
    const link = `${baseUrl}/join/${clubMe.inviteCode.code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!user?.email) {
      setVerifyMsg('Un email est requis. Complétez votre profil d\'abord.');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/club/verify', { method: 'POST', headers: authHeader });
      const data = await res.json();
      setVerifyMsg(data.message || 'Compte vérifié !');
      if (res.ok) fetchClub();
    } catch {
      setVerifyMsg('Erreur. Réessayez.');
    }
    setVerifying(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-center p-6">
        <div>
          <div className="text-4xl mb-4">💎</div>
          <h1 className="text-2xl font-bold text-white mb-3">Baymora Club</h1>
          <p className="text-white/45 mb-6">Connectez-vous pour accéder à votre espace Club</p>
          <Link to="/auth">
            <Button className="bg-secondary hover:bg-secondary/90 text-black font-semibold">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const tier = clubMe?.tier;
  const nextTier = clubMe?.nextTier;
  const inviteLink = clubMe?.inviteCode ? `${baseUrl}/join/${clubMe.inviteCode.code}` : null;

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#080c14]/90 backdrop-blur-md border-b border-white/8 px-5 py-3 flex items-center gap-4">
        <Link to="/dashboard" className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="text-xs text-secondary/80 font-semibold uppercase tracking-widest">Membres</div>
          <h1 className="text-white font-bold">Baymora Club</h1>
        </div>
        {clubMe?.clubVerified && (
          <div className="ml-auto flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full">
            <Shield className="h-3 w-3" />
            Vérifié
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* Hero points + rang */}
        {tier && (
          <div className={`bg-gradient-to-br ${TIER_BG[tier.name] || TIER_BG.Crystal} border rounded-3xl p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Vos Crystals</p>
                <p className={`text-5xl font-bold ${TIER_TEXT[tier.name]}`}>
                  {clubMe?.points.toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl mb-1`}>{tier.emoji}</div>
                <p className={`font-bold text-sm ${TIER_TEXT[tier.name]}`}>{tier.name}</p>
              </div>
            </div>

            {/* Progress bar */}
            {nextTier && (
              <div>
                <div className="flex justify-between text-xs text-white/30 mb-1.5">
                  <span>{tier.name}</span>
                  <span>{nextTier.emoji} {nextTier.name} à {nextTier.min.toLocaleString('fr-FR')} pts</span>
                </div>
                <div className="bg-white/8 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${TIER_BAR[tier.name]}`}
                    style={{ width: `${clubMe?.progressPercent ?? 0}%` }}
                  />
                </div>
                <p className="text-white/25 text-xs mt-1">
                  {(nextTier.min - (clubMe?.points ?? 0)).toLocaleString('fr-FR')} pts pour passer {nextTier.emoji} {nextTier.name}
                </p>
              </div>
            )}
            {!nextTier && (
              <p className="text-white/40 text-xs mt-2">Niveau maximum atteint 👑</p>
            )}
          </div>
        )}

        {/* Invitation */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">👥</span>
            <h2 className="text-white font-semibold">Votre lien d'invitation</h2>
            {clubMe?.inviteCode && (
              <span className="ml-auto text-white/30 text-xs">
                {clubMe.inviteCode.usedCount} ami{clubMe.inviteCode.usedCount !== 1 ? 's' : ''} invité{clubMe.inviteCode.usedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm text-white/60 truncate">
              {inviteLink ?? `${baseUrl}/join/${clubMe?.inviteCode?.code ?? '...'}`}
            </div>
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-secondary/25 transition-all flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/4 rounded-xl p-3 text-center">
              <p className="text-secondary font-bold text-lg">+100</p>
              <p className="text-white/40 text-xs">pts pour votre filleul</p>
            </div>
            <div className="bg-white/4 rounded-xl p-3 text-center">
              <p className="text-secondary font-bold text-lg">+150</p>
              <p className="text-white/40 text-xs">pts pour vous</p>
            </div>
          </div>
        </div>

        {/* Historique points */}
        <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/6">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <span>💎</span> Historique des points
            </h2>
          </div>
          {points.length === 0 ? (
            <div className="px-5 py-6 text-center text-white/30 text-sm">
              Aucune transaction pour l'instant
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {points.map(tx => (
                <div key={tx.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-xl">{tx_icon(tx.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm leading-snug">{tx.description}</p>
                    <p className="text-white/25 text-xs">{relativeTime(tx.createdAt)}</p>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${tx.points > 0 ? 'text-secondary' : 'text-red-400'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" />
            <h2 className="text-white font-semibold">Top membres</h2>
          </div>
          <div className="divide-y divide-white/5">
            {leaderboard.map(entry => (
              <div key={entry.rank} className="px-5 py-3 flex items-center gap-3">
                <span className={`w-6 text-center font-bold text-sm ${entry.rank <= 3 ? 'text-secondary' : 'text-white/25'}`}>
                  #{entry.rank}
                </span>
                <span className="text-xl">{entry.tier.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/80 text-sm font-medium">{entry.displayName}</span>
                    {entry.clubVerified && <Shield className="h-3 w-3 text-emerald-400" />}
                  </div>
                  <p className="text-white/30 text-xs">{entry.tier.name}</p>
                </div>
                <span className="text-secondary text-sm font-semibold flex-shrink-0">
                  {entry.points.toLocaleString('fr-FR')} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vérification */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Shield className={`h-5 w-5 mt-0.5 ${clubMe?.clubVerified ? 'text-emerald-400' : 'text-white/30'}`} />
            <div className="flex-1">
              <h2 className="text-white font-semibold mb-1">
                {clubMe?.clubVerified ? '✓ Membre vérifié' : 'Vérification Club'}
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-3">
                {clubMe?.clubVerified
                  ? 'Votre compte est vérifié. Votre badge est visible sur le leaderboard.'
                  : 'Obtenez le badge de membre vérifié. Votre email doit être renseigné dans votre profil.'}
              </p>
              {!clubMe?.clubVerified && (
                <>
                  <Button
                    onClick={handleVerify}
                    disabled={verifying}
                    size="sm"
                    className="bg-white/8 border border-white/15 text-white/70 hover:bg-white/15 text-xs"
                  >
                    {verifying ? 'Vérification...' : 'Demander la vérification →'}
                  </Button>
                  {verifyMsg && (
                    <p className="text-white/50 text-xs mt-2">{verifyMsg}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Comment gagner des points */}
        <div className="bg-white/3 border border-white/6 rounded-2xl p-5">
          <h2 className="text-white/60 font-semibold text-sm mb-3">Comment gagner des Crystals</h2>
          <div className="space-y-2">
            {[
              { icon: '🎉', label: 'Inscription',               pts: '+50'  },
              { icon: '🤝', label: 'Inviter un ami',            pts: '+150' },
              { icon: '👥', label: 'Être invité par un ami',    pts: '+100' },
              { icon: '✅', label: 'Compléter son profil',      pts: '+50'  },
              { icon: '🏨', label: 'Réserver via un partenaire', pts: '+200' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="text-white/50 text-sm flex-1">{item.label}</span>
                <span className="text-secondary text-xs font-bold">{item.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-8">
          <Link to="/chat" className="text-secondary/50 hover:text-secondary/80 text-sm transition-colors">
            Continuer avec mon concierge →
          </Link>
        </div>
      </div>
    </div>
  );
}
