import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Camera, FileText, Users, Wallet, Plus, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PrestataireData {
  id: string;
  region: string;
  speciality?: string;
  status: string;
  visitsCompleted: number;
  partnersRecruited: number;
  fichesCreated: number;
  totalEarned: number;
  rates: { perVisit: number; perFiche: number; perRecruit: number; commissionOnRecruit: number };
}

interface Visit {
  id: string;
  establishmentName: string;
  establishmentType: string;
  city: string;
  visitDate: string;
  status: string;
  rating?: number;
  recommendation?: string;
  partner?: { name: string; city: string } | null;
}

interface Earnings {
  visits: number;
  fiches: number;
  recruits: number;
  recruitCommissions: number;
  total: number;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function PrestataireDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [presta, setPresta] = useState<PrestataireData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form new visit
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ establishmentName: '', establishmentType: 'hotel', city: '', report: '' });
  const [submitting, setSubmitting] = useState(false);

  const authHeader = () => {
    const token = localStorage.getItem('baymora_token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setLoading(false); return; }

    fetch('/api/prestataires/me', { headers: authHeader() })
      .then(res => {
        if (!res.ok) throw new Error('Non prestataire');
        return res.json();
      })
      .then(data => {
        setPresta(data.prestataire);
        setVisits(data.visits || []);
        setEarnings(data.earnings);
      })
      .catch(() => setError('Vous n\'êtes pas enregistré comme prestataire Baymora.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.establishmentName || !formData.city || !formData.report) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/prestataires/visits', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ ...formData, visitDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setVisits(prev => [data.visit, ...prev]);
      setShowForm(false);
      setFormData({ establishmentName: '', establishmentType: 'hotel', city: '', report: '' });
    } catch {
      setError('Erreur lors de la soumission du rapport.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="h-8 w-8 text-secondary animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/50 text-sm">Connectez-vous pour accéder à votre espace prestataire.</p>
          <Link to="/auth" className="text-secondary text-sm mt-2 block">Se connecter →</Link>
        </div>
      </div>
    );
  }

  if (error && !presta) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 text-sm">{error}</p>
          <Link to="/dashboard" className="text-secondary text-sm mt-4 block">Retour au dashboard →</Link>
        </div>
      </div>
    );
  }

  if (!presta) return null;

  const STATUS_BADGE: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-white/10 text-white/40', label: 'Brouillon' },
    submitted: { color: 'bg-blue-500/10 text-blue-400', label: 'Soumis' },
    reviewed: { color: 'bg-amber-500/10 text-amber-400', label: 'En revue' },
    published: { color: 'bg-green-500/10 text-green-400', label: 'Publié' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/dashboard"><button className="text-white/60 hover:text-white p-1"><ArrowLeft className="h-4 w-4" /></button></Link>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Espace Prestataire</p>
            <p className="text-white/30 text-xs mt-0.5">{presta.region} · {user?.prenom || user?.pseudo}</p>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${presta.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {presta.status === 'active' ? 'Actif' : presta.status}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <MapPin className="h-4 w-4" />, value: presta.visitsCompleted, label: 'Visites' },
            { icon: <FileText className="h-4 w-4" />, value: presta.fichesCreated, label: 'Fiches' },
            { icon: <Users className="h-4 w-4" />, value: presta.partnersRecruited, label: 'Recrutés' },
          ].map(s => (
            <div key={s.label} className="bg-white/4 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-secondary/60 flex justify-center mb-1">{s.icon}</div>
              <p className="text-white font-bold text-2xl">{s.value}</p>
              <p className="text-white/30 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Gains ── */}
        {earnings && (
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-sm">Total gagné</p>
              <Wallet className="h-4 w-4 text-secondary/50" />
            </div>
            <p className="text-white font-bold text-3xl">{earnings.total.toFixed(0)}€</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="text-white/40">Visites : <span className="text-white/60">{earnings.visits.toFixed(0)}€</span></div>
              <div className="text-white/40">Fiches : <span className="text-white/60">{earnings.fiches.toFixed(0)}€</span></div>
              <div className="text-white/40">Recrutement : <span className="text-white/60">{earnings.recruits.toFixed(0)}€</span></div>
              <div className="text-white/40">Commissions : <span className="text-secondary">{earnings.recruitCommissions.toFixed(0)}€</span></div>
            </div>
            <p className="text-white/20 text-[10px] mt-2">Tarifs : {presta.rates.perVisit}€/visite · {presta.rates.perFiche}€/fiche · {presta.rates.perRecruit}€/recrutement · {presta.rates.commissionOnRecruit}% com. partenaires</p>
          </div>
        )}

        {/* ── Nouveau rapport ── */}
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-secondary text-sm font-medium hover:bg-secondary/15 transition-all">
          <Plus className="h-4 w-4" /> Nouveau rapport de visite
        </button>

        {showForm && (
          <form onSubmit={handleSubmitVisit} className="bg-white/4 border border-white/10 rounded-2xl p-5 space-y-3">
            <input value={formData.establishmentName} onChange={e => setFormData(f => ({ ...f, establishmentName: e.target.value }))} placeholder="Nom de l'établissement *" className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-secondary/50" />
            <div className="grid grid-cols-2 gap-3">
              <select value={formData.establishmentType} onChange={e => setFormData(f => ({ ...f, establishmentType: e.target.value }))} className="h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white/70 focus:outline-none focus:border-secondary/50">
                <option value="hotel">Hôtel</option>
                <option value="restaurant">Restaurant</option>
                <option value="spa">Spa</option>
                <option value="activity">Activité</option>
                <option value="villa">Villa</option>
              </select>
              <input value={formData.city} onChange={e => setFormData(f => ({ ...f, city: e.target.value }))} placeholder="Ville *" className="h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-secondary/50" />
            </div>
            <textarea value={formData.report} onChange={e => setFormData(f => ({ ...f, report: e.target.value }))} placeholder="Rapport de visite détaillé *" rows={5} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-secondary/50 resize-none" />
            <button type="submit" disabled={submitting} className="w-full h-10 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Soumettre le rapport
            </button>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </form>
        )}

        {/* ── Visites récentes ── */}
        <section>
          <h2 className="text-white/70 font-semibold text-sm mb-3">Visites récentes</h2>
          {visits.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-6">Aucune visite pour le moment. Commencez par soumettre un rapport.</p>
          ) : (
            <div className="space-y-2">
              {visits.map(visit => {
                const badge = STATUS_BADGE[visit.status] || STATUS_BADGE.draft;
                return (
                  <div key={visit.id} className="bg-white/4 border border-white/10 rounded-xl px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-medium">{visit.establishmentName}</p>
                        <p className="text-white/30 text-xs mt-0.5 flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> {visit.city} · {visit.establishmentType}
                        </p>
                        <p className="text-white/20 text-xs mt-0.5">{new Date(visit.visitDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {visit.rating && <span className="text-secondary text-xs font-bold">{visit.rating}/10</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                      </div>
                    </div>
                    {visit.recommendation && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {visit.recommendation === 'approved' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                        {visit.recommendation === 'needs_work' && <Clock className="h-3 w-3 text-amber-400" />}
                        {visit.recommendation === 'rejected' && <AlertCircle className="h-3 w-3 text-red-400" />}
                        <span className="text-white/40 text-xs">{visit.recommendation === 'approved' ? 'Recommandé' : visit.recommendation === 'needs_work' ? 'À améliorer' : 'Non recommandé'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="text-center text-white/15 text-xs pb-4">Baymora — Équipe terrain</div>
      </div>
    </div>
  );
}
