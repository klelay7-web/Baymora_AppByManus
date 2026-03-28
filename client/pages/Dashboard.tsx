import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users, Calendar, Sparkles, ChevronRight, LogOut, Crown, Edit3, Bell, Home, Plane, CheckCircle2, Circle, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeader() {
  const token = localStorage.getItem('baymora_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CIRCLE_LABEL: Record<string, string> = {
  decouverte: 'Découverte',
  essentiel: 'Essentiel',
  elite: 'Élite',
  prive: 'Privé',
  fondateur: 'Fondateur',
};

const CIRCLE_BADGE: Record<string, string> = {
  decouverte: '○',
  essentiel: '✦',
  elite: '✦✦',
  prive: '✦✦✦',
  fondateur: '✦✦✦✦',
};

const CIRCLE_COLOR: Record<string, string> = {
  decouverte: 'text-white/40',
  essentiel: 'text-secondary',
  elite: 'text-secondary',
  prive: 'text-amber-300',
  fondateur: 'text-amber-200',
};

const PLAN_NEXT: Record<string, { label: string; circle: string; price: string }> = {
  decouverte: { label: 'Essentiel', circle: 'essentiel', price: '29€/mois' },
  essentiel: { label: 'Élite', circle: 'elite', price: '99€/mois' },
  elite: { label: 'Privé', circle: 'prive', price: '299€/mois' },
  prive: { label: '', circle: '', price: '' },
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

        {/* ── Préférences ── */}
        {user.preferences && Object.keys(user.preferences).length > 0 && (
          <section>
            <h2 className="text-white/80 font-semibold text-sm flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-secondary/70" /> Ce que Baymora sait de vous
            </h2>
            <div className="bg-white/4 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(user.preferences as Record<string, any>).map(([key, val]) => {
                  if (!val || (Array.isArray(val) && val.length === 0)) return null;
                  const display = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val);
                  const labels: Record<string, string> = {
                    travelStyle: 'Style', diet: 'Régime', pets: 'Animal', children: 'Enfants',
                    budgetTier: 'Budget', travelWith: 'Voyage', ecoConscious: 'Éco',
                    mentionedDestinations: 'Destinations',
                  };
                  return (
                    <span key={key} className="bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-xs text-white/50">
                      <span className="text-white/30">{labels[key] || key}:</span> {display}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <div className="text-center text-white/15 text-xs pb-4">
          Baymora — Votre conciergerie de voyage privée
        </div>
      </div>
    </div>
  );
}
