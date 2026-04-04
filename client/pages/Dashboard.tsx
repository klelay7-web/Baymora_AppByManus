import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users, Calendar, Sparkles, ChevronRight, LogOut, Crown, Edit3, Bell, Home, Plane, CheckCircle2, Circle, Save, Smartphone, Bookmark, Trash2, Share2, Plus, Star, X, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

interface UpcomingAlert {
  label: string;
  contactName?: string;
  daysLeft: number;
  alertWindow: number;
  googleCalendarUrl: string;
}

interface CollectionItem {
  id: string;
  type: string;
  name: string;
  city?: string;
  description?: string;
  photo?: string;
  rating?: number;
  priceRange?: string;
}

interface Collection {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  shareCode?: string;
  isPublic?: boolean;
  items: CollectionItem[];
  _count?: { items: number };
}

interface CollectionLimits {
  maxCollections: number;
  maxItems: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeader() {
  const token = localStorage.getItem('baymora_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CIRCLE_LABEL: Record<string, string> = {
  decouverte: 'Découverte',
  premium: 'Premium',
  prive: 'Privé',
  voyageur: 'Premium',
  explorateur: 'Premium',
  fondateur: 'Privé',
};

const CIRCLE_BADGE: Record<string, string> = {
  decouverte: '○',
  premium: '✦',
  prive: '✦✦✦',
  voyageur: '✦',
  explorateur: '✦',
  fondateur: '✦✦✦',
};

const CIRCLE_COLOR: Record<string, string> = {
  decouverte: 'text-white/40',
  voyageur: 'text-secondary',
  explorateur: 'text-secondary',
  prive: 'text-amber-300',
  fondateur: 'text-amber-200',
};

const PLAN_NEXT: Record<string, { label: string; circle: string; price: string }> = {
  decouverte: { label: 'Voyageur', circle: 'voyageur', price: '9,90€/mois' },
  voyageur: { label: 'Explorateur', circle: 'explorateur', price: '29€/mois' },
  explorateur: { label: 'Cercle Privé', circle: 'prive', price: '79€/mois' },
  prive: { label: 'Fondateur', circle: 'fondateur', price: '199€/mois' },
  fondateur: { label: '', circle: '', price: '' },
};

// ─── Types de proches ──────────────────────────────────────────────────────────

const RELATIONSHIP_CONFIG: Record<string, { emoji: string; label: string }> = {
  ami:         { emoji: '👫', label: 'Ami(e)' },
  conjoint:    { emoji: '💑', label: 'Conjoint(e)' },
  enfant:      { emoji: '👶', label: 'Enfant' },
  animal:      { emoji: '🐾', label: 'Animal de compagnie' },
  parent:      { emoji: '👴', label: 'Parent' },
  grandparent: { emoji: '👵', label: 'Grand-parent' },
  collegue:    { emoji: '💼', label: 'Collègue' },
  autre:       { emoji: '👤', label: 'Autre' },
};

// ─── Occasions spéciales prédéfinies ──────────────────────────────────────────

const SPECIAL_OCCASIONS = [
  { id: 'valentine',    emoji: '💑', label: 'Saint-Valentin',        mmdd: '02-14', note: '' },
  { id: 'mothers_day',  emoji: '🌸', label: 'Fête des mères',        mmdd: '05-25', note: 'Dernier dimanche de mai' },
  { id: 'fathers_day',  emoji: '👨', label: 'Fête des pères',        mmdd: '06-15', note: '3ème dimanche de juin' },
  { id: 'noel',         emoji: '🎄', label: 'Noël',                  mmdd: '12-25', note: '' },
  { id: 'reveillon',    emoji: '🥂', label: 'Réveillon du Nouvel An', mmdd: '12-31', note: '' },
  { id: 'thanksgiving', emoji: '🦃', label: 'Thanksgiving',          mmdd: '11-27', note: '4ème jeudi de novembre' },
  { id: 'halloween',    emoji: '🎃', label: 'Halloween',             mmdd: '10-31', note: '' },
  { id: 'eid',          emoji: '🌙', label: 'Aïd el-Fitr',           mmdd: '',       note: 'Date variable selon calendrier' },
  { id: 'hanoukka',     emoji: '🕎', label: 'Hanoukka',              mmdd: '',       note: 'Date variable' },
  { id: 'ramadan',      emoji: '☪️',  label: 'Début du Ramadan',      mmdd: '',       note: 'Date variable selon calendrier' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

// ─── Composant ────────────────────────────────────────────────────────────────

// ─── Section logistique ───────────────────────────────────────────────────────

interface LogisticsForm {
  homeAddress: string;
  homeAirport: string;
  hasLounge: boolean;
  hasPriorityLane: boolean;
}

// ─── Club Widget ──────────────────────────────────────────────────────────────

const CLUB_TIERS = [
  { name: 'Crystal',  min: 0,    emoji: '💎', textClass: 'text-sky-400'    },
  { name: 'Gold',     min: 500,  emoji: '🌟', textClass: 'text-amber-400'  },
  { name: 'Platinum', min: 2000, emoji: '✨', textClass: 'text-violet-400' },
  { name: 'Diamond',  min: 5000, emoji: '👑', textClass: 'text-white'      },
];
function getClubTier(pts: number) {
  return [...CLUB_TIERS].reverse().find(t => pts >= t.min) ?? CLUB_TIERS[0];
}

function ClubWidget({ userId }: { userId: string }) {
  const { authHeader } = useAuth();
  const [data, setData] = useState<{ points: number; tier: any; nextTier: any; progressPercent: number; inviteCode: any; clubVerified: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/club/me', { headers: authHeader })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  const tier = data ? getClubTier(data.points) : null;
  const nextTier = data?.nextTier;

  return (
    <div className="bg-gradient-to-br from-secondary/8 to-transparent border border-secondary/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{tier?.emoji ?? '💎'}</span>
          <span className="text-white font-semibold text-sm">Baymora Club</span>
          {data?.clubVerified && (
            <span className="text-emerald-400 text-xs">✓ Vérifié</span>
          )}
        </div>
        <Link to="/club" className="text-secondary/60 hover:text-secondary text-xs transition-colors">
          Voir tout →
        </Link>
      </div>
      {data ? (
        <>
          <p className="text-white/80 text-sm mb-2">
            <span className={`font-bold text-lg ${tier?.textClass}`}>{data.points.toLocaleString('fr-FR')}</span>
            <span className="text-white/30 ml-1">Crystals</span>
            {tier && <span className={`ml-2 text-xs ${tier.textClass}`}>· {tier.emoji} {tier.name}</span>}
          </p>
          {nextTier && (
            <div className="bg-white/6 rounded-full h-1.5 mb-1">
              <div
                className="h-full rounded-full bg-secondary/70 transition-all"
                style={{ width: `${data.progressPercent}%` }}
              />
            </div>
          )}
          {data.inviteCode && (
            <p className="text-white/25 text-xs mt-1">
              {data.inviteCode.usedCount} ami{data.inviteCode.usedCount !== 1 ? 's' : ''} invité{data.inviteCode.usedCount !== 1 ? 's' : ''} · Code : <span className="font-mono">{data.inviteCode.code}</span>
            </p>
          )}
        </>
      ) : (
        <div className="h-6 bg-white/5 rounded animate-pulse" />
      )}
    </div>
  );
}

function LogisticsSection({ user }: { user: any }) {
  const prefs = user.preferences || {};
  const [form, setForm] = useState<LogisticsForm>({
    homeAddress: prefs.homeAddress || '',
    homeAirport: prefs.homeAirport || '',
    hasLounge: prefs.hasLounge || false,
    hasPriorityLane: prefs.hasPriorityLane || false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(!prefs.homeAddress);

  async function save() {
    setSaving(true);
    try {
      const token = localStorage.getItem('baymora_token');
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: form }),
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
          <Plane className="h-4 w-4 text-secondary/70" /> Logistique départ
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-secondary/60 text-xs hover:text-secondary transition-colors flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3" /> Modifier
          </button>
        )}
      </div>

      <div className="bg-white/4 border border-white/10 rounded-2xl p-4 space-y-3">
        {/* Adresse domicile */}
        <div>
          <label className="flex items-center gap-1.5 text-white/40 text-xs mb-1.5">
            <Home className="h-3 w-3" /> Adresse domicile
          </label>
          {editing ? (
            <input
              type="text"
              value={form.homeAddress}
              onChange={e => setForm(f => ({ ...f, homeAddress: e.target.value }))}
              placeholder="12 rue de la Paix, Paris 75001"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-secondary/50 transition-colors"
            />
          ) : (
            <p className="text-white/70 text-sm px-1">
              {form.homeAddress || <span className="text-white/20 italic">Non renseignée</span>}
            </p>
          )}
        </div>

        {/* Aéroport favori */}
        <div>
          <label className="flex items-center gap-1.5 text-white/40 text-xs mb-1.5">
            <Plane className="h-3 w-3" /> Aéroport de départ favori
          </label>
          {editing ? (
            <input
              type="text"
              value={form.homeAirport}
              onChange={e => setForm(f => ({ ...f, homeAirport: e.target.value }))}
              placeholder="CDG, ORY, NCE, LYS..."
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-secondary/50 transition-colors"
            />
          ) : (
            <p className="text-white/70 text-sm px-1">
              {form.homeAirport || <span className="text-white/20 italic">Non renseigné</span>}
            </p>
          )}
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2 pt-1">
          {[
            { key: 'hasLounge' as const, label: 'Accès salon (Priority Pass, Amex Centurion, statut compagnie)', emoji: '🛋️' },
            { key: 'hasPriorityLane' as const, label: 'Priority Lane / TSA PreCheck / contrôle accéléré', emoji: '⚡' },
          ].map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => editing && setForm(f => ({ ...f, [key]: !f[key] }))}
              className={`flex items-center gap-3 text-left transition-all ${editing ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {form[key]
                ? <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                : <Circle className="h-4 w-4 text-white/20 flex-shrink-0" />
              }
              <span className="text-xs">
                <span className="mr-1">{emoji}</span>
                <span className={form[key] ? 'text-white/70' : 'text-white/30'}>{label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Bouton sauvegarder */}
        {editing && (
          <button
            onClick={save}
            disabled={saving}
            className="w-full mt-1 flex items-center justify-center gap-2 bg-secondary/15 border border-secondary/25 text-secondary text-sm font-medium py-2 rounded-xl hover:bg-secondary/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Sauvegardé</>
            ) : (
              <><Save className="h-4 w-4" /> Sauvegarder</>
            )}
          </button>
        )}

        {!editing && (form.homeAddress || form.homeAirport) && (
          <p className="text-white/20 text-xs text-center pt-1">
            Baymora calcule votre heure de départ optimale avec ces données ✓
          </p>
        )}
      </div>
    </section>
  );
}

// ─── Section : Mes proches ────────────────────────────────────────────────────

interface AddCompanionForm {
  name: string;
  relationship: string;
  birthday: string;
  diet: string;
  allergies: string;
  disability: string;
  healthNotes: string;
  medications: string;
  petSpecies: string;
}

const EMPTY_COMPANION: AddCompanionForm = {
  name: '', relationship: 'ami', birthday: '', diet: '', allergies: '',
  disability: '', healthNotes: '', medications: '', petSpecies: '',
};

function ProchesSection({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddCompanionForm>(EMPTY_COMPANION);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const token = localStorage.getItem('baymora_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function addProche() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/users/me/companions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: form.name.trim(),
          relationship: form.relationship,
          birthday: form.birthday || null,
          diet: form.diet || null,
          preferences: {
            allergies: form.allergies || null,
            disability: form.disability || null,
            healthNotes: form.healthNotes || null,
            medications: form.medications || null,
            petSpecies: form.petSpecies || null,
          },
        }),
      });
      setForm(EMPTY_COMPANION);
      setShowAdd(false);
      onUpdate();
    } finally { setSaving(false); }
  }

  async function deleteProche(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/users/me/companions/${id}`, { method: 'DELETE', headers });
      onUpdate();
    } finally { setDeletingId(null); }
  }

  const companions = user.travelCompanions || [];

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-secondary/70" /> Mes proches
        </h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="text-secondary/60 text-xs hover:text-secondary transition-colors flex items-center gap-1"
        >
          {showAdd ? '✕ Annuler' : '+ Ajouter'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAdd && (
        <div className="bg-slate-800/60 border border-white/12 rounded-2xl p-4 mb-3 space-y-3">
          <p className="text-white/50 text-xs mb-1">Nouveau proche</p>

          {/* Nom + Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/30 text-xs mb-1 block">Prénom *</label>
              <input type="text" placeholder="Marie" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Type</label>
              <select value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-secondary/50">
                {Object.entries(RELATIONSHIP_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Champs spécifiques animal */}
          {form.relationship === 'animal' && (
            <div>
              <label className="text-white/30 text-xs mb-1 block">Espèce / Race</label>
              <input type="text" placeholder="Chien Golden Retriever" value={form.petSpecies}
                onChange={e => setForm(f => ({ ...f, petSpecies: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
            </div>
          )}

          {/* Date anniversaire */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">🎂 Date d'anniversaire</label>
            <input type="text" placeholder="DD/MM ou DD/MM/AAAA" value={form.birthday}
              onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
          </div>

          {/* Régime alimentaire */}
          {form.relationship !== 'animal' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/30 text-xs mb-1 block">🍽️ Régime alimentaire</label>
                <select value={form.diet}
                  onChange={e => setForm(f => ({ ...f, diet: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-secondary/50">
                  <option value="">Aucun particulier</option>
                  <option value="végétarien">Végétarien</option>
                  <option value="végétalien">Végétalien / Vegan</option>
                  <option value="sans gluten">Sans gluten</option>
                  <option value="sans lactose">Sans lactose</option>
                  <option value="halal">Halal</option>
                  <option value="casher">Casher</option>
                  <option value="pescétarien">Pescétarien</option>
                  <option value="sans porc">Sans porc</option>
                  <option value="autre">Autre (préciser dans notes)</option>
                </select>
              </div>
              <div>
                <label className="text-white/30 text-xs mb-1 block">⚠️ Allergies</label>
                <input type="text" placeholder="Noix, gluten..." value={form.allergies}
                  onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
              </div>
            </div>
          )}

          {/* Handicap / Mobilité */}
          {form.relationship !== 'animal' && (
            <div>
              <label className="text-white/30 text-xs mb-1 block">♿ Situation de handicap ou mobilité réduite</label>
              <input type="text" placeholder="Fauteuil roulant, accès PMR requis..." value={form.disability}
                onChange={e => setForm(f => ({ ...f, disability: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
            </div>
          )}

          {/* Santé / médicaments */}
          {form.relationship !== 'animal' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/30 text-xs mb-1 block">💊 Médicaments</label>
                <input type="text" placeholder="Insuline 3x/jour..." value={form.medications}
                  onChange={e => setForm(f => ({ ...f, medications: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
              </div>
              <div>
                <label className="text-white/30 text-xs mb-1 block">🏥 Notes santé</label>
                <input type="text" placeholder="Diabète, hypertension..." value={form.healthNotes}
                  onChange={e => setForm(f => ({ ...f, healthNotes: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
              </div>
            </div>
          )}

          <button onClick={addProche} disabled={saving || !form.name.trim()}
            className="w-full bg-secondary/15 border border-secondary/30 text-secondary text-sm font-semibold py-2 rounded-xl hover:bg-secondary/25 transition-all disabled:opacity-40">
            {saving ? 'Enregistrement...' : '+ Ajouter ce proche'}
          </button>
        </div>
      )}

      {/* Liste des proches */}
      {companions.length > 0 ? (
        <div className="space-y-2">
          {companions.map((c: any) => {
            const config = RELATIONSHIP_CONFIG[c.relationship] || RELATIONSHIP_CONFIG.autre;
            const prefs = c.preferences || {};
            return (
              <div key={c.id} className="bg-white/4 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0 text-lg">
                      {config.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{c.name}</span>
                        <span className="text-white/30 text-xs bg-white/5 px-2 py-0.5 rounded-full">{config.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {c.age && <span className="text-white/35 text-xs">{c.age} ans</span>}
                        {c.birthday && <span className="text-white/35 text-xs">🎂 {c.birthday}</span>}
                        {c.diet && <span className="text-white/35 text-xs">🍽️ {c.diet}</span>}
                        {prefs.allergies && <span className="text-amber-400/60 text-xs">⚠️ {prefs.allergies}</span>}
                        {prefs.disability && <span className="text-blue-400/60 text-xs">♿ {prefs.disability}</span>}
                        {prefs.medications && <span className="text-emerald-400/60 text-xs">💊 {prefs.medications}</span>}
                        {prefs.healthNotes && <span className="text-rose-400/60 text-xs">🏥 {prefs.healthNotes}</span>}
                        {prefs.petSpecies && <span className="text-white/35 text-xs">🐾 {prefs.petSpecies}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProche(c.id)}
                    disabled={deletingId === c.id}
                    className="text-white/15 hover:text-red-400/60 transition-colors flex-shrink-0 text-xs px-1"
                    title="Supprimer"
                  >
                    {deletingId === c.id ? '...' : '✕'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : !showAdd && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
          <p className="text-white/25 text-sm">Ajoutez vos proches pour que Baymora personnalise chaque conseil.</p>
          <p className="text-white/15 text-xs mt-1">Amis, enfants, animaux, parents — chacun avec ses besoins</p>
        </div>
      )}
    </section>
  );
}

// ─── Section : Dates & occasions ──────────────────────────────────────────────

function DatesSection({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customForm, setCustomForm] = useState({ label: '', date: '', contactName: '', recurring: true });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingOccasion, setAddingOccasion] = useState<string | null>(null);

  const token = localStorage.getItem('baymora_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const existingDates: any[] = user.importantDates || [];
  const existingLabels = existingDates.map((d: any) => d.label.toLowerCase());

  async function addDate(payload: any) {
    setSaving(true);
    try {
      await fetch('/api/users/me/dates', { method: 'POST', headers, body: JSON.stringify(payload) });
      onUpdate();
    } finally { setSaving(false); }
  }

  async function addOccasion(occ: typeof SPECIAL_OCCASIONS[0]) {
    setAddingOccasion(occ.id);
    const year = new Date().getFullYear();
    const date = occ.mmdd ? `${year}-${occ.mmdd}` : `${year}-01-01`;
    await addDate({ label: occ.label, date, recurring: true, notes: occ.note || null });
    setAddingOccasion(null);
    onUpdate();
  }

  async function deleteDate(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/users/me/dates/${id}`, { method: 'DELETE', headers });
      onUpdate();
    } finally { setDeletingId(null); }
  }

  async function addCustom() {
    if (!customForm.label || !customForm.date) return;
    setSaving(true);
    try {
      await addDate({
        label: customForm.label,
        date: customForm.date,
        recurring: customForm.recurring,
        contactName: customForm.contactName || null,
      });
      setCustomForm({ label: '', date: '', contactName: '', recurring: true });
      setShowAddCustom(false);
    } finally { setSaving(false); }
  }

  return (
    <section className="space-y-4">

      {/* Dates importantes existantes */}
      {existingDates.length > 0 && (
        <div>
          <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-secondary/70" /> Dates importantes
          </h2>
          <div className="space-y-2">
            {existingDates.map((d: any) => (
              <div key={d.id} className="bg-white/4 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-white text-sm">{d.label}</span>
                  {d.contactName && <span className="text-white/40 text-xs ml-2">— {d.contactName}</span>}
                  <p className="text-white/30 text-xs mt-0.5">{d.date}{d.recurring ? ' · chaque année' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎂</span>
                  <button onClick={() => deleteDate(d.id)} disabled={deletingId === d.id}
                    className="text-white/15 hover:text-red-400/60 transition-colors text-xs">
                    {deletingId === d.id ? '...' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Occasions spéciales */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
            🎊 Occasions à fêter
          </h2>
          <button onClick={() => setShowAddCustom(v => !v)}
            className="text-secondary/60 text-xs hover:text-secondary transition-colors">
            {showAddCustom ? '✕ Annuler' : '+ Personnalisée'}
          </button>
        </div>

        {/* Ajout personnalisé */}
        {showAddCustom && (
          <div className="bg-slate-800/60 border border-white/12 rounded-2xl p-4 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/30 text-xs mb-1 block">Événement</label>
                <input type="text" placeholder="Anniversaire de mariage" value={customForm.label}
                  onChange={e => setCustomForm(f => ({ ...f, label: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
              </div>
              <div>
                <label className="text-white/30 text-xs mb-1 block">Date</label>
                <input type="date" value={customForm.date}
                  onChange={e => setCustomForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-secondary/50" />
              </div>
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Personne concernée (optionnel)</label>
              <input type="text" placeholder="Marie, Maman..." value={customForm.contactName}
                onChange={e => setCustomForm(f => ({ ...f, contactName: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-secondary/50" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={customForm.recurring}
                onChange={e => setCustomForm(f => ({ ...f, recurring: e.target.checked }))}
                className="accent-secondary" />
              <span className="text-white/50 text-xs">Se répète chaque année</span>
            </label>
            <button onClick={addCustom} disabled={saving || !customForm.label || !customForm.date}
              className="w-full bg-secondary/15 border border-secondary/30 text-secondary text-sm font-semibold py-2 rounded-xl hover:bg-secondary/25 transition-all disabled:opacity-40">
              {saving ? 'Enregistrement...' : '+ Ajouter cet événement'}
            </button>
          </div>
        )}

        {/* Grid occasions prédéfinies */}
        <div className="grid grid-cols-2 gap-2">
          {SPECIAL_OCCASIONS.map(occ => {
            const alreadyAdded = existingLabels.includes(occ.label.toLowerCase());
            return (
              <button key={occ.id}
                onClick={() => !alreadyAdded && addOccasion(occ)}
                disabled={alreadyAdded || addingOccasion === occ.id}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  alreadyAdded
                    ? 'bg-secondary/8 border-secondary/25 cursor-default'
                    : 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15 cursor-pointer'
                }`}
              >
                <span className="text-lg flex-shrink-0">{occ.emoji}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${alreadyAdded ? 'text-secondary/80' : 'text-white/65'}`}>
                    {occ.label}
                  </p>
                  {occ.note && <p className="text-white/20 text-[10px] truncate">{occ.note}</p>}
                </div>
                {alreadyAdded && <span className="text-secondary text-xs flex-shrink-0">✓</span>}
                {addingOccasion === occ.id && <span className="text-xs text-white/40">...</span>}
              </button>
            );
          })}
        </div>
        <p className="text-white/20 text-xs text-center mt-2">
          Cliquez pour activer — Baymora vous rappellera ces occasions 30 jours avant
        </p>
      </div>
    </section>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

// ─── Trips Widget ─────────────────────────────────────────────────────────────

const STATUS_EMOJI: Record<string, string> = { planning: '🗓️', confirmed: '✅', past: '📁' };
const STATUS_LABEL: Record<string, string> = { planning: 'En préparation', confirmed: 'Confirmé', past: 'Passé' };

function destinationEmoji(dest?: string | null): string {
  if (!dest) return '✈️';
  const d = dest.toLowerCase();
  if (d.includes('japon') || d.includes('kyoto') || d.includes('tokyo')) return '🏯';
  if (d.includes('bali') || d.includes('indonés')) return '🌴';
  if (d.includes('paris') || d.includes('france')) return '🗼';
  if (d.includes('dubai')) return '🏙️';
  if (d.includes('maldives') || d.includes('île')) return '🏝️';
  if (d.includes('maroc') || d.includes('marrakech')) return '🕌';
  if (d.includes('italie') || d.includes('rome')) return '🏛️';
  return '✈️';
}

function TripsWidget() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('baymora_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetch('/api/trips?limit=3', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTrips(d.trips || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-secondary/70" />
          <span className="text-white/80 font-semibold text-sm">Mes Voyages</span>
          {trips.length > 0 && (
            <span className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full font-medium">
              {trips.length}
            </span>
          )}
        </div>
        <Link to="/voyages" className="text-secondary/60 hover:text-secondary text-xs transition-colors">
          Voir tout →
        </Link>
      </div>

      <div className="px-4 py-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-10 bg-white/4 rounded-xl animate-pulse" />)}
          </div>
        ) : trips.length > 0 ? (
          <div className="space-y-2">
            {trips.map(trip => (
              <Link key={trip.id} to="/voyages">
                <div className="flex items-center gap-3 py-1.5 hover:opacity-80 transition-opacity group">
                  <span className="text-xl flex-shrink-0">{destinationEmoji(trip.destination)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm truncate group-hover:text-secondary transition-colors">{trip.title}</p>
                    {trip.dates && <p className="text-white/30 text-xs">{trip.dates}</p>}
                  </div>
                  <span className="text-xs flex-shrink-0">{STATUS_EMOJI[trip.status] || '✈️'}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center">
            <p className="text-white/25 text-sm">Aucun voyage sauvegardé</p>
            <Link to="/chat" className="text-secondary/50 text-xs hover:text-secondary transition-colors mt-1 block">
              Planifier avec Baymora →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notifications Widget ─────────────────────────────────────────────────────

interface NotifPrefs {
  phone: string | null;
  notifSms: boolean;
  notifWhatsApp: boolean;
  notifFlights: boolean;
  notifCheckin: boolean;
  notifBirthdays: boolean;
  notifOffers: boolean;
}

function NotificationWidget() {
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [expanded, setExpanded] = useState(false);

  const token = localStorage.getItem('baymora_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    fetch('/api/notifications/prefs', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setPrefs(d);
          setPhone(d.phone || '');
        }
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/notifications/prefs', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...prefs, phone: phone || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.prefs);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(channel: 'sms' | 'whatsapp') {
    setTestStatus('Envoi...');
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      setTestStatus(res.ok ? '✓ ' + data.message : '✗ ' + (data.error || 'Erreur'));
    } catch {
      setTestStatus('✗ Erreur réseau');
    }
    setTimeout(() => setTestStatus(''), 5000);
  }

  function toggle(key: keyof NotifPrefs) {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key as keyof NotifPrefs] });
  }

  return (
    <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-secondary/70" />
          <span className="text-white/80 font-semibold text-sm">Notifications SMS / WhatsApp</span>
          {prefs?.phone && (prefs.notifSms || prefs.notifWhatsApp) && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          )}
        </div>
        <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-4">

          {/* Numéro de téléphone */}
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs">Numéro de téléphone <span className="text-white/25">(format international)</span></label>
            <Input
              type="tel"
              placeholder="+33612345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-white/8 border-white/10 text-white placeholder:text-white/20 text-sm h-9"
            />
          </div>

          {/* Canaux */}
          <div className="space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-wider">Canaux</p>
            {[
              { key: 'notifSms' as keyof NotifPrefs,       label: 'SMS',       icon: '📱' },
              { key: 'notifWhatsApp' as keyof NotifPrefs,  label: 'WhatsApp',  icon: '💬' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-white/70 text-sm">{icon} {label}</span>
                <button
                  onClick={() => toggle(key)}
                  className={`w-10 h-5.5 rounded-full transition-colors duration-200 relative ${prefs?.[key] ? 'bg-secondary' : 'bg-white/15'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${prefs?.[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Types de notifications */}
          <div className="space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-wider">Alertes</p>
            {[
              { key: 'notifFlights' as keyof NotifPrefs,    label: 'Rappels vols (J-1)',         icon: '✈️' },
              { key: 'notifCheckin' as keyof NotifPrefs,    label: 'Rappels check-in hôtel',     icon: '🏨' },
              { key: 'notifBirthdays' as keyof NotifPrefs,  label: 'Anniversaires le jour J',    icon: '🎂' },
              { key: 'notifOffers' as keyof NotifPrefs,     label: 'Offres partenaires exclusives', icon: '✨' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{icon} {label}</span>
                <button
                  onClick={() => toggle(key)}
                  className={`w-10 h-5.5 rounded-full transition-colors duration-200 relative ${prefs?.[key] ? 'bg-secondary/70' : 'bg-white/15'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${prefs?.[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="bg-secondary hover:bg-secondary/90 text-white text-xs h-8"
            >
              {saving ? 'Enregistrement...' : saved ? '✓ Sauvegardé' : <><Save className="h-3 w-3 mr-1" /> Sauvegarder</>}
            </Button>
            {prefs?.phone && prefs.notifSms && (
              <button
                onClick={() => sendTest('sms')}
                className="px-3 h-8 bg-white/8 border border-white/15 rounded-lg text-white/60 hover:text-white text-xs transition-all"
              >
                Test SMS
              </button>
            )}
            {prefs?.phone && prefs.notifWhatsApp && (
              <button
                onClick={() => sendTest('whatsapp')}
                className="px-3 h-8 bg-white/8 border border-white/15 rounded-lg text-white/60 hover:text-white text-xs transition-all"
              >
                Test WhatsApp
              </button>
            )}
          </div>
          {testStatus && (
            <p className={`text-xs ${testStatus.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
              {testStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [upcoming, setUpcoming] = useState<UpcomingAlert[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/auth?returnTo=/dashboard');
  }, [authLoading, isAuthenticated, navigate]);

  // Load recent conversations + upcoming dates
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/chat/conversations', { headers: authHeader() })
      .then(r => r.json())
      .then(d => setConversations((d.conversations || []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
    fetch('/api/users/me/upcoming', { headers: authHeader() })
      .then(r => r.json())
      .then(d => setUpcoming(d.upcoming || []))
      .catch(() => {});
  }, [isAuthenticated]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const circle = user.circle || 'decouverte';
  const msgPercent = Math.min(100, Math.round((user.messagesUsed / user.messagesLimit) * 100));
  const nextPlan = PLAN_NEXT[circle];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/chat">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Mon espace</p>
            <p className="text-white/30 text-xs mt-0.5">Baymora</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Déconnexion
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Profil header ── */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-secondary">
              {(user.prenom || user.pseudo)?.[0]?.toUpperCase() || 'B'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-white font-bold text-lg leading-tight truncate">
                {user.prenom || user.pseudo}
              </h1>
              <span className={`text-xs font-medium ${CIRCLE_COLOR[circle]}`}>
                {CIRCLE_BADGE[circle]} {CIRCLE_LABEL[circle]}
              </span>
              {user.mode === 'fantome' && (
                <span className="text-white/20 text-xs">👻 Anonyme</span>
              )}
            </div>
            {user.email && (
              <p className="text-white/30 text-xs mt-0.5 truncate">{user.email}</p>
            )}
            <p className="text-white/20 text-xs mt-1">
              Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link to="/profile" className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0">
            <Edit3 className="h-4 w-4" />
          </Link>
        </div>

        {/* ── Quick nav ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/collections" className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors text-white/60 hover:text-white/80 text-xs">
            <Bookmark className="h-3 w-3" /> Collections
          </Link>
          <Link to="/boutique" className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors text-white/60 hover:text-white/80 text-xs">
            <Star className="h-3 w-3" /> Boutique
          </Link>
          {(circle === 'prive' || circle === 'fondateur') && (
            <Link to="/salon" className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 hover:bg-amber-500/20 transition-colors text-amber-300 text-xs">
              <Crown className="h-3 w-3" /> Salon Privé
            </Link>
          )}
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: <MessageSquare className="h-4 w-4" />,
              label: 'Messages',
              value: `${user.messagesUsed}/${user.messagesLimit}`,
              sub: `${100 - msgPercent}% restants`,
              bar: true,
            },
            {
              icon: <Users className="h-4 w-4" />,
              label: 'Proches',
              value: String(user.travelCompanions?.length || 0),
              sub: 'enregistrés',
            },
            {
              icon: <Calendar className="h-4 w-4" />,
              label: 'Dates',
              value: String(user.importantDates?.length || 0),
              sub: 'importantes',
            },
          ].map(s => (
            <div key={s.label} className="bg-white/4 border border-white/10 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1.5 text-secondary/70">{s.icon}</div>
              <p className="text-white font-bold text-lg leading-none">{s.value}</p>
              <p className="text-white/30 text-xs mt-1">{s.label}</p>
              {s.bar && (
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${msgPercent}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Alertes à venir ── */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-secondary/70" /> À venir
            </h2>
            <div className="space-y-2">
              {upcoming.map((a, i) => {
                const urgency = a.daysLeft === 0 ? 'bg-red-500/10 border-red-500/25'
                  : a.daysLeft <= 1 ? 'bg-amber-500/10 border-amber-500/25'
                  : a.daysLeft <= 7 ? 'bg-secondary/10 border-secondary/25'
                  : 'bg-white/4 border-white/10';
                const when = a.daysLeft === 0 ? "Aujourd'hui !"
                  : a.daysLeft === 1 ? 'Demain'
                  : a.daysLeft <= 7 ? `Dans ${a.daysLeft} jours`
                  : `Dans ${a.daysLeft} jours`;
                const whenColor = a.daysLeft === 0 ? 'text-red-400'
                  : a.daysLeft <= 1 ? 'text-amber-300'
                  : a.daysLeft <= 7 ? 'text-secondary'
                  : 'text-white/40';
                return (
                  <div key={i} className={`border rounded-xl px-4 py-3 flex items-center justify-between ${urgency}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm">🎂 {a.label}</span>
                        <span className={`text-xs font-semibold ${whenColor}`}>{when}</span>
                      </div>
                      {a.alertWindow === 30 && (
                        <p className="text-white/25 text-xs mt-0.5">Rappel 1 mois avant</p>
                      )}
                    </div>
                    <a
                      href={a.googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-white/8 border border-white/15 text-white/60 text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/15 hover:text-white transition-all flex-shrink-0 ml-3"
                      title="Ajouter à Google Calendar"
                    >
                      <Calendar className="h-3 w-3" /> Agenda
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Logistique départ ── */}
        <LogisticsSection user={user} />

        {/* ── Plan actuel + upgrade ── */}
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-secondary" />
                <span className="text-white font-semibold text-sm">Cercle {CIRCLE_LABEL[circle]}</span>
              </div>
              {nextPlan.label ? (
                <p className="text-white/40 text-xs mt-1">
                  Passez au cercle {nextPlan.label} pour plus de puissance
                </p>
              ) : (
                <p className="text-secondary/70 text-xs mt-1">Vous êtes au sommet ✦</p>
              )}
            </div>
            {nextPlan.label && (
              <Link to="/chat?upgrade=1">
                <button className="bg-secondary text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-secondary/90 transition-all flex-shrink-0">
                  {nextPlan.price} →
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* ── Baymora Club ── */}
        <ClubWidget userId={user.id} />

        {/* ── Mes Voyages ── */}
        <TripsWidget />

        {/* ── Conciergerie CTA ── */}
        <Link to="/conciergerie" className="block">
          <div className="bg-gradient-to-br from-secondary/6 to-transparent border border-secondary/15 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-secondary/30 transition-all group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">👑</span>
                <span className="text-white font-semibold text-sm">Conciergerie Baymora</span>
              </div>
              <p className="text-white/35 text-xs">Voyage sur mesure, réservation exclusive, occasion spéciale…</p>
            </div>
            <ChevronRight className="h-4 w-4 text-secondary/40 group-hover:text-secondary transition-colors flex-shrink-0 ml-3" />
          </div>
        </Link>

        {/* ── Notifications ── */}
        <NotificationWidget />

        {/* ── Mes proches ── */}
        <ProchesSection user={user} onUpdate={() => window.location.reload()} />

        {/* ── Dates & occasions ── */}
        <DatesSection user={user} onUpdate={() => window.location.reload()} />

        {/* ── Conversations récentes ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-secondary/70" /> Conversations récentes
            </h2>
            <Link to="/chat" className="text-secondary/60 text-xs hover:text-secondary transition-colors">
              Nouvelle →
            </Link>
          </div>
          {loadingConvs ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white/3 border border-white/8 rounded-xl h-14 animate-pulse" />
              ))}
            </div>
          ) : conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map(c => (
                <Link key={c.id} to={`/chat?conv=${c.id}`}>
                  <div className="bg-white/4 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-white/6 transition-all group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white/80 text-sm font-medium truncate">{c.title}</p>
                        <span className="text-white/20 text-xs flex-shrink-0">{timeAgo(c.updatedAt)}</span>
                      </div>
                      {c.lastMessage && (
                        <p className="text-white/30 text-xs mt-0.5 truncate">{c.lastMessage}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-secondary/60 transition-colors flex-shrink-0 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
              <p className="text-white/25 text-sm">Aucune conversation pour l'instant.</p>
              <Link to="/chat">
                <button className="mt-2 text-secondary/60 text-xs hover:text-secondary transition-colors">
                  Commencer →
                </button>
              </Link>
            </div>
          )}
        </section>

        {/* ── Mes Collections ── */}
        <CollectionsSection circle={circle} />

        {/* ── Préférences & Profil complet ── */}
        <ProfilePreferences user={user} authHeader={authHeader} onUpdate={() => window.location.reload()} />

        {/* ── Footer ── */}
        <div className="text-center text-white/15 text-xs pb-4">
          Baymora — Votre conciergerie de voyage privée
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFIL PRÉFÉRENCES — Fiche client complète
// ═══════════════════════════════════════════════════════════════════════════════

const DIET_OPTIONS = ['Aucun', 'Végétarien', 'Végan', 'Halal', 'Casher', 'Sans gluten', 'Sans lactose', 'Pescetarien', 'Flexitarien'];
const ALLERGY_OPTIONS = ['Arachides', 'Noix', 'Fruits de mer', 'Crustacés', 'Gluten', 'Lactose', 'Œufs', 'Soja', 'Sésame', 'Sulfites'];
const TRAVEL_STYLE_OPTIONS = ['Détente', 'Aventure', 'Culture', 'Gastronomie', 'Nightlife', 'Nature', 'Shopping', 'Sport', 'Romance', 'Bien-être'];
const BUDGET_OPTIONS = ['Économique', 'Confort', 'Premium', 'Luxe', 'Sans limite'];
const TRAVEL_WITH_OPTIONS = ['Solo', 'En couple', 'En famille', 'Entre amis', 'Business'];
const MOBILITY_OPTIONS = ['Aucune restriction', 'PMR (fauteuil)', 'Mobilité réduite', 'Poussette/bébé'];
const LANGUAGE_OPTIONS = ['Français', 'Anglais', 'Espagnol', 'Italien', 'Allemand', 'Arabe', 'Mandarin', 'Japonais', 'Portugais', 'Russe'];
const PET_OPTIONS = ['Aucun', 'Chien', 'Chat', 'Autre animal'];
const SMOKING_OPTIONS = ['Non-fumeur', 'Fumeur', 'Cigare', 'Vape'];
const DRESS_CODE_OPTIONS = ['Casual', 'Smart casual', 'Chic', 'Formel / Black tie'];

// ─── Collections Section ─────────────────────────────────────────────────────

const EMOJI_PICKS = ['📌', '✈️', '🍽️', '🏨', '🎭', '🏖️', '🛍️', '🎯', '❤️', '⭐', '🗺️', '🌍', '🎉', '🏔️', '🌊', '🍷'];

const ITEM_TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  hotel: '🏨',
  activity: '🎭',
  bar: '🍸',
  shop: '🛍️',
  beach: '🏖️',
  museum: '🏛️',
  default: '📍',
};

function CollectionsSection({ circle }: { circle: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [limits, setLimits] = useState<CollectionLimits>({ maxCollections: 1, maxItems: 5 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<CollectionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📌');
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const fetchCollections = () => {
    fetch('/api/collections', { headers: authHeader() })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setCollections(d.collections || []);
          setLimits(d.limits || { maxCollections: 1, maxItems: 5 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCollections(); }, []);

  const handleCreate = () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    fetch('/api/collections', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }),
    })
      .then(r => r.json())
      .then(() => {
        setNewName('');
        setNewEmoji('📌');
        setShowForm(false);
        fetchCollections();
      })
      .catch(() => {})
      .finally(() => setCreating(false));
  };

  const handleExpand = (col: Collection) => {
    if (expandedId === col.id) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }
    setExpandedId(col.id);
    setLoadingItems(true);
    setShareUrl(null);
    fetch(`/api/collections/${col.id}`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setExpandedItems(d.items || []); })
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  };

  const handleDeleteItem = (colId: string, itemId: string) => {
    fetch(`/api/collections/${colId}/items/${itemId}`, {
      method: 'DELETE',
      headers: authHeader(),
    })
      .then(r => {
        if (r.ok) {
          setExpandedItems(prev => prev.filter(it => it.id !== itemId));
          setCollections(prev =>
            prev.map(c => c.id === colId ? { ...c, items: c.items.filter(it => it.id !== itemId) } : c)
          );
        }
      })
      .catch(() => {});
  };

  const handleShare = (colId: string) => {
    fetch(`/api/collections/${colId}/share`, {
      method: 'POST',
      headers: authHeader(),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.shareUrl) {
          setShareUrl(d.shareUrl);
          navigator.clipboard?.writeText(d.shareUrl).catch(() => {});
        }
      })
      .catch(() => {});
  };

  const usedCount = collections.length;
  const maxCount = limits.maxCollections;
  const limitLabel = maxCount === -1 ? `${usedCount} collections` : `${usedCount}/${maxCount} collection${maxCount > 1 ? 's' : ''}`;
  const limitReached = maxCount !== -1 && usedCount >= maxCount;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-secondary/70" /> Mes Collections
        </h2>
        <span className="text-white/30 text-xs">{limitLabel}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Collection cards grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {collections.map(col => {
              const itemCount = col.items?.length ?? 0;
              const isExpanded = expandedId === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => handleExpand(col)}
                  className={`bg-white/4 border rounded-xl p-3 text-left hover:bg-white/6 transition-all ${
                    isExpanded ? 'border-secondary/40 ring-1 ring-secondary/20' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{col.emoji}</span>
                    <span className="text-white/80 text-sm font-medium truncate flex-1">{col.name}</span>
                  </div>
                  <p className="text-white/30 text-xs mb-2">{itemCount} élément{itemCount !== 1 ? 's' : ''}</p>
                  {/* Preview thumbnails */}
                  {col.items && col.items.length > 0 && (
                    <div className="flex gap-1">
                      {col.items.slice(0, 4).map((it, idx) => (
                        it.photo ? (
                          <div key={idx} className="w-8 h-8 rounded-md overflow-hidden bg-white/8 flex-shrink-0">
                            <img src={it.photo} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div key={idx} className="w-8 h-8 rounded-md bg-white/8 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">{ITEM_TYPE_ICONS[it.type] || ITEM_TYPE_ICONS.default}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </button>
              );
            })}

            {/* ── New collection button ── */}
            {!limitReached && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-white/3 border border-dashed border-white/15 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-white/6 hover:border-secondary/30 transition-all text-white/40 hover:text-secondary/70 min-h-[7rem]"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Nouvelle collection</span>
              </button>
            )}
          </div>

          {/* ── Inline create form ── */}
          {showForm && (
            <div className="mt-3 bg-white/4 border border-white/10 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  className="text-2xl w-10 h-10 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                  title="Choisir emoji"
                >
                  {newEmoji}
                </button>
                <Input
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                  placeholder="Nom de la collection..."
                  className="flex-1 bg-white/6 border-white/10 text-white placeholder:text-white/25 text-sm"
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              {/* Emoji picker row */}
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_PICKS.map(em => (
                  <button
                    key={em}
                    onClick={() => setNewEmoji(em)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                      newEmoji === em ? 'bg-secondary/20 border border-secondary/40 scale-110' : 'bg-white/6 border border-white/8 hover:bg-white/10'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowForm(false); setNewName(''); setNewEmoji('📌'); }}
                  className="text-white/40 text-xs px-3 py-1.5 hover:text-white/60 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="bg-secondary text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-secondary/90 transition-all disabled:opacity-40"
                >
                  {creating ? '...' : 'Créer'}
                </button>
              </div>
            </div>
          )}

          {/* ── Expanded collection detail ── */}
          {expandedId && (
            <div className="mt-3 bg-white/4 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/80 text-sm font-semibold">
                  {collections.find(c => c.id === expandedId)?.emoji}{' '}
                  {collections.find(c => c.id === expandedId)?.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleShare(expandedId)}
                    className="flex items-center gap-1 bg-white/6 border border-white/10 text-white/50 text-xs px-2 py-1 rounded-lg hover:bg-white/10 hover:text-white/70 transition-all"
                    title="Partager"
                  >
                    <Share2 className="h-3 w-3" /> Partager
                  </button>
                  <button
                    onClick={() => { setExpandedId(null); setExpandedItems([]); setShareUrl(null); }}
                    className="text-white/30 hover:text-white/60 transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {shareUrl && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                  <span className="text-secondary/80 text-xs truncate flex-1 mr-2">{shareUrl}</span>
                  <span className="text-secondary text-xs font-medium flex-shrink-0">Copié !</span>
                </div>
              )}

              {loadingItems ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white/3 border border-white/8 rounded-lg h-16 animate-pulse" />
                  ))}
                </div>
              ) : expandedItems.length > 0 ? (
                <div className="space-y-2">
                  {expandedItems.map(item => (
                    <div key={item.id} className="bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 flex items-start gap-3">
                      {item.photo ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-white/8 flex-shrink-0">
                          <img src={item.photo} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-white/8 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">{ITEM_TYPE_ICONS[item.type] || ITEM_TYPE_ICONS.default}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/80 text-sm font-medium truncate">{item.name}</span>
                          <span className="text-white/20 text-xs flex-shrink-0">{item.type}</span>
                        </div>
                        {(item.city || item.rating) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.city && (
                              <span className="text-white/30 text-xs flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" /> {item.city}
                              </span>
                            )}
                            {item.rating && (
                              <span className="text-amber-400/70 text-xs flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 fill-current" /> {item.rating}
                              </span>
                            )}
                          </div>
                        )}
                        {item.description && (
                          <p className="text-white/25 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(expandedId, item.id); }}
                        className="text-white/20 hover:text-red-400/70 transition-colors p-1 flex-shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/20 text-xs text-center py-3">Aucun élément dans cette collection.</p>
              )}
            </div>
          )}

          {/* ── Upgrade CTA if limit reached ── */}
          {limitReached && (
            <div className="mt-3 bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">Limite atteinte</p>
                <p className="text-white/30 text-xs">Passez au plan supérieur pour plus de collections</p>
              </div>
              <Link to="/chat?upgrade=1">
                <button className="bg-secondary text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-secondary/90 transition-all flex-shrink-0">
                  Upgrade →
                </button>
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ProfilePreferences({ user, authHeader, onUpdate }: { user: any; authHeader: () => any; onUpdate: () => void }) {
  const prefs = (user.preferences || {}) as Record<string, any>;
  const [form, setForm] = useState({
    diet: prefs.diet || '',
    allergies: (prefs.allergies as string[]) || [],
    allergyOther: prefs.allergyOther || '',
    travelStyle: (prefs.travelStyle as string[]) || [],
    budgetTier: prefs.budgetTier || '',
    travelWith: prefs.travelWith || '',
    mobility: prefs.mobility || '',
    languages: (prefs.languages as string[]) || [],
    pet: prefs.pet || '',
    smoking: prefs.smoking || '',
    dressCode: prefs.dressCode || '',
    ecoConscious: prefs.ecoConscious || false,
    homeCity: prefs.homeCity || '',
    homeAddress: prefs.homeAddress || '',
    homeAirport: prefs.homeAirport || '',
    shirtSize: prefs.shirtSize || '',
    shoeSize: prefs.shoeSize || '',
    favoriteAlcohol: prefs.favoriteAlcohol || '',
    favoriteCuisine: prefs.favoriteCuisine || '',
    sleepPreference: prefs.sleepPreference || '',
    temperaturePreference: prefs.temperaturePreference || '',
    notes: prefs.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const toggleArray = (field: string, value: string) => {
    setForm(f => {
      const arr = (f as any)[field] as string[];
      return { ...f, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { ...prefs, ...form } }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); onUpdate(); }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const ChipSelect = ({ label, options, field, multi = false }: { label: string; options: string[]; field: string; multi?: boolean }) => (
    <div>
      <label className="text-white/50 text-xs font-medium mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isActive = multi ? ((form as any)[field] as string[])?.includes(opt) : (form as any)[field] === opt;
          return (
            <button key={opt} onClick={() => multi ? toggleArray(field, opt) : setForm(f => ({ ...f, [field]: isActive ? '' : opt }))}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${isActive ? 'bg-secondary/20 text-secondary border border-secondary/40' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <section>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between mb-3">
        <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-secondary/70" /> Mon profil & préférences
        </h2>
        <ChevronRight className={`h-4 w-4 text-white/30 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="bg-white/4 border border-white/10 rounded-xl p-5 space-y-5">
          <p className="text-white/30 text-xs">Plus votre profil est complet, plus les recommandations de Baymora seront précises et personnalisées.</p>

          {/* Alimentation */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">🍽️ Alimentation</h3>
            <ChipSelect label="Régime alimentaire" options={DIET_OPTIONS} field="diet" />
            <ChipSelect label="Allergies & intolérances" options={ALLERGY_OPTIONS} field="allergies" multi />
            <div>
              <label className="text-white/50 text-xs font-medium">Autre allergie / restriction</label>
              <Input value={form.allergyOther} onChange={e => setForm(f => ({ ...f, allergyOther: e.target.value }))} placeholder="Précisez..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" />
            </div>
          </div>

          {/* Voyage */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">✈️ Voyage</h3>
            <ChipSelect label="Style de voyage préféré" options={TRAVEL_STYLE_OPTIONS} field="travelStyle" multi />
            <ChipSelect label="Budget habituel" options={BUDGET_OPTIONS} field="budgetTier" />
            <ChipSelect label="Voyage généralement" options={TRAVEL_WITH_OPTIONS} field="travelWith" />
            <ChipSelect label="Mobilité" options={MOBILITY_OPTIONS} field="mobility" />
          </div>

          {/* Lifestyle */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">✨ Lifestyle</h3>
            <ChipSelect label="Langues parlées" options={LANGUAGE_OPTIONS} field="languages" multi />
            <ChipSelect label="Animal de compagnie" options={PET_OPTIONS} field="pet" />
            <ChipSelect label="Tabac" options={SMOKING_OPTIONS} field="smoking" />
            <ChipSelect label="Dress code préféré" options={DRESS_CODE_OPTIONS} field="dressCode" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.ecoConscious} onChange={e => setForm(f => ({ ...f, ecoConscious: e.target.checked }))} className="rounded" />
              <span className="text-white/50 text-xs">🌱 Sensible à l'écologie (options durables en priorité)</span>
            </div>
          </div>

          {/* Logistique */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">🏠 Logistique</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-white/50 text-xs">Ville de résidence</label><Input value={form.homeCity} onChange={e => setForm(f => ({ ...f, homeCity: e.target.value }))} placeholder="Paris" className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
              <div><label className="text-white/50 text-xs">Aéroport préféré</label><Input value={form.homeAirport} onChange={e => setForm(f => ({ ...f, homeAirport: e.target.value }))} placeholder="CDG, ORY..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
            </div>
            <div><label className="text-white/50 text-xs">Adresse domicile (pour calcul trajet aéroport)</label><Input value={form.homeAddress} onChange={e => setForm(f => ({ ...f, homeAddress: e.target.value }))} placeholder="12 rue de Rivoli, 75001 Paris" className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
          </div>

          {/* Tailles & goûts */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">👔 Tailles & goûts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="text-white/50 text-xs">Taille vêtements</label><Input value={form.shirtSize} onChange={e => setForm(f => ({ ...f, shirtSize: e.target.value }))} placeholder="M, L, 42..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
              <div><label className="text-white/50 text-xs">Pointure</label><Input value={form.shoeSize} onChange={e => setForm(f => ({ ...f, shoeSize: e.target.value }))} placeholder="42, 43..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
              <div><label className="text-white/50 text-xs">Alcool préféré</label><Input value={form.favoriteAlcohol} onChange={e => setForm(f => ({ ...f, favoriteAlcohol: e.target.value }))} placeholder="Whisky, Champagne..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
              <div><label className="text-white/50 text-xs">Cuisine préférée</label><Input value={form.favoriteCuisine} onChange={e => setForm(f => ({ ...f, favoriteCuisine: e.target.value }))} placeholder="Italienne, Japonaise..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
            </div>
          </div>

          {/* Confort */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">🛏️ Confort</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-white/50 text-xs">Préférence de sommeil</label><Input value={form.sleepPreference} onChange={e => setForm(f => ({ ...f, sleepPreference: e.target.value }))} placeholder="Oreiller ferme, calme absolu..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
              <div><label className="text-white/50 text-xs">Température préférée</label><Input value={form.temperaturePreference} onChange={e => setForm(f => ({ ...f, temperaturePreference: e.target.value }))} placeholder="Chaud, tempéré, froid..." className="bg-white/8 border-white/10 text-white mt-1 text-xs h-8" /></div>
            </div>
          </div>

          {/* Notes libres */}
          <div>
            <label className="text-white/50 text-xs font-medium">📝 Notes personnelles (tout ce que Baymora devrait savoir)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="J'ai peur en avion, je déteste attendre, j'adore les surprises..." className="w-full rounded-md border border-white/10 bg-white/8 px-3 py-2 text-white text-xs mt-1 placeholder:text-white/25" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-secondary hover:bg-secondary/90 text-black text-xs px-6">
            {saving ? 'Enregistrement...' : saved ? '✅ Enregistré !' : 'Sauvegarder mes préférences'}
          </Button>
        </div>
      )}
    </section>
  );
}
