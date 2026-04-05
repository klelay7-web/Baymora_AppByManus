import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, ExternalLink, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface BoutiqueItem {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  photo?: string;
  tags?: string[];
  affiliateUrl?: string;
  featured?: boolean;
  giftSuggestion?: string;
}

const CATEGORIES = [
  'Tout', 'Spiritueux', 'Cigares', 'Montres', 'Fleurs',
  'Mode', 'Beauté', 'Expériences', 'Gastronomie',
];

export default function BoutiquePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<BoutiqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tout');

  useEffect(() => {
    fetch('/api/boutique/items')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => setItems(data.items ?? data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'Tout'
    ? items
    : items.filter(i => i.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-5 py-3 flex items-center gap-4">
        <Link to="/" className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Boutique Baymora</h1>
      </div>

      {/* Category tabs */}
      <div className="border-b border-white/10 overflow-x-auto">
        <div className="flex gap-1 px-5 py-3 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeTab === cat
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-white/4 border-white/10 text-white/50 hover:text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-5 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Star className="h-10 w-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucun produit dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className={`rounded-2xl overflow-hidden border transition-all bg-slate-900 hover:border-white/20 flex flex-col ${
                  item.featured
                    ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                    : 'border-white/10'
                }`}
              >
                {/* Image */}
                <div className="h-40 relative overflow-hidden bg-slate-800">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Star className="h-8 w-8 text-white/10" />
                    </div>
                  )}
                  {item.featured && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
                      <Star className="h-2.5 w-2.5" /> Sélection
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col flex-1 gap-1.5">
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight line-clamp-1">{item.name}</p>
                    {item.brand && (
                      <p className="text-white/40 text-xs">{item.brand}</p>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-white/45 text-xs leading-relaxed line-clamp-2">{item.description}</p>
                  )}

                  {item.giftSuggestion && (
                    <div className="flex items-start gap-1 text-amber-400/70 text-[10px]">
                      <Gift className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{item.giftSuggestion}</span>
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                    <p className="text-amber-400 font-bold text-sm">
                      {item.price.toLocaleString('fr-FR')}{item.currency ?? '€'}
                    </p>
                    {item.affiliateUrl ? (
                      <a
                        href={item.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/35 text-amber-400 text-[10px] font-bold px-2.5 py-1.5 rounded-xl hover:bg-amber-500/25 transition-all flex-shrink-0"
                      >
                        Acheter <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span className="text-white/20 text-[10px] italic">Bientôt</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
