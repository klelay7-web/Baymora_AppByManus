import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, TrendingUp, Users, Wallet, Calendar, ChevronRight, Star } from 'lucide-react';

// ─── Données placeholder ──────────────────────────────────────────────────────

const MOCK_PARTNER = {
  name: 'Partenaire Demo',
  code: 'BAY-DEMO-2024',
  tier: 'Silver',
  commissionRate: 15,
  joinedAt: '2024-01-15',
  stats: {
    referrals: 12,
    activeClients: 8,
    pendingEarnings: 340,
    totalEarned: 1280,
    thisMonth: 220,
  },
};

const MOCK_COMMISSIONS = [
  { id: '1', client: 'Client #A1B2', plan: 'Essentiel', amount: 43.50, date: '2024-11-28', status: 'payé' },
  { id: '2', client: 'Client #C3D4', plan: 'Élite', amount: 148.50, date: '2024-11-20', status: 'payé' },
  { id: '3', client: 'Client #E5F6', plan: 'Essentiel', amount: 43.50, date: '2024-12-01', status: 'en attente' },
  { id: '4', client: 'Client #G7H8', plan: 'Privé', amount: 448.50, date: '2024-12-05', status: 'en attente' },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PartnerDashboard() {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://baymora.com?ref=${MOCK_PARTNER.code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/">
            <button className="text-white/60 hover:text-white transition-colors p-1">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Espace Partenaire</p>
            <p className="text-white/30 text-xs mt-0.5">Baymora Affiliés</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
          <Star className="h-3 w-3 text-amber-400" />
          <span className="text-amber-300 text-xs font-medium">{MOCK_PARTNER.tier}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Profil partenaire ── */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-white font-bold text-lg">{MOCK_PARTNER.name}</h1>
              <p className="text-white/30 text-xs mt-0.5">
                Partenaire depuis {new Date(MOCK_PARTNER.joinedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-secondary text-lg font-bold">{MOCK_PARTNER.commissionRate}%</p>
              <p className="text-white/30 text-xs">commission</p>
            </div>
          </div>

          {/* Lien de parrainage */}
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-white/40 text-xs mb-2">Votre lien de parrainage</p>
            <div className="flex items-center gap-2">
              <code className="text-secondary text-xs flex-1 truncate font-mono">{referralLink}</code>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-secondary/25 transition-all flex-shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <p className="text-white/20 text-xs mt-1.5">Code partenaire : <span className="text-white/40">{MOCK_PARTNER.code}</span></p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Users className="h-4 w-4" />, label: 'Clients référés', value: MOCK_PARTNER.stats.referrals },
            { icon: <TrendingUp className="h-4 w-4" />, label: 'Clients actifs', value: MOCK_PARTNER.stats.activeClients },
            { icon: <Wallet className="h-4 w-4" />, label: 'En attente (€)', value: `${MOCK_PARTNER.stats.pendingEarnings}€` },
            { icon: <Calendar className="h-4 w-4" />, label: 'Ce mois (€)', value: `${MOCK_PARTNER.stats.thisMonth}€` },
          ].map(s => (
            <div key={s.label} className="bg-white/4 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <div className="text-secondary/60">{s.icon}</div>
              <div>
                <p className="text-white font-bold text-xl leading-none">{s.value}</p>
                <p className="text-white/30 text-xs mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Total gagné ── */}
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm">Total gagné</p>
            <p className="text-white font-bold text-3xl mt-1">{MOCK_PARTNER.stats.totalEarned}€</p>
          </div>
          <button className="bg-secondary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-secondary/90 transition-all">
            Demander un virement
          </button>
        </div>

        {/* ── Historique commissions ── */}
        <section>
          <h2 className="text-white/70 font-semibold text-sm mb-3">Commissions récentes</h2>
          <div className="bg-white/4 border border-white/10 rounded-xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {MOCK_COMMISSIONS.map(c => (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">{c.client}</span>
                      <span className="text-white/25 text-xs">{c.plan}</span>
                    </div>
                    <p className="text-white/25 text-xs mt-0.5">
                      {new Date(c.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">{c.amount}€</p>
                    <span className={`text-xs ${c.status === 'payé' ? 'text-green-400/70' : 'text-amber-400/70'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Plans de commission ── */}
        <section>
          <h2 className="text-white/70 font-semibold text-sm mb-3">Structure des commissions</h2>
          <div className="space-y-2">
            {[
              { plan: 'Essentiel', price: '29€/mois', commission: '15%', earn: '4,35€/mois/client' },
              { plan: 'Élite', price: '99€/mois', commission: '15%', earn: '14,85€/mois/client' },
              { plan: 'Privé', price: '299€/mois', commission: '15%', earn: '44,85€/mois/client' },
            ].map(p => (
              <div key={p.plan} className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-white/70 text-sm font-medium">{p.plan}</span>
                  <span className="text-white/30 text-xs ml-2">{p.price}</span>
                </div>
                <div className="text-right">
                  <p className="text-secondary text-sm font-semibold">{p.earn}</p>
                  <p className="text-white/25 text-xs">{p.commission} commission</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
          <p className="text-white/30 text-sm">Questions sur vos commissions ou votre compte partenaire ?</p>
          <a href="mailto:partenaires@baymora.com" className="text-secondary/70 text-sm hover:text-secondary transition-colors mt-1 block">
            partenaires@baymora.com →
          </a>
        </div>

        <div className="text-center text-white/15 text-xs pb-4">Baymora — Programme d'affiliation</div>
      </div>
    </div>
  );
}
