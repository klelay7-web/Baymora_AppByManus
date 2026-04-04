import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Star, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface OffMarketItem {
  id: string; name: string; description?: string; price: number;
  photo?: string; featured?: boolean;
}

const TABS = [
  { key: 'offmarket', label: '🔒 Off-Market' },
  { key: 'immobilier', label: '🏠 Immobilier' },
  { key: 'yachts', label: '⛵ Yachts & Jets' },
  { key: 'services', label: '🛎️ Services' },
];

const GOLD = '#c8a94a';

const IMMOBILIER = [
  { emoji: '🏡', name: 'Villa Émeraude', location: 'Saint-Jean-Cap-Ferrat', price: '4,2M – 8,5M €' },
  { emoji: '🏙️', name: 'Penthouse Panorama', location: 'Paris 16e', price: '3,8M – 6,1M €' },
  { emoji: '🏰', name: 'Château de la Loire', location: 'Vallée de la Loire', price: '5,5M – 12M €' },
];

const YACHTS = [
  { emoji: '🛥️', name: 'Sunseeker 76', location: 'Monaco', price: '2 800 €/jour' },
  { emoji: '✈️', name: 'Citation Latitude', location: 'Paris → partout', price: '8 500 €/vol' },
  { emoji: '⛵', name: 'Oyster 745', location: 'Côte d\'Azur', price: '3 200 €/jour' },
];

const SERVICES = [
  { emoji: '👨‍🍳', name: 'Chef Privé', location: 'À domicile', price: '450 – 1 200 €/soirée' },
  { emoji: '🚘', name: 'Chauffeur VIP', location: 'France entière', price: '120 €/h' },
  { emoji: '🏋️', name: 'Coach Bien-être', location: 'À domicile / visio', price: '200 – 500 €/séance' },
];

const BENEFITS = [
  'Accès aux produits off-market introuvables',
  'Conciergerie humaine 7j/7',
  'Réservation yachts, jets & villas privées',
  'Immobilier de prestige sur-mesure',
];

function LuxuryCard({ emoji, name, location, price }: { emoji: string; name: string; location: string; price: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 hover:border-amber-500/30 transition-all flex flex-col">
      <div className="h-36 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <span className="text-5xl">{emoji}</span>
      </div>
      <div className="px-3 pt-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
          <Shield className="h-2.5 w-2.5" /> Exclusif Baymora
        </span>
      </div>
      <div className="p-3 pt-1.5 flex flex-col flex-1 gap-1.5">
        <p className="text-white font-semibold text-sm">{name}</p>
        <p className="text-white/40 text-xs">{location}</p>
        <p className="text-amber-400 font-bold text-xs mt-auto pt-1">{price}</p>
        <p className="text-white/20 text-[10px]">Sur demande · Disponibilité à confirmer</p>
        <button className="mt-1 w-full text-center text-[11px] font-bold px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 hover:bg-amber-500/25 transition-all">
          Contacter la conciergerie
        </button>
      </div>
    </div>
  );
}

function AccessGate() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-5 py-3 flex items-center gap-4">
        <Link to="/dashboard" className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Salon Privé</h1>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GOLD}, #a08535)` }}>
            <Lock className="h-7 w-7 text-slate-950" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ color: GOLD }}>Salon Privé</h2>
            <p className="text-white/50 text-sm">Accès réservé aux membres Privé</p>
          </div>
          <ul className="text-left space-y-2">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-start gap-2 text-white/60 text-sm">
                <Star className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-3 pt-2">
            <Link to="/auth" className="block w-full text-center font-bold text-sm px-4 py-3 rounded-xl text-slate-950 transition-all hover:brightness-110" style={{ background: `linear-gradient(135deg, ${GOLD}, #a08535)` }}>
              Passer au plan Privé — 49,90€/mois
            </Link>
            <button className="w-full text-center font-medium text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white/80 transition-all">
              Débloquer avec 2 000 points
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalonPrive() {
  const { user } = useAuth();
  const [tab, setTab] = useState('offmarket');
  const [items, setItems] = useState<OffMarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAccess = user && (user.circle === 'prive' || user.circle === 'fondateur');

  useEffect(() => {
    if (!hasAccess) return;
    fetch('/api/boutique/items?featured=true')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => setItems(data.items ?? data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hasAccess]);

  if (!hasAccess) return <AccessGate />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-5 py-3 flex items-center gap-4">
        <Link to="/dashboard" className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent animate-pulse">
          Salon Privé
        </h1>
      </div>

      <div className="border-b border-white/10 overflow-x-auto">
        <div className="flex gap-1 px-5 py-3 min-w-max">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                tab === t.key ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-white/4 border-white/10 text-white/50 hover:text-white/70'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6">
        {tab === 'offmarket' && (
          loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Lock className="h-10 w-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Nouveaux articles off-market bientôt disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map(item => (
                <div key={item.id} className="rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900 hover:border-amber-500/50 transition-all flex flex-col">
                  <div className="h-36 relative overflow-hidden bg-slate-800">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <span className="text-4xl">🔒</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
                      <Shield className="h-2.5 w-2.5" /> Exclusif Baymora
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1 gap-1">
                    <p className="text-white font-semibold text-sm line-clamp-1">{item.name}</p>
                    {item.description && <p className="text-white/45 text-xs line-clamp-2">{item.description}</p>}
                    <p className="text-amber-400 font-bold text-sm mt-auto pt-1">{item.price.toLocaleString('fr-FR')} €</p>
                    <button className="mt-1 w-full text-center text-[11px] font-bold px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 hover:bg-amber-500/25 transition-all">
                      Sur demande
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'immobilier' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {IMMOBILIER.map(c => <LuxuryCard key={c.name} {...c} />)}
          </div>
        )}

        {tab === 'yachts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {YACHTS.map(c => <LuxuryCard key={c.name} {...c} />)}
          </div>
        )}

        {tab === 'services' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICES.map(c => <LuxuryCard key={c.name} {...c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
