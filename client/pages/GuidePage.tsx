import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Lock, Star, Sparkles, Crown, ExternalLink, Phone, Clock, ChevronDown, ChevronUp, Map, X } from "lucide-react";

const gold = { background: "linear-gradient(135deg,#c8a94a 0%,#f5d87a 35%,#e4c057 65%,#f0d070 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as const;

const TYPE_EMOJI: Record<string, string> = {
  restaurant: "🍽️", hotel: "🏨", bar: "🍸", spa: "🧖", activity: "🎯", beach: "🏖️", shop: "🛍️", cafe: "☕",
};

// Photo Unsplash par type de lieu (images réelles HD)
function getPhotoUrl(name: string, type: string, city: string): string {
  const query = encodeURIComponent(`${name} ${city} ${type}`);
  return `https://source.unsplash.com/600x400/?${query}`;
}

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<any>(null);
  const [error, setError] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);

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
      <div className="text-center">
        <p className="text-white/50 text-lg mb-4">Guide introuvable</p>
        <Link to="/" className="text-secondary hover:underline text-sm">← Retour</Link>
      </div>
    </div>
  );

  if (!guide) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
    </div>
  );

  // Map avec tous les lieux
  const mapMarkers = guide.items
    .filter((item: any) => item.address)
    .map((item: any, i: number) => {
      const label = String.fromCharCode(65 + i);
      const loc = `${item.address}${guide.city ? `, ${guide.city}` : ''}`;
      return `markers=color:0xc8a94a%7Clabel:${label}%7C${encodeURIComponent(loc)}`;
    }).join('&');

  const mapSrc = mapMarkers
    ? `https://maps.googleapis.com/maps/api/staticmap?size=800x300&scale=2&maptype=roadmap&style=feature:all|element:geometry|color:0x1a1a2e&style=feature:all|element:labels.text.fill|color:0xcccccc&style=feature:water|color:0x0d1b2a&style=feature:road|color:0x2a2a4e&${mapMarkers}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Accueil
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={gold}>{guide.title}</h1>
        {guide.subtitle && <p className="text-white/50 text-sm mb-2">{guide.subtitle}</p>}
        {guide.description && <p className="text-white/30 text-sm leading-relaxed mb-3">{guide.description}</p>}

        <div className="flex items-center gap-3 text-xs text-white/20 mb-4">
          {guide.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-secondary" />{guide.city}</span>}
          <span>{guide.totalItems} adresses</span>
          <span>{guide.viewCount || 0} vues</span>
        </div>
      </div>

      {/* Bouton "Afficher la carte" (sticky comme Staycation) */}
      {guide.city && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-6 py-3 rounded-full shadow-2xl shadow-black/50 hover:bg-white/90 transition-all"
          >
            <Map className="w-4 h-4" /> Afficher la carte
          </button>
        </div>
      )}

      {/* Map plein écran (overlay comme Staycation) */}
      {showMap && guide.city && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(guide.items.map((i: any) => i.name).join('|') + ' ' + guide.city)}&zoom=13`}
              width="100%" height="100%"
              style={{ border: 0 }}
              loading="lazy"
              className="w-full h-full"
            />
            {/* Header avec fermer */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-950/90 to-transparent p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-sm">{guide.title}</h3>
                <p className="text-white/50 text-xs">{guide.totalItems} lieux · {guide.city}</p>
              </div>
              <button onClick={() => setShowMap(false)} className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Liste des lieux en bas */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent pt-12 pb-4 px-4">
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {guide.items.map((item: any, i: number) => (
                  <a key={i} href={`https://maps.google.com/?q=${encodeURIComponent(item.name + ' ' + (item.address || guide.city))}`} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 w-48 hover:bg-white/20 transition-all">
                    <p className="text-white font-semibold text-xs truncate">{item.name}</p>
                    <p className="text-white/50 text-[10px] truncate">{item.address || guide.city}</p>
                    {item.rating && <p className="text-amber-400 text-[10px] mt-1">⭐ {item.rating}</p>}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items — Fiches magazine avec photos */}
      <div className="max-w-3xl mx-auto px-4 py-2 space-y-4">
        {guide.items.map((item: any, i: number) => {
          const letter = String.fromCharCode(65 + i);
          const isExpanded = expandedItem === i;
          const photoUrl = item.photo || getPhotoUrl(item.name, item.type || 'place', guide.city || '');

          return (
            <div key={i}
              className={`border rounded-2xl overflow-hidden transition-all cursor-pointer ${isExpanded ? 'border-secondary/30' : 'border-white/[0.06] hover:border-white/15'}`}
              onClick={() => setExpandedItem(isExpanded ? null : i)}
            >
              {/* Photo + overlay */}
              <div className="relative h-44 sm:h-52 overflow-hidden">
                <img src={photoUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/600x400/?${encodeURIComponent(item.type || 'travel')}`; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Badge numéro */}
                <div className="absolute top-3 left-3">
                  <span className="w-8 h-8 rounded-full bg-secondary text-slate-900 text-sm font-bold flex items-center justify-center shadow-lg">{letter}</span>
                </div>

                {/* Rating */}
                {item.rating && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-white text-xs font-semibold">{item.rating}</span>
                  </div>
                )}

                {/* Infos sur la photo */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-bold text-white text-lg">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.address && <span className="text-white/60 text-xs flex items-center gap-0.5"><MapPin className="w-3 h-3" />{item.address}</span>}
                    {item.price && <span className="text-secondary text-xs font-semibold">{item.price}</span>}
                  </div>
                </div>
              </div>

              {/* Détail expansé — le magazine */}
              {isExpanded && (
                <div className="border-t border-white/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  {/* Description longue */}
                  {item.description && (
                    <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                  )}

                  {/* Adresse + contact */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {item.address && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(item.address + (guide.city ? ', ' + guide.city : ''))}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-white/40 hover:text-secondary transition-colors"
                        onClick={e => e.stopPropagation()}>
                        <MapPin className="w-3 h-3" /> {item.address}
                      </a>
                    )}
                    {item.phone && (
                      <a href={`tel:${item.phone}`} className="flex items-center gap-1 text-white/40 hover:text-secondary"
                        onClick={e => e.stopPropagation()}>
                        <Phone className="w-3 h-3" /> {item.phone}
                      </a>
                    )}
                    {item.hours && (
                      <span className="flex items-center gap-1 text-white/30">
                        <Clock className="w-3 h-3" /> {item.hours}
                      </span>
                    )}
                  </div>

                  {/* Prix + prix Baymora */}
                  <div className="flex items-center gap-3">
                    {item.price && <span className="text-white/40 text-sm">{item.price}</span>}
                    {item.showBaymoraPrice && item.baymoraPrice && (
                      <span className="text-sm font-semibold" style={{ color: "#d4a843" }}>
                        <Crown className="w-3 h-3 inline mr-0.5" />Prix Baymora : {item.baymoraPrice}
                      </span>
                    )}
                  </div>

                  {/* Insider tip */}
                  {item.insiderTip && (
                    <div className="bg-amber-400/5 border border-amber-400/10 rounded-lg px-4 py-3">
                      <p className="text-xs text-amber-300/80 leading-relaxed">
                        <Sparkles className="w-3 h-3 inline mr-1.5" />
                        <span className="font-semibold">Conseil insider</span> — {item.insiderTip}
                      </p>
                    </div>
                  )}

                  {/* Anecdote / histoire */}
                  {item.story && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3">
                      <p className="text-xs text-white/40 leading-relaxed italic">"{item.story}"</p>
                    </div>
                  )}

                  {/* Lien réservation */}
                  {item.bookingUrl && (
                    <a href={item.bookingUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs font-medium px-4 py-2 rounded-lg hover:bg-secondary/25 transition-all"
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3" /> Réserver
                    </a>
                  )}

                  {/* CTA Baymora */}
                  <Link to={`/chat?prompt=${encodeURIComponent(`Je veux réserver au ${item.name}${guide.city ? ' à ' + guide.city : ''}`)}`}
                    className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-xs px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
                    onClick={e => e.stopPropagation()}>
                    Organiser avec Baymora →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Paywall — items cachés */}
      {guide.locked && (
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <div className="relative mt-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 mb-3 blur-[6px] select-none pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/10" />
                  <div><div className="h-4 bg-white/5 rounded w-40 mb-1" /><div className="h-3 bg-white/3 rounded w-64" /></div>
                </div>
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm rounded-2xl">
              <div className="text-center px-6 py-8">
                <Lock className="w-8 h-8 text-secondary/60 mx-auto mb-3" />
                <p className="text-white/70 font-medium mb-1">
                  {guide.hiddenCount} adresses secrètes vous attendent
                </p>
                <p className="text-white/30 text-xs mb-4">
                  {guide.lockReason === "signup"
                    ? "Créez votre profil gratuitement pour tout voir"
                    : `Débloquez pour ${guide.unlockOptions?.price || "4,90€"} ou ${guide.unlockOptions?.points || 500} points`}
                </p>
                <Link
                  to={guide.lockReason === "signup" ? "/auth" : "/club"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-slate-900 transition-transform hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#c8a94a,#f5d87a,#e4c057)" }}
                >
                  {guide.lockReason === "signup" ? "S'inscrire gratuitement" : "Débloquer"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-8 border-t border-white/5 text-center">
        <p className="text-white/15 text-xs">Sélection Baymora · Testée et approuvée · <Link to="/" className="text-secondary/40 hover:text-secondary">baymora.com</Link></p>
      </footer>
    </div>
  );
}
