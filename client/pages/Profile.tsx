import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Check, User, MapPin, Wallet, Users, PawPrint, Globe, Sparkles } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  pseudonym: string;
  travelStyle: string[];
  budgetRange: string;
  groupType: string;
  hasPet: boolean;
  hasChildren: boolean;
  childrenAges: string;
  accessibility: string[];
  favoriteRegions: string[];
  activities: string[];
  cuisine: string[];
  pace: string;
}

const STEPS = ['Identité', 'Style', 'Budget', 'Groupe', 'Préférences', 'Confirmation'];

// ─── Composants de sélection ──────────────────────────────────────────────────

function ChoiceCard({ label, selected, onClick, icon }: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${
        selected
          ? 'border-secondary bg-secondary/10 text-secondary'
          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
      }`}
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
      {selected && <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
    </button>
  );
}

function MultiChoice({ options, selected, onChange }: {
  options: { label: string; value: string; icon?: string }[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    );
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(o => (
        <ChoiceCard key={o.value} label={o.label} icon={o.icon} selected={selected.includes(o.value)} onClick={() => toggle(o.value)} />
      ))}
    </div>
  );
}

function SingleChoice({ options, selected, onChange }: {
  options: { label: string; value: string; icon?: string }[];
  selected: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(o => (
        <ChoiceCard key={o.value} label={o.label} icon={o.icon} selected={selected === o.value} onClick={() => onChange(o.value)} />
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    pseudonym: '',
    travelStyle: [],
    budgetRange: '',
    groupType: '',
    hasPet: false,
    hasChildren: false,
    childrenAges: '',
    accessibility: [],
    favoriteRegions: [],
    activities: [],
    cuisine: [],
    pace: '',
  });

  const update = (key: keyof ProfileData, value: any) => setProfile(p => ({ ...p, [key]: value }));

  const canNext = () => {
    if (step === 0) return true; // pseudonyme optionnel
    if (step === 1) return profile.travelStyle.length > 0;
    if (step === 2) return !!profile.budgetRange;
    if (step === 3) return !!profile.groupType;
    if (step === 4) return true; // préférences optionnelles
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const preferences: Record<string, any> = {};

      if (profile.travelStyle.length) preferences.travelStyle = profile.travelStyle;
      if (profile.pace) preferences.pace = profile.pace;
      if (profile.hasPet) preferences.petFriendly = true;
      if (profile.hasChildren) {
        preferences.travelsWithChildren = true;
        if (profile.childrenAges) {
          preferences.childrenAges = profile.childrenAges.split(',').map(a => parseInt(a.trim())).filter(Boolean);
        }
      }
      if (profile.activities.length) preferences.activities = profile.activities;
      if (profile.cuisine.length) preferences.cuisine = profile.cuisine;
      if (profile.favoriteRegions.length) preferences.favoriteDestinations = profile.favoriteRegions;
      if (profile.accessibility.length) preferences.accessibility = profile.accessibility;

      const budgetMap: Record<string, { min: number; max: number }> = {
        comfort: { min: 1000, max: 5000 },
        premium: { min: 5000, max: 20000 },
        luxury: { min: 20000, max: 100000 },
        unlimited: { min: 100000, max: 9999999 },
      };
      if (profile.budgetRange && budgetMap[profile.budgetRange]) {
        preferences.budget = { ...budgetMap[profile.budgetRange], currency: 'EUR' };
      }

      await fetch('/api/profile/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      await fetch('/api/profile/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (profile.pseudonym) {
        localStorage.setItem('baymora_pseudonym', profile.pseudonym);
      }
      localStorage.setItem('baymora_profile_done', '1');

      navigate('/chat');
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white gap-1.5 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? 'bg-secondary w-4' : i === step ? 'bg-secondary/80 w-6' : 'bg-white/15 w-1.5'
              }`}
            />
          ))}
        </div>
        <span className="text-white/30 text-xs">{step + 1} / {STEPS.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md space-y-6">

          {/* Step 0 — Identité */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-white">Votre identité</h1>
                <p className="text-white/40 text-sm">Vous pouvez rester totalement anonyme. Un pseudonyme suffit.</p>
              </div>
              <div className="space-y-2">
                <label className="text-white/60 text-sm">Pseudonyme <span className="text-white/30">(optionnel)</span></label>
                <Input
                  placeholder="ex: Le Voyageur, Nomade42, Sofia..."
                  value={profile.pseudonym}
                  onChange={e => update('pseudonym', e.target.value)}
                  className="bg-white/8 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-secondary/50"
                />
              </div>
              <div className="p-4 bg-white/4 border border-white/8 rounded-xl text-white/40 text-xs leading-relaxed">
                Baymora ne demande pas votre vrai nom. Vos données restent privées et ne sont jamais partagées entre clients.
              </div>
            </div>
          )}

          {/* Step 1 — Style */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto">
                  <Sparkles className="h-5 w-5 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-white">Votre style</h1>
                <p className="text-white/40 text-sm">Comment vous voyagez ? Plusieurs choix possibles.</p>
              </div>
              <MultiChoice
                selected={profile.travelStyle}
                onChange={v => update('travelStyle', v)}
                options={[
                  { label: 'Luxe & confort', value: 'luxury', icon: '✨' },
                  { label: 'Aventure', value: 'adventurous', icon: '🏔️' },
                  { label: 'Culture & art', value: 'cultural', icon: '🎭' },
                  { label: 'Détente totale', value: 'relaxed', icon: '🌊' },
                  { label: 'Gastronomie', value: 'gastronomy', icon: '🍽️' },
                  { label: 'Tout à la fois', value: 'mixed', icon: '🌍' },
                ]}
              />
              <div className="space-y-2">
                <p className="text-white/50 text-xs">Votre rythme préféré</p>
                <SingleChoice
                  selected={profile.pace}
                  onChange={v => update('pace', v)}
                  options={[
                    { label: 'Posé, je prends le temps', value: 'slow' },
                    { label: 'Équilibré', value: 'moderate' },
                    { label: 'Intense, je maximise', value: 'fast' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Step 2 — Budget */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto">
                  <Wallet className="h-5 w-5 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-white">Votre budget</h1>
                <p className="text-white/40 text-sm">Pour calibrer nos recommandations. Par voyage, toutes personnes.</p>
              </div>
              <SingleChoice
                selected={profile.budgetRange}
                onChange={v => update('budgetRange', v)}
                options={[
                  { label: 'Confort — 1 à 5k€', value: 'comfort', icon: '🏨' },
                  { label: 'Premium — 5 à 20k€', value: 'premium', icon: '⭐' },
                  { label: 'Luxe — 20 à 100k€', value: 'luxury', icon: '💎' },
                  { label: 'Sans limite', value: 'unlimited', icon: '🚁' },
                ]}
              />
            </div>
          )}

          {/* Step 3 — Groupe */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-white">Vous voyagez</h1>
                <p className="text-white/40 text-sm">En général, avec qui partez-vous ?</p>
              </div>
              <SingleChoice
                selected={profile.groupType}
                onChange={v => update('groupType', v)}
                options={[
                  { label: 'Seul(e)', value: 'solo', icon: '🧳' },
                  { label: 'En couple', value: 'couple', icon: '💑' },
                  { label: 'Entre amis', value: 'friends', icon: '🥂' },
                  { label: 'En famille', value: 'family', icon: '👨‍👩‍👧' },
                  { label: 'Groupe large', value: 'group', icon: '🎉' },
                  { label: 'Cela varie', value: 'varies', icon: '🔄' },
                ]}
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm flex items-center gap-2">
                    <PawPrint className="h-4 w-4" /> Avec un animal
                  </span>
                  <button
                    onClick={() => update('hasPet', !profile.hasPet)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${profile.hasPet ? 'bg-secondary' : 'bg-white/15'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 ${profile.hasPet ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm flex items-center gap-2">
                    👶 Avec des enfants
                  </span>
                  <button
                    onClick={() => update('hasChildren', !profile.hasChildren)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${profile.hasChildren ? 'bg-secondary' : 'bg-white/15'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 ${profile.hasChildren ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                {profile.hasChildren && (
                  <Input
                    placeholder="Âges des enfants (ex: 4, 8, 12)"
                    value={profile.childrenAges}
                    onChange={e => update('childrenAges', e.target.value)}
                    className="bg-white/8 border-white/10 text-white placeholder:text-white/25 text-sm"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 4 — Préférences */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto">
                  <Globe className="h-5 w-5 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-white">Vos envies</h1>
                <p className="text-white/40 text-sm">Sélectionnez tout ce qui vous correspond.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-white/50 text-xs mb-2">Régions préférées</p>
                  <MultiChoice
                    selected={profile.favoriteRegions}
                    onChange={v => update('favoriteRegions', v)}
                    options={[
                      { label: 'France', value: 'france', icon: '🇫🇷' },
                      { label: 'Méditerranée', value: 'mediterranean', icon: '🌊' },
                      { label: 'Asie', value: 'asia', icon: '🏯' },
                      { label: 'Amériques', value: 'americas', icon: '🗽' },
                      { label: 'Afrique', value: 'africa', icon: '🌍' },
                      { label: 'Partout', value: 'everywhere', icon: '✈️' },
                    ]}
                  />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-2">Activités</p>
                  <MultiChoice
                    selected={profile.activities}
                    onChange={v => update('activities', v)}
                    options={[
                      { label: 'Plage', value: 'beach', icon: '🏖️' },
                      { label: 'Randonnée', value: 'hiking', icon: '🥾' },
                      { label: 'Plongée', value: 'diving', icon: '🤿' },
                      { label: 'Golf', value: 'golf', icon: '⛳' },
                      { label: 'Yoga & Spa', value: 'wellness', icon: '🧘' },
                      { label: 'Shopping', value: 'shopping', icon: '🛍️' },
                      { label: 'Musées', value: 'museums', icon: '🏛️' },
                      { label: 'Gastronomie', value: 'gastronomy', icon: '🍾' },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5 — Confirmation */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center mx-auto">
                  <Check className="h-7 w-7 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.pseudonym ? `Bienvenue, ${profile.pseudonym}` : 'Votre profil est prêt'}
                </h1>
                <p className="text-white/40 text-sm">Baymora connaît maintenant vos préférences. Plus vous utiliserez l'assistant, plus ses recommandations seront précises.</p>
              </div>
              <div className="p-4 bg-white/4 border border-white/8 rounded-xl space-y-2">
                {profile.travelStyle.length > 0 && <p className="text-white/70 text-sm">✓ Style : <span className="text-white">{profile.travelStyle.join(', ')}</span></p>}
                {profile.budgetRange && <p className="text-white/70 text-sm">✓ Budget : <span className="text-white">{profile.budgetRange}</span></p>}
                {profile.groupType && <p className="text-white/70 text-sm">✓ Groupe : <span className="text-white">{profile.groupType}</span></p>}
                {profile.hasPet && <p className="text-white/70 text-sm">✓ <span className="text-white">Avec animal de compagnie</span></p>}
                {profile.hasChildren && <p className="text-white/70 text-sm">✓ <span className="text-white">Avec enfants</span></p>}
                {profile.activities.length > 0 && <p className="text-white/70 text-sm">✓ Activités : <span className="text-white">{profile.activities.join(', ')}</span></p>}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold py-6"
              >
                {saving ? 'Enregistrement...' : 'Commencer avec Baymora →'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div className="flex justify-between items-center px-6 pb-8 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="text-white/40 hover:text-white disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <Button
            size="sm"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="bg-secondary hover:bg-secondary/90 text-white gap-1.5 disabled:opacity-40"
          >
            {step === 4 ? 'Terminer' : 'Suivant'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
