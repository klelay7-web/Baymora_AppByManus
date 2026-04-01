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

        {/* ── Réservations reçues ── */}
        <ReservationsSection token={token!} partnerId={partner.id} />

        {/* ── Notes & factures ── */}
        <NotesSection token={token!} partnerId={partner.id} />

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

// ═══════════════════════════════════════════════════════════════════════════════
// RESERVATIONS — Réservations reçues via Baymora
// ═══════════════════════════════════════════════════════════════════════════════

function ReservationsSection({ token, partnerId }: { token: string; partnerId: string }) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/partners/reservations?token=${token}`)
      .then(res => res.ok ? res.json() : Promise.resolve({ reservations: [] }))
      .then(data => setReservations(data.reservations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return null;

  return (
    <section>
      <h2 className="text-white/70 font-semibold text-sm mb-3 flex items-center gap-2">
        📋 Réservations reçues
        {reservations.filter(r => r.status === 'pending').length > 0 && (
          <span className="bg-secondary text-black text-[10px] font-bold rounded-full px-2 py-0.5">
            {reservations.filter(r => r.status === 'pending').length} nouvelles
          </span>
        )}
      </h2>
      {reservations.length === 0 ? (
        <div className="bg-white/4 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-white/30 text-sm">Aucune réservation pour le moment</p>
          <p className="text-white/20 text-xs mt-1">Les réservations Baymora apparaîtront ici avec les détails du client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map((r: any) => (
            <div key={r.id} className={`bg-white/4 border rounded-xl p-4 ${r.status === 'pending' ? 'border-secondary/30' : 'border-white/10'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{r.clientName || 'Client Baymora'}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {r.dates && ` · ${r.dates}`}
                    {r.guests && ` · ${r.guests} pers.`}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  r.status === 'pending' ? 'bg-secondary/20 text-secondary' :
                  r.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                  r.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {r.status === 'pending' ? 'Nouvelle' : r.status === 'confirmed' ? 'Confirmée' : r.status === 'completed' ? 'Terminée' : 'Annulée'}
                </span>
              </div>
              {/* Détails client / préférences */}
              {r.clientPreferences && (
                <div className="mt-2 bg-white/3 rounded-lg p-2.5">
                  <p className="text-white/50 text-xs font-medium mb-1">Préférences client :</p>
                  <p className="text-white/40 text-xs">{r.clientPreferences}</p>
                </div>
              )}
              {r.specialRequests && (
                <div className="mt-1.5 bg-amber-500/5 rounded-lg p-2.5">
                  <p className="text-amber-400/70 text-xs font-medium mb-0.5">Exigences spéciales :</p>
                  <p className="text-white/40 text-xs">{r.specialRequests}</p>
                </div>
              )}
              {/* Commission */}
              {r.commission && (
                <p className="text-emerald-400 text-xs font-semibold mt-2">Commission : +{r.commission.toFixed(2)}€</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTES & FACTURES — Le partenaire peut laisser des notes et uploader des factures
// ═══════════════════════════════════════════════════════════════════════════════

function NotesSection({ token, partnerId }: { token: string; partnerId: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [sending, setSending] = useState(false);
  const [invoiceUploading, setInvoiceUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/partners/notes?token=${token}`)
      .then(res => res.ok ? res.json() : Promise.resolve({ notes: [] }))
      .then(data => setNotes(data.notes || []))
      .catch(() => {});
  }, [token]);

  const handleSendNote = async () => {
    if (!newNote.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/partners/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, content: newNote.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev => [data.note, ...prev]);
        setNewNote('');
      }
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvoiceUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Upload vers Supabase via l'API
      const uploadRes = await fetch('/api/upload/photo?bucket=partner-photos', {
        method: 'POST',
        headers: { 'x-admin-secret': token },
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        // Sauvegarder comme note avec le lien de la facture
        const res = await fetch('/api/partners/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, content: `📄 Facture uploadée: ${file.name}`, attachmentUrl: uploadData.url, type: 'invoice' }),
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(prev => [data.note, ...prev]);
        }
      }
    } catch (e) { console.error(e); }
    setInvoiceUploading(false);
    e.target.value = '';
  };

  return (
    <section>
      <h2 className="text-white/70 font-semibold text-sm mb-3">💬 Notes & Factures</h2>
      <div className="bg-white/4 border border-white/10 rounded-xl p-4 space-y-3">
        {/* Formulaire nouvelle note */}
        <div className="flex gap-2">
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendNote()}
            placeholder="Laisser une note à l'équipe Baymora..."
            className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-secondary/40"
          />
          <label className={`h-9 px-3 rounded-lg border border-white/10 bg-white/5 flex items-center gap-1 text-white/40 text-xs cursor-pointer hover:bg-white/10 ${invoiceUploading ? 'opacity-50' : ''}`}>
            📄 {invoiceUploading ? '...' : 'Facture'}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleInvoiceUpload} disabled={invoiceUploading} />
          </label>
          <button
            onClick={handleSendNote}
            disabled={sending || !newNote.trim()}
            className="h-9 px-4 bg-secondary hover:bg-secondary/90 text-black text-sm font-medium rounded-lg disabled:opacity-40"
          >
            {sending ? '...' : 'Envoyer'}
          </button>
        </div>

        {/* Liste des notes */}
        {notes.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {notes.map((n: any, i: number) => (
              <div key={n.id || i} className="flex gap-2 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${n.fromPartner ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-white/40'}`}>
                  {n.fromPartner ? 'P' : 'B'}
                </div>
                <div>
                  <p className="text-white/70 text-xs">{n.content}</p>
                  {n.attachmentUrl && (
                    <a href={n.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-secondary/60 text-xs hover:text-secondary mt-0.5 block">
                      📎 Voir la pièce jointe
                    </a>
                  )}
                  <p className="text-white/20 text-[10px] mt-0.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
