import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Wallet, Plane, Hotel, Utensils, Activity, Mail, Printer, Download, Trash2, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TripSummary {
  id: string;
  title: string;
  destination: string | null;
  dates: string | null;
  duration: string | null;
  travelers: number | null;
  budget: string | null;
  status: 'planning' | 'confirmed' | 'past';
  createdAt: string;
  updatedAt: string;
}

interface TripFull extends TripSummary {
  planData: any;
  sourceConvId: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  planning:  { label: 'En préparation', color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/25'    },
  confirmed: { label: 'Confirmé',       color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25' },
  past:      { label: 'Passé',          color: 'text-white/40',    bg: 'bg-white/8 border-white/15'          },
};

const STATUS_OPTIONS = [
  { value: 'planning',  label: 'En préparation' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'past',      label: 'Passé' },
];

function destinationEmoji(dest?: string | null): string {
  if (!dest) return '✈️';
  const d = dest.toLowerCase();
  if (d.includes('japon') || d.includes('kyoto') || d.includes('tokyo') || d.includes('osaka')) return '🏯';
  if (d.includes('bali') || d.includes('indonés')) return '🌴';
  if (d.includes('paris') || d.includes('france')) return '🗼';
  if (d.includes('dubai') || d.includes('abu dhabi')) return '🏙️';
  if (d.includes('maldives')) return '🏝️';
  if (d.includes('maroc') || d.includes('marrakech')) return '🕌';
  if (d.includes('italie') || d.includes('rome') || d.includes('milan') || d.includes('venise')) return '🏛️';
  if (d.includes('grèce') || d.includes('santorin') || d.includes('mykonos')) return '🏺';
  if (d.includes('new york') || d.includes('usa') || d.includes('états-unis')) return '🗽';
  if (d.includes('thaïlande') || d.includes('bangkok')) return '🛕';
  if (d.includes('mexique') || d.includes('cancun')) return '🌵';
  if (d.includes('maldives') || d.includes('île') || d.includes('îles')) return '🏝️';
  if (d.includes('suisse') || d.includes('alpes')) return '🏔️';
  if (d.includes('safari') || d.includes('kenya') || d.includes('tanzanie')) return '🦁';
  if (d.includes('croisière') || d.includes('méditerranée')) return '🛳️';
  return '✈️';
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem('baymora_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ─── Composant détail voyage (modal) ─────────────────────────────────────────

function TripDetailModal({ trip, onClose, onStatusChange, onDelete }: {
  trip: TripFull;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const plan = trip.planData as any;
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const statusCfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.planning;

  const handleEmailExport = async () => {
    const email = prompt('Votre adresse email pour recevoir le plan :');
    if (!email) return;
    setExporting(true);
    setExportMsg('');
    try {
      const res = await fetch('/api/chat/export-plan', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, plan }),
      });
      setExportMsg(res.ok ? '✓ Email envoyé !' : '✗ Erreur envoi');
    } catch { setExportMsg('✗ Erreur réseau'); }
    setExporting(false);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await fetch(`/api/trips/${trip.id}`, { method: 'DELETE', headers: authHeaders() });
    onDelete(trip.id);
  };

  const SECTION_LABELS: Record<string, { icon: React.ReactNode; label: string }> = {
    flights:     { icon: <Plane className="h-3.5 w-3.5" />,    label: 'Vols' },
    hotels:      { icon: <Hotel className="h-3.5 w-3.5" />,    label: 'Hébergement' },
    restaurants: { icon: <Utensils className="h-3.5 w-3.5" />, label: 'Restaurants' },
    activities:  { icon: <Activity className="h-3.5 w-3.5" />, label: 'Activités' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] bg-slate-900 border border-white/10 sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">{destinationEmoji(trip.destination)}</span>
              <h2 className="text-white font-bold text-lg leading-tight truncate">{trip.title}</h2>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {trip.dates && <span className="text-white/40 text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> {trip.dates}</span>}
              {trip.duration && <span className="text-white/40 text-xs">{trip.duration}</span>}
              {trip.travelers && <span className="text-white/40 text-xs flex items-center gap-1"><Users className="h-3 w-3" /> {trip.travelers} voyageur{trip.travelers > 1 ? 's' : ''}</span>}
              {trip.budget && <span className="text-white/40 text-xs flex items-center gap-1"><Wallet className="h-3 w-3" /> {trip.budget}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status + actions */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-white/8 flex-shrink-0 flex-wrap">
          <select
            value={trip.status}
            onChange={e => onStatusChange(trip.id, e.target.value)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium bg-transparent cursor-pointer ${statusCfg.bg} ${statusCfg.color}`}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>
            ))}
          </select>
          <span className="text-white/20 text-xs">
            Sauvegardé le {new Date(trip.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Plan content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Sections du plan */}
          {(['flights', 'hotels', 'restaurants', 'activities'] as const).map(section => {
            const items: any[] = plan[section];
            if (!items?.length) return null;
            const cfg = SECTION_LABELS[section];
            return (
              <div key={section}>
                <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  {cfg.icon} {cfg.label}
                </h3>
                <div className="space-y-2">
                  {items.map((item: any, i: number) => (
                    <div key={i} className={`bg-white/4 border rounded-xl px-4 py-3 ${item.status === 'selected' ? 'border-secondary/30' : 'border-white/8'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium leading-snug">
                            {item.status === 'selected' && <span className="text-secondary mr-1">✓</span>}
                            {section === 'flights' ? `${item.from || ''} → ${item.to || ''}` : item.name}
                          </p>
                          {section === 'flights' && item.airline && (
                            <p className="text-white/40 text-xs mt-0.5">{item.airline}{item.flightNumber ? ` · ${item.flightNumber}` : ''}</p>
                          )}
                          {section !== 'flights' && item.note && (
                            <p className="text-white/40 text-xs mt-0.5">{item.note}</p>
                          )}
                          {item.stars && (
                            <p className="text-amber-400/60 text-xs">{'⭐'.repeat(item.stars)}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {item.price && <p className="text-secondary text-sm font-semibold">{item.price}</p>}
                          {section === 'flights' && (item.departureTime || item.arrivalTime) && (
                            <p className="text-white/40 text-xs">{item.departureTime}{item.arrivalTime ? ` → ${item.arrivalTime}` : ''}</p>
                          )}
                          {item.bookingUrl && (
                            <a href={item.bookingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-secondary/60 text-xs hover:text-secondary transition-colors">
                              Réserver →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Notes */}
          {plan.notes?.length > 0 && (
            <div>
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">📋 Notes</h3>
              <div className="space-y-1">
                {plan.notes.map((note: string, i: number) => (
                  <p key={i} className="text-white/60 text-sm">• {note}</p>
                ))}
              </div>
            </div>
          )}

          {/* Transport logistique */}
          {plan.transport && (
            <div>
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">🚗 Logistique transport</h3>
              <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-white/60 text-sm space-y-1">
                {plan.transport.toAirport && <p>Aller aéroport : {plan.transport.toAirport.mode} {plan.transport.toAirport.departureTime ? `· Départ ${plan.transport.toAirport.departureTime}` : ''}</p>}
                {plan.transport.onSite && <p>Sur place : {plan.transport.onSite}</p>}
                {plan.transport.return && <p>Retour : {plan.transport.return.mode}</p>}
              </div>
            </div>
          )}

          {/* Destination map */}
          {plan.destination && (
            <div>
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">🗺️ Destination</h3>
              <div className="rounded-xl overflow-hidden border border-white/8 h-48">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(plan.destination)}&output=embed&z=10`}
                  className="w-full h-full"
                  style={{ filter: 'invert(90%) hue-rotate(180deg)' }}
                  loading="lazy"
                  title={`Carte ${plan.destination}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleEmailExport} disabled={exporting}
              className="flex items-center gap-1.5 px-3 h-8 bg-white/5 border border-white/12 text-white/50 hover:text-secondary text-xs rounded-lg transition-all disabled:opacity-50">
              <Mail className="h-3 w-3" /> Envoyer par email
            </button>
            {trip.sourceConvId && (
              <Link to={`/chat?conv=${trip.sourceConvId}`}
                className="flex items-center gap-1.5 px-3 h-8 bg-white/5 border border-white/12 text-white/50 hover:text-white text-xs rounded-lg transition-all">
                Reprendre la conversation →
              </Link>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`ml-auto flex items-center gap-1.5 px-3 h-8 border text-xs rounded-lg transition-all ${confirmDelete ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/4 border-white/10 text-white/30 hover:text-red-400'}`}
            >
              <Trash2 className="h-3 w-3" />
              {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
            </button>
          </div>
          {exportMsg && (
            <p className={`text-xs ${exportMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{exportMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trip Card ────────────────────────────────────────────────────────────────

function TripCard({ trip, onClick }: { trip: TripSummary; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.planning;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/4 border border-white/10 rounded-2xl p-4 hover:bg-white/6 hover:border-white/20 transition-all group space-y-3"
    >
      {/* Emoji + titre */}
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0 mt-0.5">{destinationEmoji(trip.destination)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-snug truncate group-hover:text-secondary transition-colors">
            {trip.title}
          </p>
          {trip.destination && (
            <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {trip.destination}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-secondary/60 transition-colors flex-shrink-0" />
      </div>

      {/* Infos */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {trip.dates && (
          <span className="text-white/40 text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {trip.dates}
          </span>
        )}
        {trip.duration && (
          <span className="text-white/40 text-xs">{trip.duration}</span>
        )}
        {trip.travelers && (
          <span className="text-white/40 text-xs flex items-center gap-1">
            <Users className="h-3 w-3" /> {trip.travelers} voyageur{trip.travelers > 1 ? 's' : ''}
          </span>
        )}
        {trip.budget && (
          <span className="text-white/40 text-xs flex items-center gap-1">
            <Wallet className="h-3 w-3" /> {trip.budget}
          </span>
        )}
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${statusCfg.bg} ${statusCfg.color}`}>
          {trip.status === 'confirmed' && '✓ '}
          {statusCfg.label}
        </span>
        <span className="text-white/20 text-xs">
          {new Date(trip.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

const FILTERS = [
  { value: '',           label: 'Tous' },
  { value: 'planning',   label: 'En préparation' },
  { value: 'confirmed',  label: 'Confirmés' },
  { value: 'past',       label: 'Passés' },
];

export default function TripsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<TripFull | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/auth?returnTo=/voyages');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/trips${params}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTrips(d.trips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, filter]);

  const openTrip = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/trips/${id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.trip) setSelectedTrip(data.trip);
    } catch {}
    setLoadingDetail(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
    if (selectedTrip?.id === id) setSelectedTrip(prev => prev ? { ...prev, status: status as any } : prev);
  };

  const handleDelete = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
    setSelectedTrip(null);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const displayed = trips; // already filtered server-side

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
            <p className="text-white font-semibold text-sm leading-none">Mes Voyages</p>
            <p className="text-white/30 text-xs mt-0.5">
              {trips.length} voyage{trips.length !== 1 ? 's' : ''} sauvegardé{trips.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link to="/chat">
          <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white text-xs gap-1.5 h-8">
            <Plane className="h-3.5 w-3.5" /> Nouveau voyage
          </Button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-secondary text-black'
                  : 'bg-white/6 border border-white/10 text-white/50 hover:text-white hover:border-white/25'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid voyages */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/4 border border-white/8 rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayed.map(trip => (
              <TripCard key={trip.id} trip={trip} onClick={() => openTrip(trip.id)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <span className="text-6xl">✈️</span>
            <div className="text-center">
              <p className="text-white/60 font-semibold">Aucun voyage sauvegardé</p>
              <p className="text-white/30 text-sm mt-1">
                {filter ? `Aucun voyage avec le statut "${FILTERS.find(f => f.value === filter)?.label}"` : 'Commencez une conversation et sauvegardez votre plan.'}
              </p>
            </div>
            <Link to="/chat">
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white gap-2">
                <Plane className="h-4 w-4" /> Planifier un voyage avec Baymora
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Loading indicator for detail */}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
        </div>
      )}

      {/* Modal détail */}
      {selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
