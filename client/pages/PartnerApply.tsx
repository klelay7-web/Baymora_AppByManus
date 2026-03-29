import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Building2, MapPin, Mail, Phone, Globe, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PARTNER_TYPES = [
  { value: 'hotel', label: 'Hôtel / Resort' },
  { value: 'villa', label: 'Villa privée' },
  { value: 'spa', label: 'Spa / Bien-être' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'transport', label: 'Transport de luxe' },
  { value: 'activity', label: 'Activité / Expérience' },
];

export default function PartnerApply() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', type: '', city: '', address: '',
    description: '', contactName: '', contactEmail: '',
    contactPhone: '', website: '', message: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.type || !form.city || !form.contactEmail) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Une erreur est survenue.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Candidature reçue</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Merci ! Notre équipe va étudier votre dossier et vous contactera sous 72h.
            Si votre établissement correspond à nos critères, nous organiserons une visite découverte.
          </p>
          <Link to="/">
            <Button className="bg-secondary hover:bg-secondary/90 text-black font-semibold">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="text-xs text-secondary/80 font-semibold uppercase tracking-widest mb-0.5">Baymora Partenaires</div>
          <h1 className="text-white font-bold text-lg">Devenir partenaire Baymora</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1 mb-4">
            <span className="text-secondary text-xs font-semibold">Partenariat premium</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Rejoignez la sélection<br />d'excellence Baymora
          </h2>
          <p className="text-white/50 leading-relaxed">
            Baymora teste personnellement chaque établissement avant de le recommander à sa clientèle premium.
            En contrepartie, vous bénéficiez d'une visibilité exclusive et d'un système d'affiliation
            qui rembourse votre investissement.
          </p>
        </div>

        {/* Comment ça marche */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { step: '01', title: 'Candidature', desc: 'Vous soumettez votre dossier' },
            { step: '02', title: 'Test Baymora', desc: 'On découvre votre établissement (gratuit pour vous)' },
            { step: '03', title: 'Fiche & affiliation', desc: 'Votre fiche est créée, les commissions remboursent notre visite' },
          ].map(item => (
            <div key={item.step} className="bg-white/4 border border-white/8 rounded-2xl p-4 text-center">
              <div className="text-secondary font-bold text-2xl mb-2">{item.step}</div>
              <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-secondary" />
              <h3 className="text-white font-semibold">Votre établissement</h3>
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">
                Nom de l'établissement <span className="text-secondary">*</span>
              </label>
              <Input
                value={form.name}
                onChange={set('name')}
                placeholder="Hôtel de la Paix, Spa Nirvana..."
                className="bg-white/6 border-white/10 text-white placeholder:text-white/25 focus:border-secondary/50"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">
                Type d'établissement <span className="text-secondary">*</span>
              </label>
              <select
                value={form.type}
                onChange={set('type')}
                className="w-full px-3 py-2 rounded-xl bg-white/6 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary/50"
              >
                <option value="" className="bg-slate-900">Sélectionner...</option>
                {PARTNER_TYPES.map(t => (
                  <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  Ville <span className="text-secondary">*</span>
                </label>
                <Input
                  value={form.city}
                  onChange={set('city')}
                  placeholder="Saint-Tropez"
                  className="bg-white/6 border-white/10 text-white placeholder:text-white/25 focus:border-secondary/50"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Adresse
                </label>
                <Input
                  value={form.address}
                  onChange={set('address')}
                  placeholder="Avenue des Palmiers"
                  className="bg-white/6 border-white/10 text-white placeholder:text-white/25 focus:border-secondary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Description courte</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Décrivez votre établissement en quelques mots..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-white/6 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-secondary/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 flex items-center gap-1">
                <Globe className="h-3 w-3" /> Site web
              </label>
              <Input
                value={form.website}
                onChange={set('website')}
                placeholder="https://votre-site.com"
                className="bg-white/6 border-white/10 text-white placeholder:text-white/25 focus:border-secondary/50"
              />
            </div>
          </div>

          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-secondary" />
              <h3 className="text-white font-semibold">Contact responsable</h3>
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Nom complet</label>
              <Input
                value={form.contactName}
                onChange={set('contactName')}
                placeholder="Jean Dupont"
                className="bg-white/6 border-white/10 text-white placeholder:text-white/25 focus:border-secondary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  Email professionnel <span className="text-secondary">*</span>
                </label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={set('contactEmail')}
                  placeholder="contact@hotel.com"
                  className="bg-white/6 border-white/10 text-white placeholder:text-white/25 focus:border-secondary/50"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Téléphone
                </label>
                <Input
                  value={form.contactPhone}
                  onChange={set('contactPhone')}
                  placeholder="+33 6 00 00 00 00"
                  className="bg-white/6 border-white/10 text-white placeholder:text-white/25 focus:border-secondary/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-secondary" />
              <h3 className="text-white font-semibold">Votre message</h3>
            </div>
            <textarea
              value={form.message}
              onChange={set('message')}
              placeholder="Pourquoi souhaitez-vous rejoindre le partenariat Baymora ? Qu'est-ce qui rend votre établissement unique ?"
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-white/6 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-secondary/50 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary/90 text-black font-bold text-base py-6 rounded-2xl"
          >
            {loading ? 'Envoi en cours...' : 'Soumettre ma candidature →'}
          </Button>

          <p className="text-white/25 text-xs text-center">
            Votre dossier sera étudié sous 72h. Aucun engagement de votre part.
          </p>
        </form>
      </div>
    </div>
  );
}
