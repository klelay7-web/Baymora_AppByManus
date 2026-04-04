import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Lock, Star, Sparkles, Crown, ExternalLink, Phone, ChevronDown, ChevronUp, Map, X } from "lucide-react";

const gold = { background: "linear-gradient(135deg,#c8a94a 0%,#f5d87a 35%,#e4c057 65%,#f0d070 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as const;

const TYPE_EMOJI: Record<string, string> = {
  restaurant: "🍽️", hotel: "🏨", bar: "🍸", spa: "🧖", activity: "🎯", beach: "🏖️", shop: "🛍️",
};

function getPhotoUrl(name: string, type: string, city: string): string {
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(`${name} ${city} ${type}`)}`;
}

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<any>(null);
  const [error, setError] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const token = localStorage.getItem('baymora_token');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`/api/guides/${slug}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setGuide)
      .catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (!guide) return;
    document.title = guide.metaTitle || guide.title;
  }, [guide]);

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Link to="/" className="text-secondary hover:underline text-sm">← Retour</Link>
    </div>
  );

  if (!guide) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
    </div>
  );

  const mapQuery = guide.items.map((i: any) => i.name).join(', ') + ', ' + (guide.city || '');
  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapQuery)}&zoom=13`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/8 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/40 hover:text-white/70"><ArrowLeft className="w-4 h-4" /></Link>
            <div>
              <h1 className="text-white font-semibold text-sm truncate">{guide.title}</h1>
              <p className="text-white/30 text-xs">{guide.city} · {guide.totalItems} adresses · {guide.viewCount || 0} vues</p>
            </div>
          </div>
          <button onClick={() => setShowMapMobile(true)} className="lg:hidden flex items-center gap-1.5 bg-white text-slate-900 font-semibold text-xs px-4 py-2 rounded-full">
            <Map className="w-3.5 h-3.5" /> Carte
          </button>
        </div>
      </div>

      {/* SPLIT VIEW — Contenu gauche + Map droite */}
      <div className="flex max-w-7xl mx-auto" style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── GAUCHE : Contenu scrollable ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'none' }}>

          {/* Description */}
          {guide.description && <p className="text-white/35 text-sm leading-relaxed mb-4 max-w-2xl">{guide.description}</p>}

          {/* Grille de cartes photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {guide.items.map((item: any, i: number) => {
              const letter = String.fromCharCode(65 + i);
              const isExpanded = expandedItem === i;
              const photoUrl = item.photo || getPhotoUrl(item.name, item.type || 'place', guide.city || '');

              return (
                <div key={i} className={`rounded-2xl overflow-hidden border transition-all cursor-pointer ${isExpanded ? 'border-secondary/30 sm:col-span-2' : 'border-white/[0.06] hover:border-white/15'}`}
                  onClick={() => setExpandedItem(isExpanded ? null : i)}>

                  {/* Photo */}
                  <div className="relative h-48 overflow-hidden">
                    <img src={photoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/600x400/?${encodeURIComponent(item.type || 'travel')}`; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className="w-7 h-7 rounded-full bg-secondary text-slate-900 text-xs font-bold flex items-center justify-center shadow-lg">{letter}</span>
                    </div>

                    {item.rating && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="text-white text-xs font-semibold">{item.rating}</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-base">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.address && <span className="text-white/50 text-[11px] flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{item.address}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Infos sous la photo */}
                  <div className="bg-slate-900/50 px-4 py-3">
                    <p className="text-white/50 text-xs line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-secondary text-sm font-semibold">{item.price}</span>
                      {item.showBaymoraPrice && item.baymoraPrice && (
                        <span className="text-xs font-semibold" style={{ color: "#d4a843" }}>
                          <Crown className="w-3 h-3 inline mr-0.5" />Baymora : {item.baymoraPrice}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                    </div>
                  </div>

                  {/* Détail expansé */}
                  {isExpanded && (
                    <div className="bg-slate-900/30 border-t border-white/5 px-4 py-4 space-y-3">
                      {item.insiderTip && (
                        <div className="bg-amber-400/5 border border-amber-400/10 rounded-lg px-3 py-2.5">
                          <p className="text-xs text-amber-300/80"><Sparkles className="w-3 h-3 inline mr-1" /><strong>Insider</strong> — {item.insiderTip}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {item.address && (
                          <button onClick={e => { e.stopPropagation(); setShowMapMobile(true); }}
                            className="flex items-center gap-1 text-white/40 hover:text-secondary text-xs transition-colors">
                            <MapPin className="w-3 h-3" /> Voir sur la carte
                          </button>
                        )}
                        {item.bookingUrl && (
                          <a href={item.bookingUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 bg-secondary/15 border border-secondary/30 text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-secondary/25">
                            <ExternalLink className="w-3 h-3" /> Réserver
                          </a>
                        )}
                        <Link to={`/chat?prompt=${encodeURIComponent(`Réserver au ${item.name}${guide.city ? ' à ' + guide.city : ''}`)}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 bg-white/5 border border-white/10 text-white/50 text-xs px-3 py-1.5 rounded-lg hover:bg-white/10">
                          Organiser avec Baymora →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paywall */}
          {guide.locked && (
            <div className="max-w-2xl mt-4 relative">
              {[1, 2].map(n => (
                <div key={n} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl h-48 mb-3 blur-[6px]" />
              ))}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm rounded-2xl">
                <div className="text-center px-6">
                  <Lock className="w-8 h-8 text-secondary/60 mx-auto mb-3" />
                  <p className="text-white/70 font-medium mb-1">{guide.hiddenCount} adresses secrètes</p>
                  <p className="text-white/30 text-xs mb-4">
                    {guide.lockReason === "signup" ? "Créez votre profil gratuitement" : `Débloquez pour ${guide.unlockOptions?.price || "4,90€"}`}
                  </p>
                  <Link to={guide.lockReason === "signup" ? "/auth" : "/club"}
                    className="inline-flex px-6 py-2.5 rounded-full text-sm font-semibold text-slate-900" style={{ background: "linear-gradient(135deg,#c8a94a,#f5d87a,#e4c057)" }}>
                    {guide.lockReason === "signup" ? "S'inscrire" : "Débloquer"}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="py-8 text-center max-w-2xl">
            <p className="text-white/15 text-xs">Sélection Baymora · <Link to="/" className="text-secondary/40 hover:text-secondary">baymora.com</Link></p>
          </div>
        </div>

        {/* ── DROITE : Map sticky (desktop only) ── */}
        <div className="hidden lg:block w-[45%] max-w-[550px] sticky top-[57px] h-[calc(100vh-57px)] border-l border-white/8">
          <iframe
            src={mapEmbedUrl}
            width="100%" height="100%"
            style={{ border: 0 }}
            loading="lazy"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Map plein écran mobile */}
      {showMapMobile && (
        <div className="fixed inset-0 z-50 bg-slate-950 lg:hidden">
          <div className="relative w-full h-full">
            <iframe src={mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" className="w-full h-full" />
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-950/90 to-transparent p-4 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">{guide.title}</p>
              <button onClick={() => setShowMapMobile(false)} className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 pt-12 pb-4 px-4">
              <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {guide.items.map((item: any, i: number) => (
                  <button key={i} onClick={() => { setShowMapMobile(false); setExpandedItem(i); }}
                    className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 w-44 text-left hover:bg-white/20 transition-all">
                    <p className="text-white font-semibold text-xs truncate">{item.name}</p>
                    <p className="text-white/50 text-[10px]">{item.price}</p>
                    {item.rating && <p className="text-amber-400 text-[10px] mt-0.5">⭐ {item.rating}</p>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
