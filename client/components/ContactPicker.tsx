import { useState } from 'react';
import { Plus, Check, User, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Contact {
  id?: string;
  name: string;
  relationship?: string;
  diet?: string;
  birthday?: string;
  notes?: string;
}

interface Props {
  onConfirm: (selected: Contact[], newContact?: Contact) => void;
  onDismiss: () => void;
}

const RELATIONSHIP_OPTIONS = ['Meilleur(e) ami(e)', 'Conjoint(e)', 'Ami(e)', 'Famille', 'Collègue', 'Associé(e)'];
const DIET_OPTIONS = ['Végétarien', 'Vegan', 'Sans gluten', 'Halal', 'Casher', 'Aucune restriction'];

export default function ContactPicker({ onConfirm, onDismiss }: Props) {
  const { user, token } = useAuth();
  const contacts: Contact[] = user?.travelCompanions || [];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRel, setNewRel] = useState('');
  const [newDiet, setNewDiet] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedContacts = contacts.filter(c => selected.has(c.name));
    onConfirm(selectedContacts);
  };

  const handleAddAndConfirm = async () => {
    if (!newName.trim()) return;
    setSaving(true);

    const newContact: Contact = {
      name: newName.trim(),
      relationship: newRel || undefined,
      diet: newDiet || undefined,
      birthday: newBirthday || undefined,
    };

    // Sauvegarder si connecté
    if (token) {
      try {
        await fetch('/api/users/me/companions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(newContact),
        });
      } catch {}
    }

    const selectedContacts = contacts.filter(c => selected.has(c.name));
    onConfirm(selectedContacts, newContact);
    setSaving(false);
  };

  const relationBadge = (c: Contact) => {
    const parts: string[] = [];
    if (c.relationship) parts.push(c.relationship);
    if (c.diet && c.diet !== 'Aucune restriction') parts.push(c.diet.toLowerCase());
    if (c.birthday) {
      const [month, day] = c.birthday.split('-');
      const months = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
      parts.push(`anniv ${day} ${months[parseInt(month) - 1]}`);
    }
    return parts.join(' · ');
  };

  return (
    <div className="ml-11 mt-2 animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 max-w-sm">

        {!showAddForm ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-xs font-medium">Qui vient avec vous ?</p>
              <button onClick={onDismiss} className="text-white/30 hover:text-white/60">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Liste des contacts */}
            {contacts.length > 0 ? (
              <div className="space-y-2 mb-3">
                {contacts.map((c) => {
                  const isSelected = selected.has(c.name);
                  const badge = relationBadge(c);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggle(c.name)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-secondary/50 bg-secondary/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isSelected ? 'bg-secondary text-white' : 'bg-white/10 text-white/50'
                      }`}>
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : c.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                          {c.name}
                        </p>
                        {badge && <p className="text-white/35 text-xs truncate">{badge}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/30 text-xs mb-3 text-center py-2">
                Aucun contact enregistré pour l'instant
              </p>
            )}

            {/* Ajouter un ami */}
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/25 transition-all text-sm"
            >
              <Plus className="h-4 w-4" />
              Ajouter un ami
            </button>

            {/* Confirmer */}
            {selected.size > 0 && (
              <button
                onClick={handleConfirm}
                className="w-full mt-3 h-9 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Confirmer — {selected.size} personne{selected.size > 1 ? 's' : ''}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-xs font-medium">Ajouter un ami</p>
              <button onClick={() => setShowAddForm(false)} className="text-white/30 hover:text-white/60">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Prénom *"
                autoFocus
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
              />

              {/* Relation */}
              <div className="flex flex-wrap gap-1.5">
                {RELATIONSHIP_OPTIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRel(r === newRel ? '' : r)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      newRel === r
                        ? 'border-secondary bg-secondary/15 text-secondary'
                        : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Régime */}
              <div className="flex flex-wrap gap-1.5">
                {DIET_OPTIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNewDiet(d === newDiet ? '' : d)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      newDiet === d
                        ? 'border-secondary bg-secondary/15 text-secondary'
                        : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Anniversaire */}
              <div>
                <label className="text-white/40 text-xs mb-1 block">Anniversaire (optionnel)</label>
                <input
                  type="date"
                  value={newBirthday}
                  onChange={e => setNewBirthday(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white focus:outline-none focus:border-secondary/60"
                />
              </div>

              <button
                onClick={handleAddAndConfirm}
                disabled={!newName.trim() || saving}
                className="w-full h-9 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Ajouter et continuer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
