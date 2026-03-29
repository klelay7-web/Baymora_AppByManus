import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, X, MessageSquare, User, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConciergeMessage {
  id: string;
  fromAdmin: boolean;
  content: string;
  createdAt: string;
}

interface ConciergeRequest {
  id: string;
  title: string;
  destination: string | null;
  dates: string | null;
  travelers: number | null;
  budget: string | null;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'normal' | 'high' | 'urgent';
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ConciergeMessage[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:     { label: 'En attente',   color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/25',   icon: <Clock className="h-3.5 w-3.5" /> },
  in_progress: { label: 'En cours',     color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/25',       icon: <AlertCircle className="h-3.5 w-3.5" /> },
  completed:   { label: 'Traité',       color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  cancelled:   { label: 'Annulé',       color: 'text-white/30',    bg: 'bg-white/8 border-white/15',             icon: <XCircle className="h-3.5 w-3.5" /> },
};

const BUDGET_OPTIONS = [
  { value: '< 5 000 €',          label: '< 5 000 €' },
  { value: '5 000 – 15 000 €',   label: '5 000 – 15 000 €' },
  { value: '15 000 – 50 000 €',  label: '15 000 – 50 000 €' },
  { value: '50 000 – 150 000 €', label: '50 000 – 150 000 €' },
  { value: 'Sans limite',        label: 'Sans limite' },
];

const REQUEST_TYPES = [
  { emoji: '✈️', label: 'Voyage sur mesure',     msg: 'Je souhaite organiser un voyage sur mesure' },
  { emoji: '🏨', label: 'Réservation hôtel',     msg: 'Je cherche un hôtel de luxe' },
  { emoji: '🎂', label: 'Occasion spéciale',     msg: 'Je prépare une occasion spéciale' },
  { emoji: '🚁', label: 'Transport privé',       msg: 'Je recherche un transport privé (jet, yacht, hélicoptère)' },
  { emoji: '🍽️', label: 'Table gastronomique',  msg: 'Je veux réserver une table dans un grand restaurant' },
  { emoji: '💆', label: 'Séjour bien-être',      msg: 'Je cherche un séjour spa / bien-être' },
];

function authHeaders() {
  const token = localStorage.getItem('baymora_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function timeAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (d < 1) return "À l'instant";
  if (d < 60) return `Il y a ${d} min`;
  const h = Math.floor(d / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

// ─── Thread détail ────────────────────────────────────────────────────────────

function RequestThread({ request, onClose, onReply }: {
  request: ConciergeRequest;
  onClose: () => void;
  onReply: (id: string, content: string) => Promise<void>;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(request.id, replyText.trim());
    setReplyText('');
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] bg-slate-900 border border-white/10 sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-white font-bold text-base leading-tight">{request.title}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              {request.destination && <span className="text-white/40 text-xs">📍 {request.destination}</span>}
              {request.dates && <span className="text-white/40 text-xs">📅 {request.dates}</span>}
              {request.assignedTo && <span className="text-white/30 text-xs">👤 {request.assignedTo}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Message initial */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/15 border border-secondary/25 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-secondary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/60 text-xs font-medium">Vous</span>
                <span className="text-white/25 text-xs">{timeAgo(request.createdAt)}</span>
              </div>
              <div className="bg-secondary/8 border border-secondary/15 rounded-xl rounded-tl-none px-4 py-3 text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {request.message}
              </div>
              {(request.destination || request.dates || request.travelers || request.budget) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {request.destination && <span className="bg-white/5 border border-white/8 rounded-full px-2.5 py-1 text-white/40 text-xs">📍 {request.destination}</span>}
                  {request.dates && <span className="bg-white/5 border border-white/8 rounded-full px-2.5 py-1 text-white/40 text-xs">📅 {request.dates}</span>}
                  {request.travelers && <span className="bg-white/5 border border-white/8 rounded-full px-2.5 py-1 text-white/40 text-xs">👥 {request.travelers} pers.</span>}
                  {request.budget && <span className="bg-white/5 border border-white/8 rounded-full px-2.5 py-1 text-white/40 text-xs">💰 {request.budget}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Messages du fil */}
          {request.messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.fromAdmin ? '' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.fromAdmin ? 'bg-white/8 border border-white/15' : 'bg-secondary/15 border border-secondary/25'}`}>
                {msg.fromAdmin
                  ? <Crown className="h-4 w-4 text-white/60" />
                  : <User className="h-4 w-4 text-secondary" />
                }
              </div>
              <div className={`flex-1 ${msg.fromAdmin ? '' : 'flex flex-col items-end'}`}>
                <div className={`flex items-center gap-2 mb-1 ${msg.fromAdmin ? '' : 'flex-row-reverse'}`}>
                  <span className="text-white/60 text-xs font-medium">{msg.fromAdmin ? 'Équipe Baymora' : 'Vous'}</span>
                  <span className="text-white/25 text-xs">{timeAgo(msg.createdAt)}</span>
                </div>
                <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap max-w-lg ${
                  msg.fromAdmin
                    ? 'bg-white/6 border border-white/10 text-white/85 rounded-tl-none'
                    : 'bg-secondary/8 border border-secondary/15 text-white/80 rounded-tr-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {request.status === 'completed' && (
            <div className="text-center py-4 text-emerald-400/60 text-sm">
              ✓ Demande traitée
            </div>
          )}
        </div>

        {/* Reply box */}
        {request.status !== 'completed' && request.status !== 'cancelled' && (
          <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ajouter un message à votre demande..."
                rows={2}
                className="flex-1 bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none focus:border-secondary/40"
              />
              <button
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
                className="self-end w-10 h-10 bg-secondary hover:bg-secondary/90 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
              >
                <Send className="h-4 w-4 text-black" />
              </button>
            </div>
            <p className="text-white/20 text-xs mt-1.5">Entrée pour envoyer · Shift+Entrée pour sauter une ligne</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Formulaire nouvelle demande ──────────────────────────────────────────────

function NewRequestForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    destination: '',
    dates: '',
    travelers: '',
    budget: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectType = (msg: string, label: string) => {
    setSelectedType(label);
    setForm(f => ({ ...f, title: label, message: msg + (f.message ? '\n' + f.message : '') }));
  };

  const handleSubmit = async () => {
    if (!form.message.trim()) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="bg-white/4 border border-white/10 rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base">Nouvelle demande</h2>
        <button onClick={onCancel} className="text-white/30 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Type de demande */}
      <div>
        <p className="text-white/40 text-xs mb-2">Type de demande</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REQUEST_TYPES.map(t => (
            <button
              key={t.label}
              onClick={() => selectType(t.msg, t.label)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-all ${
                selectedType === t.label
                  ? 'border-secondary/50 bg-secondary/10 text-secondary'
                  : 'border-white/10 bg-white/4 text-white/60 hover:border-white/25 hover:text-white'
              }`}
            >
              <span className="text-base">{t.emoji}</span>
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs">Titre / objet</label>
          <Input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="ex: Voyage à Tokyo pour 2" className="bg-white/6 border-white/10 text-white placeholder:text-white/20 text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs">Destination</label>
          <Input value={form.destination} onChange={e => set('destination', e.target.value)}
            placeholder="ex: Kyoto, Japon" className="bg-white/6 border-white/10 text-white placeholder:text-white/20 text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs">Dates souhaitées</label>
          <Input value={form.dates} onChange={e => set('dates', e.target.value)}
            placeholder="ex: 12 – 18 avril 2026" className="bg-white/6 border-white/10 text-white placeholder:text-white/20 text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs">Nombre de voyageurs</label>
          <Input type="number" min="1" value={form.travelers} onChange={e => set('travelers', e.target.value)}
            placeholder="ex: 2" className="bg-white/6 border-white/10 text-white placeholder:text-white/20 text-sm h-9" />
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-1.5">
        <label className="text-white/40 text-xs">Budget approximatif</label>
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map(b => (
            <button key={b.value} onClick={() => set('budget', form.budget === b.value ? '' : b.value)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                form.budget === b.value
                  ? 'border-secondary/50 bg-secondary/10 text-secondary'
                  : 'border-white/10 bg-white/4 text-white/50 hover:border-white/25 hover:text-white'
              }`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="text-white/40 text-xs">Votre demande <span className="text-red-400/60">*</span></label>
        <textarea
          value={form.message}
          onChange={e => set('message', e.target.value)}
          placeholder="Décrivez votre demande en détail : destination, ambiance souhaitée, occasions spéciales, contraintes particulières..."
          rows={5}
          className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-secondary/40"
        />
        <p className="text-white/20 text-xs">{form.message.length} caractères · Minimum 10</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || form.message.trim().length < 10}
        className="w-full bg-secondary hover:bg-secondary/90 text-black font-semibold py-5"
      >
        {submitting ? 'Envoi...' : '→ Envoyer ma demande'}
      </Button>
      <p className="text-white/20 text-xs text-center">L'équipe Baymora vous répondra dans les 24h.</p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ConciergePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ConciergeRequest | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/auth?returnTo=/conciergerie');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/concierge', { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setRequests(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSubmit = async (form: any) => {
    const res = await fetch('/api/concierge', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setRequests(prev => [data.request, ...prev]);
      setShowForm(false);
      setSuccessMsg('✓ Demande envoyée ! L\'équipe Baymora vous répond sous 24h.');
      setTimeout(() => setSuccessMsg(''), 6000);
    }
  };

  const handleReply = async (id: string, content: string) => {
    const res = await fetch(`/api/concierge/${id}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const data = await res.json();
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, messages: [...r.messages, data.message] } : r
      ));
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, messages: [...prev.messages, data.message] } : prev);
      }
    }
  };

  const openRequest = (r: ConciergeRequest) => setSelectedRequest(r);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const pending = requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Conciergerie</p>
            <p className="text-white/30 text-xs mt-0.5">
              {pending > 0 ? `${pending} demande${pending > 1 ? 's' : ''} en cours` : 'Votre équipe dédiée'}
            </p>
          </div>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}
            className="bg-secondary hover:bg-secondary/90 text-black text-xs gap-1.5 h-8 font-semibold">
            + Nouvelle demande
          </Button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Message succès */}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-4 py-3 text-emerald-400 text-sm">
            {successMsg}
          </div>
        )}

        {/* Intro (si aucune demande) */}
        {!loading && requests.length === 0 && !showForm && (
          <div className="bg-gradient-to-br from-secondary/8 to-transparent border border-secondary/20 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto">
              <Crown className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Votre conciergerie privée</h2>
              <p className="text-white/40 text-sm mt-2 leading-relaxed">
                Soumettez n'importe quelle demande — voyage sur mesure, réservation exclusive, occasion spéciale — et notre équipe s'en occupe personnellement.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { emoji: '⚡', label: 'Réponse en 24h' },
                { emoji: '🔒', label: '100% confidentiel' },
                { emoji: '🌍', label: 'Monde entier' },
              ].map(f => (
                <div key={f.label} className="bg-white/4 border border-white/8 rounded-xl py-3">
                  <p className="text-xl">{f.emoji}</p>
                  <p className="text-white/50 text-xs mt-1">{f.label}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setShowForm(true)}
              className="w-full bg-secondary hover:bg-secondary/90 text-black font-semibold py-5">
              Faire une demande →
            </Button>
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <NewRequestForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        )}

        {/* Liste des demandes */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="bg-white/4 border border-white/8 rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : requests.length > 0 && (
          <div className="space-y-3">
            {!showForm && (
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                Mes demandes ({requests.length})
              </h2>
            )}
            {requests.map(r => {
              const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
              const unreadAdmin = r.messages.filter(m => m.fromAdmin).length;
              return (
                <button
                  key={r.id}
                  onClick={() => openRequest(r)}
                  className="w-full text-left bg-white/4 border border-white/10 rounded-2xl p-4 hover:bg-white/6 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm group-hover:text-secondary transition-colors truncate">
                          {r.title}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-1 line-clamp-2">{r.message}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {r.destination && <span className="text-white/30 text-xs">📍 {r.destination}</span>}
                        {r.dates && <span className="text-white/30 text-xs">📅 {r.dates}</span>}
                        <span className="text-white/20 text-xs">{timeAgo(r.updatedAt)}</span>
                        {unreadAdmin > 0 && (
                          <span className="flex items-center gap-1 text-secondary text-xs font-medium">
                            <MessageSquare className="h-3 w-3" /> {unreadAdmin} réponse{unreadAdmin > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-secondary/60 flex-shrink-0 transition-colors mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal thread */}
      {selectedRequest && (
        <RequestThread
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onReply={handleReply}
        />
      )}
    </div>
  );
}
