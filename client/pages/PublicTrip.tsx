import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Eye, Copy, Star, ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";

interface TripData {
  id: string;
  title: string;
  destination: string;
  duration: number;
  budget: number;
  planData: any;
  isVerified: boolean;
  verifiedPhotos: string[];
  viewCount: number;
  forkCount: number;
  usedAsTurnkey: number;
  seoSlug: string;
  shareCode: string;
  createdAt: string;
  user: { pseudo: string; prenom: string; clubPoints: number };
}

export default function PublicTrip() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/trips/public/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setTrip(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  // SEO meta tags
  useEffect(() => {
    if (!trip) return;
    document.title = `${trip.title} — Baymora`;
    const setMeta = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("og:title", trip.title);
    setMeta("og:description", `${trip.destination} · ${trip.duration} jours · ${trip.budget}€ — Parcours créé sur Baymora`);
    setMeta("og:url", window.location.href);
    setMeta("og:type", "article");
  }, [trip]);

  const handleUseTurnkey = async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) { navigate("/auth"); return; }
    const r = await fetch(`/api/trips/${trip!.id}/use-turnkey`, { method: "POST", credentials: "include" });
    if (r.ok) { const data = await r.json(); navigate(`/dashboard`); }
    else navigate("/auth");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !trip) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
      <p className="text-white/60">Parcours introuvable</p>
      <button onClick={() => navigate("/")} className="text-amber-400 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
    </div>
  );

  const days = Array.isArray(trip.planData?.days) ? trip.planData.days : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white flex items-center gap-1 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {trip.isVerified && trip.verifiedPhotos?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {trip.verifiedPhotos.map((url, i) => (
              <img key={i} src={url} alt="" className="h-40 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
        )}

        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex-1">{trip.title}</h1>
          {trip.isVerified && (
            <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" /> Verifie
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 text-sm text-white/50 mt-3">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-400" />{trip.destination}</span>
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{trip.duration} jours</span>
          <span className="flex items-center gap-1"><Star className="w-4 h-4" />{trip.budget}€</span>
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{trip.viewCount} vues</span>
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{trip.usedAsTurnkey || trip.forkCount} utilisations</span>
        </div>
      </div>

      {/* Itinerary */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold mb-4">Itineraire</h2>
        {days.length > 0 ? (
          <div className="space-y-4">
            {days.map((day: any, i: number) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-amber-400 font-medium mb-2">Jour {day.day ?? i + 1}{day.title ? ` — ${day.title}` : ""}</h3>
                {Array.isArray(day.activities) ? (
                  <ul className="space-y-1.5 text-sm text-white/70">
                    {day.activities.map((a: any, j: number) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="text-amber-400/60 mt-0.5">•</span>
                        <span>{typeof a === "string" ? a : a.name || a.description || JSON.stringify(a)}</span>
                      </li>
                    ))}
                  </ul>
                ) : day.description ? (
                  <p className="text-sm text-white/70">{day.description}</p>
                ) : (
                  <p className="text-sm text-white/40 italic">Details non disponibles</p>
                )}
              </div>
            ))}
          </div>
        ) : trip.planData ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70 whitespace-pre-wrap">
            {typeof trip.planData === "string" ? trip.planData : JSON.stringify(trip.planData, null, 2)}
          </div>
        ) : (
          <p className="text-white/40 italic">Aucun itineraire disponible</p>
        )}
      </div>

      {/* CTA buttons */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleUseTurnkey}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4" /> Utiliser ce parcours
          </button>
          <button onClick={() => navigate(`/chat?prompt=Personnaliser le parcours "${trip.title}" a ${trip.destination}`)}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white font-medium py-3 px-6 rounded-xl transition border border-white/10">
            Personnaliser
          </button>
          <button onClick={handleShare}
            className="sm:w-auto bg-white/10 hover:bg-white/15 text-white font-medium py-3 px-6 rounded-xl transition border border-white/10 flex items-center justify-center gap-2">
            <Copy className="w-4 h-4" /> {copied ? "Copie !" : "Partager"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-8 border-t border-white/10 text-center text-sm text-white/30">
        Cree par <span className="text-white/50">{trip.user.pseudo || trip.user.prenom}</span> sur Baymora &middot; Conciergerie de voyage premium
      </footer>
    </div>
  );
}
