import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, Trash2, User, MapPin, Calendar, Users, Wallet, Hotel, Utensils, Zap, Plane, StickyNote, ChevronRight } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth, getGuestMessageCount, incrementGuestMessageCount, FREE_MESSAGES_LIMIT } from '@/hooks/useAuth';
import ConversionModal from '@/components/ConversionModal';
import ContactPicker from '@/components/ContactPicker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Parseur de message complet ───────────────────────────────────────────────
// Tags supportés :
//   :::QR::: A | B | C :::END:::          → suggestions rapides
//   :::CONTACTS:::                          → sélecteur de contacts
//   :::GCAL:::{"title":...}:::END:::        → bouton Google Calendar

// ─── Plan de voyage ───────────────────────────────────────────────────────────

export interface TripPlan {
  destination?: string;
  dates?: string;
  duration?: string;
  travelers?: number;
  travelerNames?: string[];
  budget?: string;
  hotels?: Array<{ name: string; note?: string; stars?: number }>;
  flights?: Array<{ from: string; to: string; date?: string; time?: string }>;
  activities?: Array<{ name: string; day?: string }>;
  restaurants?: Array<{ name: string; stars?: number; note?: string }>;
  notes?: string[];
}

export interface CalendarEvent {
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM
  duration?: number;  // minutes
  location?: string;
  notes?: string;
}

function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const dateStr = event.date.replace(/-/g, '');
  let startStr: string;
  let endStr: string;

  if (event.time) {
    const [h, m] = event.time.split(':').map(Number);
    const durationMin = event.duration || 60;
    const startDate = new Date(`${event.date}T${event.time}:00`);
    const endDate = new Date(startDate.getTime() + durationMin * 60000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    startStr = fmt(startDate);
    endStr = fmt(endDate);
  } else {
    // All-day event
    const next = new Date(event.date);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().split('T')[0].replace(/-/g, '');
    startStr = dateStr;
    endStr = nextStr;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startStr}/${endStr}`,
    ctz: 'Europe/Paris',
  });
  if (event.location) params.set('location', event.location);
  if (event.notes) params.set('details', event.notes);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function parseMessage(content: string): {
  text: string;
  quickReplies: string[];
  showContacts: boolean;
  calendarEvents: CalendarEvent[];
  planUpdate: TripPlan | null;
} {
  let working = content;

  // Extract :::CONTACTS:::
  const showContacts = working.includes(':::CONTACTS:::');
  working = working.replace(':::CONTACTS:::', '').trim();

  // Extract :::GCAL::: events
  const calendarEvents: CalendarEvent[] = [];
  working = working.replace(/:::GCAL:::([\s\S]*?):::END:::/g, (_, json) => {
    try {
      const ev = JSON.parse(json.trim()) as CalendarEvent;
      if (ev.title && ev.date) calendarEvents.push(ev);
    } catch {}
    return '';
  });

  // Extract :::PLAN:::
  let planUpdate: TripPlan | null = null;
  working = working.replace(/:::PLAN:::([\s\S]*?):::END:::/g, (_, json) => {
    try { planUpdate = JSON.parse(json.trim()) as TripPlan; } catch {}
    return '';
  });

  // Extract :::QR:::
  const qrMatch = working.match(/:::QR:::([\s\S]*?):::END:::/);
  const quickReplies = qrMatch
    ? qrMatch[1].split('|').map(s => s.trim()).filter(Boolean)
    : [];
  working = working.replace(/:::QR:::[\s\S]*?:::END:::/, '').trim();

  return { text: working, quickReplies, showContacts, calendarEvents, planUpdate };
}

// ─── Carte Google Calendar ────────────────────────────────────────────────────

function CalendarCard({ event }: { event: CalendarEvent }) {
  const url = buildGoogleCalendarUrl(event);
  const dateLabel = event.date
    ? new Date(event.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  return (
    <div className="mt-2 bg-secondary/8 border border-secondary/25 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-white/80 text-xs font-semibold truncate">📅 {event.title}</p>
        <p className="text-white/35 text-xs mt-0.5">
          {dateLabel}{event.time ? ` à ${event.time}` : ''}{event.location ? ` · ${event.location}` : ''}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 bg-secondary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-secondary/90 transition-all whitespace-nowrap"
      >
        + Agenda
      </a>
    </div>
  );
}

// ─── Welcome chips ─────────────────────────────────────────────────────────────

const INSPIRATION_CHIPS = [
  { label: 'Week-end', msg: 'Je cherche un week-end, propose-moi' },
  { label: 'Gastronomie', msg: 'Je veux un voyage axé gastronomie et bons restaurants' },
  { label: 'Plage & îles', msg: 'Plage et îles, quelque chose d\'exceptionnel' },
  { label: 'Chill & détente', msg: 'Quelque chose de calme, spa, nature, ressourcement total' },
  { label: 'Fête & nightlife', msg: 'Je veux de la fête, du nightlife premium' },
  { label: 'Découverte & culture', msg: 'Voyage culturel, découverte, immersion locale' },
  { label: 'Romantique', msg: 'Séjour romantique pour deux, je veux quelque chose d\'inoubliable' },
  { label: 'Avec mon chien 🐶', msg: 'Je voyage avec mon chien, tout doit être pet-friendly' },
  { label: 'En famille', msg: 'Voyage en famille avec enfants' },
  { label: 'Surprends-moi ✨', msg: 'Surprends-moi totalement, je te fais confiance' },
];

const DESTINATION_CHIPS = [
  { label: 'France', msg: 'Je veux rester en France' },
  { label: 'Europe', msg: 'Quelque part en Europe' },
  { label: 'USA', msg: 'Je veux aller aux États-Unis' },
  { label: 'Asie', msg: 'Je veux partir en Asie' },
  { label: 'Îles', msg: 'Je veux une île, mer turquoise et soleil' },
  { label: 'Moyen-Orient', msg: 'Je veux découvrir le Moyen-Orient, Dubaï, etc.' },
];

// ─── Panneau Plan de voyage ───────────────────────────────────────────────────

function TripPlanPanel({ plan, onClose }: { plan: TripPlan; onClose?: () => void }) {
  const hasContent = plan.destination || plan.hotels?.length || plan.flights?.length ||
    plan.activities?.length || plan.restaurants?.length || plan.notes?.length;

  if (!hasContent) return null;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Plan de voyage</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white text-xs">✕</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Destination + infos clés */}
        {(plan.destination || plan.dates || plan.duration || plan.travelers) && (
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl p-4 space-y-2">
            {plan.destination && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-secondary mt-0.5 flex-shrink-0" />
                <span className="text-white font-semibold text-sm">{plan.destination}</span>
              </div>
            )}
            {plan.dates && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-secondary/70 flex-shrink-0" />
                <span className="text-white/70 text-xs">{plan.dates}{plan.duration ? ` · ${plan.duration}` : ''}</span>
              </div>
            )}
            {(plan.travelers || plan.travelerNames?.length) && (
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-secondary/70 flex-shrink-0" />
                <span className="text-white/70 text-xs">
                  {plan.travelerNames?.length ? plan.travelerNames.join(', ') : `${plan.travelers} voyageur${(plan.travelers || 0) > 1 ? 's' : ''}`}
                </span>
              </div>
            )}
            {plan.budget && (
              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-secondary/70 flex-shrink-0" />
                <span className="text-white/70 text-xs">{plan.budget}</span>
              </div>
            )}
          </div>
        )}

        {/* Vols */}
        {plan.flights && plan.flights.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Plane className="h-3 w-3" /> Vols
            </p>
            <div className="space-y-1.5">
              {plan.flights.map((f, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-xs font-medium">{f.from}</span>
                    <ChevronRight className="h-3 w-3 text-secondary/60" />
                    <span className="text-white/80 text-xs font-medium">{f.to}</span>
                  </div>
                  {(f.date || f.time) && (
                    <span className="text-white/40 text-xs">{f.date}{f.time ? ` ${f.time}` : ''}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hébergements */}
        {plan.hotels && plan.hotels.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Hotel className="h-3 w-3" /> Hébergements
            </p>
            <div className="space-y-1.5">
              {plan.hotels.map((h, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                  <p className="text-white/85 text-xs font-medium">{h.name}</p>
                  {h.note && <p className="text-white/40 text-xs mt-0.5">{h.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activités */}
        {plan.activities && plan.activities.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="h-3 w-3" /> Activités
            </p>
            <div className="space-y-1.5">
              {plan.activities.map((a, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex items-start justify-between gap-2">
                  <p className="text-white/80 text-xs">{a.name}</p>
                  {a.day && <span className="text-secondary/60 text-xs whitespace-nowrap">{a.day}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restaurants */}
        {plan.restaurants && plan.restaurants.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Utensils className="h-3 w-3" /> Restaurants
            </p>
            <div className="space-y-1.5">
              {plan.restaurants.map((r, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white/85 text-xs font-medium">{r.name}</p>
                    {r.stars && <span className="text-secondary text-xs">{'★'.repeat(r.stars)}</span>}
                  </div>
                  {r.note && <p className="text-white/40 text-xs mt-0.5">{r.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {plan.notes && plan.notes.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <StickyNote className="h-3 w-3" /> Notes
            </p>
            <div className="space-y-1.5">
              {plan.notes.map((n, i) => (
                <div key={i} className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
                  <p className="text-white/60 text-xs">{n}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-white/15 text-xs text-center pb-2">Se met à jour en temps réel</p>
      </div>
    </div>
  );
}

// ─── Composant ─────────────────────────────────────────────────────────────────

export default function Chat() {
  const [input, setInput] = useState('');
  const [showConversion, setShowConversion] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [guestMsgCount, setGuestMsgCount] = useState(() => getGuestMessageCount());
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [showPlanMobile, setShowPlanMobile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { messages, isLoading, error, conversationId, startChat, sendMessage, deleteConversation } = useChat();

  useEffect(() => { startChat('fr'); }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isLoading) inputRef.current?.focus();
  }, [messages, isLoading]);

  // Auto-show ContactPicker + accumulate trip plan from messages
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        if (last.content.includes(':::CONTACTS:::')) setShowContactPicker(true);
        // Accumulate plan updates
        const parsed = parseMessage(last.content);
        if (parsed.planUpdate) {
          setTripPlan(prev => ({ ...prev, ...parsed.planUpdate }));
        }
      }
    }
  }, [messages, isLoading]);

  const guestRemaining = FREE_MESSAGES_LIMIT - guestMsgCount;
  // Ne pas bloquer pendant le chargement auth initial — évite le bug compteur
  const isGuestLimitReached = !authLoading && !isAuthenticated && guestMsgCount >= FREE_MESSAGES_LIMIT;

  const canSend = () => {
    if (authLoading) return false; // Attendre la résolution auth avant de compter
    if (isGuestLimitReached) { setShowConversion(true); return false; }
    if (!isAuthenticated) {
      const newCount = incrementGuestMessageCount();
      setGuestMsgCount(newCount);
    }
    return true;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!canSend()) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleChip = async (msg: string) => {
    if (isLoading) return;
    if (!canSend()) return;
    await sendMessage(msg);
  };

  const handleContactConfirm = async (selected: { name: string }[], newContact?: { name: string }) => {
    setShowContactPicker(false);
    const all = [...selected];
    if (newContact) all.push(newContact);
    if (all.length === 0) return;

    const names = all.map(c => c.name);
    let msg: string;
    if (names.length === 1) {
      msg = `Je pars avec ${names[0]}`;
    } else {
      const last = names.pop();
      msg = `Je pars avec ${names.join(', ')} et ${last}`;
    }
    if (!canSend()) return;
    await sendMessage(msg);
  };

  const handleClear = async () => {
    if (!conversationId) return;
    await deleteConversation(conversationId);
    setTripPlan(null);
    await startChat('fr');
  };

  const circleBadge = user
    ? ({ decouverte: '○', essentiel: '✦', elite: '✦✦', prive: '✦✦✦', fondateur: '✦✦✦✦' } as Record<string, string>)[user.circle]
    : null;

  const hasPlan = tripPlan && (tripPlan.destination || tripPlan.hotels?.length || tripPlan.flights?.length || tripPlan.activities?.length || tripPlan.restaurants?.length);

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">

      {showConversion && (
        <ConversionModal
          onClose={() => setShowConversion(false)}
          onSuccess={() => setShowConversion(false)}
          conversationId={conversationId || undefined}
        />
      )}

      {/* Mobile plan overlay */}
      {showPlanMobile && hasPlan && (
        <div className="fixed inset-0 z-40 bg-slate-950 lg:hidden">
          <div className="h-full">
            <TripPlanPanel plan={tripPlan!} onClose={() => setShowPlanMobile(false)} />
          </div>
        </div>
      )}

      {/* ── Left: Chat ── */}
      <div className={`flex flex-col flex-1 min-w-0 ${hasPlan ? 'lg:max-w-[60%]' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white px-2"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center text-white font-bold text-sm">B</div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">Baymora</p>
              <p className="text-white/40 text-xs mt-0.5">Conciergerie de voyage</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <Link to="/dashboard">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 hover:bg-white/10 transition-colors">
                <span className="text-secondary text-xs">{circleBadge}</span>
                <span className="text-white/70 text-xs font-medium">{user.prenom || user.pseudo}</span>
                {user.mode === 'fantome' && <span className="text-white/30 text-xs">👻</span>}
              </div>
            </Link>
          ) : (
            <Link to="/auth?returnTo=/chat">
              <button className="flex items-center gap-1.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs font-medium px-3 py-1.5 rounded-full hover:bg-secondary/25 transition-all">
                <User className="h-3 w-3" />Créer mon profil
              </button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading} className="text-white/40 hover:text-white/80">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bannière messages restants */}
      {!isAuthenticated && guestMsgCount > 0 && !isGuestLimitReached && (
        <div className="flex-shrink-0 bg-secondary/10 border-b border-secondary/20 px-4 py-2 flex items-center justify-between">
          <p className="text-secondary/80 text-xs">{guestRemaining === 1 ? 'Plus qu\'un message gratuit' : `${guestRemaining} messages gratuits restants`}</p>
          <button onClick={() => setShowConversion(true)} className="text-secondary text-xs font-medium hover:underline">Créer un compte →</button>
        </div>
      )}
      {isGuestLimitReached && (
        <div className="flex-shrink-0 bg-slate-800/80 border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <p className="text-white/70 text-xs">Vous avez utilisé vos {FREE_MESSAGES_LIMIT} échanges gratuits.</p>
          <button onClick={() => setShowConversion(true)} className="bg-secondary text-white text-xs font-semibold px-3 py-1 rounded-full hover:bg-secondary/90">Continuer →</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6">

        {/* ── Welcome screen ── */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-full gap-6 animate-fade-in py-4">

            {/* Logo + tagline */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-secondary">B</span>
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 40%, #c8bfa8 70%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 8px rgba(255,245,220,0.4))'}}>
                {user?.prenom ? `Bonjour ${user.prenom}` : 'Bonjour'}
              </h2>
              {/* La phrase iconique */}
              <p className="text-sm font-medium tracking-wide" style={{background: 'linear-gradient(135deg, #c8a94a 0%, #f5d87a 35%, #e4c057 65%, #f5d87a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 10px rgba(212,168,80,0.5))'}}>
                L'expérience de votre vie commence ici.
              </p>
              <p className="text-white/40 text-xs mt-2 max-w-xs mx-auto">
                Dites-nous n'importe quoi — même si ce n'est pas clair. Baymora s'occupe du reste.
              </p>
            </div>

            {/* Chips d'inspiration */}
            <div className="w-full max-w-lg">
              <p className="text-xs uppercase tracking-widest mb-2 text-center" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 45%, #c8bfa8 75%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 6px rgba(255,245,220,0.35))'}}>Quelle envie ?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {INSPIRATION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChip(chip.msg)}
                    disabled={isLoading || isGuestLimitReached}
                    className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/65 text-xs hover:bg-secondary/15 hover:border-secondary/40 hover:text-white transition-all disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chips destination */}
            <div className="w-full max-w-lg">
              <p className="text-xs uppercase tracking-widest mb-2 text-center" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 45%, #c8bfa8 75%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 6px rgba(255,245,220,0.35))'}}>Quelle destination ?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {DESTINATION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChip(chip.msg)}
                    disabled={isLoading || isGuestLimitReached}
                    className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/65 text-xs hover:bg-secondary/15 hover:border-secondary/40 hover:text-white transition-all disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidentialité */}
            <div className="w-full max-w-lg bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-center">
              <p className="text-white/50 text-xs leading-relaxed">
                🔒 <span className="font-medium" style={{background: 'linear-gradient(135deg, #ffffff 0%, #e8e0d0 40%, #d0c8b8 70%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 6px rgba(255,245,220,0.4))'}}>Vos données restent privées.</span><br />
                Baymora mémorise vos préférences, vos proches et leurs habitudes pour personnaliser chaque conseil — anniversaires, régimes alimentaires, dress codes...<br />
                <span className="text-white/35">Rien n'est partagé. Tout s'efface si vous ne créez pas de compte.</span>
              </p>
            </div>
            <p className="text-white/25 text-xs text-center -mt-2">
              Ou écrivez directement — week-end, soirée, gastro, US, chill...
              {!isAuthenticated && <><br /><span className="text-secondary/50">{FREE_MESSAGES_LIMIT} échanges gratuits · Créez un compte pour continuer</span></>}
            </p>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1;
            const parsed = msg.role === 'assistant' ? parseMessage(msg.content) : null;

            return (
              <div key={msg.id || i}>
                <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0 text-secondary font-bold text-xs mt-1">B</div>
                  )}
                  <div className={`max-w-sm md:max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-slate-800/60 border border-white/10 text-white/90 rounded-bl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold text-secondary mb-2 mt-3 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-white/90 mb-1 mt-2">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-none space-y-1 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="text-white/85">{children}</li>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-white/70 italic">{children}</em>,
                          hr: () => <hr className="border-white/10 my-3" />,
                          table: ({ children }) => <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse">{children}</table></div>,
                          thead: ({ children }) => <thead className="border-b border-white/20">{children}</thead>,
                          th: ({ children }) => <th className="text-left py-1.5 px-2 text-white/60 font-medium">{children}</th>,
                          td: ({ children }) => <td className="py-1.5 px-2 border-b border-white/5 text-white/80">{children}</td>,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-secondary underline underline-offset-2 hover:text-secondary/80">{children}</a>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-secondary/50 pl-3 my-2 text-white/60 italic">{children}</blockquote>,
                          code: ({ children }) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-secondary">{children}</code>,
                        }}
                      >
                        {parsed?.text ?? msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>

                {/* Cartes Google Calendar (tous les messages assistant) */}
                {msg.role === 'assistant' && parsed && parsed.calendarEvents.length > 0 && (
                  <div className="ml-11 space-y-1.5 mt-1">
                    {parsed.calendarEvents.map((ev, ei) => (
                      <CalendarCard key={ei} event={ev} />
                    ))}
                  </div>
                )}

                {/* Quick-reply chips après le dernier message assistant */}
                {msg.role === 'assistant' && isLast && parsed && parsed.quickReplies.length > 0 && !isLoading && !showContactPicker && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-11">
                    {parsed.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleChip(reply)}
                        disabled={isGuestLimitReached}
                        className="px-3 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/25 hover:border-secondary/60 transition-all disabled:opacity-40"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* ContactPicker après le dernier message assistant */}
                {msg.role === 'assistant' && isLast && showContactPicker && !isLoading && (
                  <ContactPicker
                    onConfirm={handleContactConfirm}
                    onDismiss={() => setShowContactPicker(false)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex gap-3 justify-start mt-4 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 text-secondary animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/60 border border-white/10">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-center text-red-400/80 text-xs py-2 mt-4">{error}</div>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            placeholder={isGuestLimitReached ? 'Créez un compte pour continuer...' : 'Week-end, fête, plage, gastro, surprise... dites-nous tout'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            onClick={() => isGuestLimitReached && setShowConversion(true)}
            autoFocus
            className="flex-1 h-10 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60 focus:ring-1 focus:ring-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {hasPlan && (
            <Button
              onClick={() => setShowPlanMobile(true)}
              size="sm"
              variant="ghost"
              className="lg:hidden text-secondary border border-secondary/30 px-3"
              title="Voir le plan"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={isGuestLimitReached ? () => setShowConversion(true) : handleSend}
            disabled={isLoading || (!isGuestLimitReached && !input.trim())}
            size="sm"
            className="bg-secondary hover:bg-secondary/90 text-white px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-white/20 text-xs mt-2">Baymora — Votre conciergerie de voyage privée</p>
      </div>

      </div>{/* end left chat column */}

      {/* ── Right: Trip Plan Panel (desktop only) ── */}
      {hasPlan && (
        <div className="hidden lg:flex w-96 xl:w-[420px] flex-shrink-0 border-l border-white/10 flex-col">
          <TripPlanPanel plan={tripPlan!} />
        </div>
      )}

    </div>
  );
}
