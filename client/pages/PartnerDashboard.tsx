import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, Check, TrendingUp, Users, Wallet, Calendar, Star, Loader2, Mail, ShieldCheck, BarChart3 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PartnerData {
  id: string;
  name: string;
  type: string;
  city: string;
  affiliateCode: string;
  commissionRate: number;
  verificationLevel: string;
  badgeType: string;
  status: string;
}

interface PartnerOffer {
  id: string;
  type: string;
  title: string;
  description?: string;
  normalPrice?: number;
  baymoraPrice?: number;
  category: string;
  premiumPerks: string[];
  isActive: boolean;
}

interface PartnerStats {
  totalClicks: number;
  conversions: number;
  conversionRate: number;
  totalCommission: number;
  monthlyClicks: number;
}

interface RecentClick {
  id: string;
  offerId?: string;
  converted: boolean;
  commission?: number;
  createdAt: string;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function PartnerDashboard() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [token, setToken] = useState<string | null>(tokenFromUrl || localStorage.getItem('baymora_partner_token'));
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [recentClicks, setRecentClicks] = useState<RecentClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSent, setLoginSent] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  // Sauvegarder le token
  useEffect(() => {
    if (tokenFromUrl) {
      localStorage.setItem('baymora_partner_token', tokenFromUrl);
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Charger les données partenaire
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    fetch(`/api/partners/me?token=${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Token invalide');
        return res.json();
      })
      .then(data => {
        setPartner(data.partner);
        setOffers(data.offers || []);
        setStats(data.stats);
        setRecentClicks(data.recentClicks || []);
      })
      .catch(() => {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('baymora_partner_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Login par magic link
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    setLoginLoading(true);
    try {
      const res = await fetch('/api/partners/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) setLoginSent(true);
    } catch {
      setError('Erreur de connexion. Réessayez.');
    } finally {
      setLoginLoading(false);
    }
  };

  const copyLink = () => {
    if (!partner) return;
    navigator.clipboard.writeText(`https://baymora.com/go/${partner.affiliateCode}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
      </div>
    );
  }

  // ── Login form (pas de token) ──────────────────────────────────────────────
  if (!token || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-secondary">B</span>
            </div>
            <h1 className="text-white font-bold text-xl">Espace Partenaire</h1>
            <p className="text-white/40 text-sm mt-1">Connectez-vous avec votre email partenaire</p>
          </div>

          {loginSent ? (
            <div className="text-center">
              <Mail className="h-12 w-12 text-secondary mx-auto mb-3" />
              <p className="text-white font-semibold">Lien envoyé !</p>
              <p className="text-white/50 text-sm mt-2">Vérifiez votre boîte email et cliquez sur le lien de connexion.</p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-secondary/50"
                autoFocus
              />
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Recevoir un lien de connexion
              </button>
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/devenir-partenaire" className="text-secondary/60 text-xs hover:text-secondary">Devenir partenaire Baymora →</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const referralLink = `https://baymora.com/go/${partner.affiliateCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/"><button className="text-white/60 hover:text-white transition-colors p-1"><ArrowLeft className="h-4 w-4" /></button></Link>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Espace Partenaire</p>
            <p className="text-white/30 text-xs mt-0.5">{partner.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {partner.verificationLevel === 'human_verified' && (
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1">
              <ShieldCheck className="h-3 w-3 text-green-400" />
              <span className="text-green-300 text-[10px] font-medium">Vérifié</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-secondary/10 border border-secondary/20 rounded-full px-2.5 py-1">
            <Star className="h-3 w-3 text-secondary" />
            <span className="text-secondary text-[10px] font-medium">{partner.commissionRate}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Lien affilié ── */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-xs mb-2">Votre lien affilié</p>
          <div className="flex items-center gap-2">
            <code className="text-secondary text-xs flex-1 truncate font-mono">{referralLink}</code>
            <button onClick={copyLink} className="flex items-center gap-1.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-secondary/25 transition-all flex-shrink-0">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="text-white/20 text-xs mt-1.5">Code : <span className="text-white/40 font-mono">{partner.affiliateCode}</span></p>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <BarChart3 className="h-4 w-4" />, label: 'Clics totaux', value: stats.totalClicks },
              { icon: <TrendingUp className="h-4 w-4" />, label: 'Conversions', value: `${stats.conversions} (${stats.conversionRate}%)` },
              { icon: <Wallet className="h-4 w-4" />, label: 'Commissions totales', value: `${stats.totalCommission.toFixed(2)}€` },
              { icon: <Calendar className="h-4 w-4" />, label: 'Clics ce mois', value: stats.monthlyClicks },
            ].map(s => (
              <div key={s.label} className="bg-white/4 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="text-secondary/60">{s.icon}</div>
                <div>
                  <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                  <p className="text-white/30 text-xs mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Offres ── */}
        <section>
          <h2 className="text-white/70 font-semibold text-sm mb-3">Vos offres ({offers.filter(o => o.isActive).length} actives)</h2>
          <div className="space-y-2">
            {offers.map(offer => (
              <div key={offer.id} className={`bg-white/4 border rounded-xl px-4 py-3 ${offer.isActive ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">{offer.title}</p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {offer.category === 'experience' ? 'Expérience Privée' : 'Échappée Baymora'}
                      {offer.baymoraPrice ? ` · ${offer.baymoraPrice}€` : ''}
                    </p>
                    {offer.premiumPerks && offer.premiumPerks.length > 0 && (
                      <p className="text-secondary/60 text-xs mt-1">{offer.premiumPerks.join(' · ')}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${offer.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {offer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
            {offers.length === 0 && (
              <p className="text-white/30 text-xs text-center py-4">Aucune offre. Contactez l'équipe Baymora pour en créer.</p>
            )}
          </div>
        </section>

        {/* ── Clics récents ── */}
        {recentClicks.length > 0 && (
          <section>
            <h2 className="text-white/70 font-semibold text-sm mb-3">Clics récents</h2>
            <div className="bg-white/4 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
              {recentClicks.slice(0, 10).map(click => (
                <div key={click.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-xs">
                      {new Date(click.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {click.converted && click.commission && (
                      <span className="text-green-400 text-xs font-semibold">+{click.commission.toFixed(2)}€</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${click.converted ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                      {click.converted ? 'Converti' : 'Clic'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
          <p className="text-white/30 text-sm">Questions sur votre espace partenaire ?</p>
          <a href="mailto:partenaires@baymora.com" className="text-secondary/70 text-sm hover:text-secondary transition-colors mt-1 block">
            partenaires@baymora.com →
          </a>
        </div>

        <button
          onClick={() => { localStorage.removeItem('baymora_partner_token'); setToken(null); setPartner(null); }}
          className="w-full text-center text-white/20 text-xs hover:text-white/40 py-2"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
