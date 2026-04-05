import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Share2, Clock, Phone, DollarSign, UtensilsCrossed,
  Sparkles, MapPin, Star, Eye, Play, Image, ExternalLink,
} from "lucide-react";

const gold = "#c8a94a";
const bg = "#080c14";

const FALLBACK: Record<string, string> = {
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&h=800&fit=crop",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbec6b?w=1200&h=800&fit=crop",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop",
  activity: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop",
};
const TYPE_LABEL: Record<string, string> = {
  restaurant: "Restaurant", hotel: "Hôtel", bar: "Bar & Lounge", spa: "Spa & Bien-être",
  beach: "Plage", activity: "Activité", club: "Club", shop: "Boutique",
};
const priceLabel = (n: number) => "€".repeat(Math.max(1, Math.min(n, 4)));

export default function EstablishmentPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [v, setV] = useState<any>(null);
  const [err, setErr] = useState(false);
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState<"photos" | "videos">("photos");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/atlas/public/venues/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setV)
      .catch(() => setErr(true));
  }, [id]);

  if (err) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <p className="text-white/60 text-lg mb-4">Établissement introuvable</p>
        <button onClick={() => nav(-1)} className="text-sm px-4 py-2 rounded-full border border-white/20 text-white/80 hover:bg-white/5">Retour</button>
      </div>
    </div>
  );
  if (!v) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
    </div>
  );

  const photos: string[] = Array.isArray(v.photos) && v.photos.length ? v.photos : [FALLBACK[v.type] || FALLBACK.restaurant];
  const videos: any[] = typeof v.videos === "object" && !Array.isArray(v.videos) ? (v.videos?.tiktok || []) : Array.isArray(v.videos) ? v.videos : [];
  const hours = typeof v.openingHours === "object" && v.openingHours ? v.openingHours : null;
  const tags: string[] = Array.isArray(v.tags) ? v.tags : [];

  const share = () => navigator.share?.({ title: v.name, url: location.href }).catch(() => {
    navigator.clipboard.writeText(location.href);
  });

  return (
    <div className="min-h-screen" style={{ background: bg, color: "#fff" }}>
      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: "55vh", minHeight: 360 }}>
        <img src={photos[0]} alt={v.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #080c14 0%, #080c14aa 30%, transparent 60%)" }} />
        <button onClick={() => nav(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition">
          <ArrowLeft size={20} />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setLiked(!liked)} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition">
            <Heart size={20} fill={liked ? gold : "none"} color={liked ? gold : "#fff"} />
          </button>
          <button onClick={share} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition">
            <Share2 size={20} />
          </button>
        </div>
        <div className="absolute bottom-6 left-0 right-0 px-5 md:px-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: `${gold}22`, color: gold, border: `1px solid ${gold}44` }}>
              {TYPE_LABEL[v.type] || v.type}
            </span>
            {v.priceLevel > 0 && <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80">{priceLabel(v.priceLevel)}</span>}
            {v.rating && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/90 flex items-center gap-1">
                <Star size={12} fill={gold} color={gold} />{v.rating.toFixed(1)}
              </span>
            )}
            {v.testedByBaymora && <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: `${gold}33`, color: gold }}>Testé Baymora ✓</span>}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{v.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-white/50 text-sm">
            <span className="flex items-center gap-1"><MapPin size={14} />{v.address ? `${v.address}, ` : ""}{v.city}</span>
            <span className="flex items-center gap-1"><Eye size={14} />Vue {Math.floor(Math.random() * 800 + 200)} fois</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 md:px-8 pb-20">
        {/* ─── QUICK INFO ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-4 relative z-10 mb-10">
          {[
            { icon: Clock, label: "Horaires", value: hours ? (Object.values(hours)[0] as string || "Voir fiche") : "Non renseigné" },
            { icon: Phone, label: "Téléphone", value: v.phone || "—" },
            { icon: DollarSign, label: "Budget", value: v.priceFrom ? `Dès ${v.priceFrom}${v.currency === "EUR" ? "€" : v.currency}` : priceLabel(v.priceLevel) },
            { icon: UtensilsCrossed, label: "Type", value: v.ambiance || TYPE_LABEL[v.type] || v.type },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-4 backdrop-blur" style={{ background: "#0f1520", border: "1px solid #1a2030" }}>
              <c.icon size={18} color={gold} className="mb-2" />
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{c.label}</p>
              <p className="text-sm text-white/90 truncate">{c.value}</p>
            </div>
          ))}
        </div>

        {/* ─── DESCRIPTION ───────────────────────────────────────────── */}
        {v.description && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: gold }}>À propos</h2>
            <p className="text-white/70 leading-relaxed text-[15px] whitespace-pre-line">{v.description}</p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((t: string, i: number) => <span key={i} className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/50">#{t}</span>)}
              </div>
            )}
          </section>
        )}

        {/* ─── INSIDER TIPS ──────────────────────────────────────────── */}
        {v.insiderTips && (
          <section className="mb-10 rounded-xl p-5" style={{ background: "#1a150a", border: `1px solid ${gold}33` }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", color: gold }}>
              <Sparkles size={18} /> Tips d'initiés
            </h2>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{v.insiderTips}</p>
          </section>
        )}

        {/* ─── PHOTOS / VIDEOS ───────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
            {[{ k: "photos" as const, icon: Image, label: "Photos" }, { k: "videos" as const, icon: Play, label: "Vidéos" }].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`flex items-center gap-2 pb-2 text-sm font-medium transition ${tab === t.k ? "border-b-2" : "text-white/40"}`}
                style={tab === t.k ? { borderColor: gold, color: gold } : {}}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </div>
          {tab === "photos" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photos.map((p: string, i: number) => (
                <img key={i} src={p} alt={`${v.name} ${i + 1}`} className="rounded-lg w-full h-40 object-cover hover:scale-[1.02] transition" />
              ))}
            </div>
          ) : videos.length ? (
            <div className="space-y-3">
              {videos.map((vid: any, i: number) => (
                <a key={i} href={typeof vid === "string" ? vid : vid.url} target="_blank" rel="noopener"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition" style={{ border: "1px solid #1a2030" }}>
                  <Play size={20} color={gold} /><span className="text-sm text-white/80">{typeof vid === "string" ? vid : vid.title || `Vidéo ${i + 1}`}</span>
                  <ExternalLink size={14} className="ml-auto text-white/30" />
                </a>
              ))}
            </div>
          ) : <p className="text-white/30 text-sm">Aucune vidéo pour le moment.</p>}
        </section>

        {/* ─── REVIEW / SEASONAL NOTES ───────────────────────────────── */}
        {v.seasonalNotes && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: gold }}>L'avis Baymora</h2>
            <div className="rounded-xl p-5 text-white/70 text-sm leading-relaxed whitespace-pre-line" style={{ background: "#0f1520", border: "1px solid #1a2030" }}>
              {v.seasonalNotes}
            </div>
          </section>
        )}

        {/* ─── CTA ───────────────────────────────────────────────────── */}
        <section className="mb-10 flex flex-col sm:flex-row gap-3">
          {v.affiliateUrl && (
            <a href={v.affiliateUrl} target="_blank" rel="noopener"
              className="flex-1 text-center py-3 rounded-xl font-semibold text-sm transition hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${gold}, #f5d87a)`, color: "#080c14" }}>
              Réserver
            </a>
          )}
          <button onClick={() => nav(`/chat?prompt=Organise ma soirée au ${v.name} à ${v.city}`)}
            className="flex-1 text-center py-3 rounded-xl font-semibold text-sm transition hover:bg-white/10"
            style={{ border: `1px solid ${gold}`, color: gold }}>
            Organiser avec Baymora
          </button>
        </section>

        {/* ─── MAP ───────────────────────────────────────────────────── */}
        {v.address && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: gold }}>Localisation</h2>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a2030" }}>
              <iframe title="map" width="100%" height="280" style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${v.address}, ${v.city}`)}&output=embed&z=15`} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
