import { Link, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MapPin, Clock, Sparkles, Bookmark } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";

export default function ParcoursMaisonDetail() {
  const [, params] = useRoute("/parcours-maison/:slug");
  const slug = params?.slug || "";
  const { user } = useAuth();
  const { isSaved, saveItem, removeItem } = useCollections();
  const saved = isSaved(slug, "parcours_maison");

  const { data: parcours, isLoading } = trpc.parcoursMaison.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070B14" }}>
        <div className="animate-pulse text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</div>
      </div>
    );
  }

  if (!parcours) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#070B14", color: "#F0EDE6" }}>
        <p className="text-white/60 mb-4">Ce parcours n'est pas disponible.</p>
        <Link href="/parcours">
          <button className="px-5 py-3 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
            Retour aux parcours
          </button>
        </Link>
      </div>
    );
  }

  const steps = Array.isArray(parcours.steps) ? parcours.steps as any[] : [];
  const tags = Array.isArray(parcours.tags) ? parcours.tags as string[] : [];

  const handleBookmark = () => {
    if (saved) removeItem(slug, "parcours_maison");
    else saveItem({ type: "parcours_maison", slug, name: parcours.title, photo: parcours.coverPhoto || undefined, savedAt: new Date().toISOString(), tags });
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: "#070B14", color: "#F0EDE6" }}>
      {/* Hero */}
      <div className="relative w-full" style={{ height: "45vh", maxHeight: 420, minHeight: 260 }}>
        {parcours.coverPhoto ? (
          <img src={parcours.coverPhoto} alt={parcours.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a1428, #14253f)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,11,20,0.3) 0%, rgba(7,11,20,0.7) 65%, #070B14 100%)" }} />

        <Link href="/parcours">
          <button className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center" style={{ zIndex: 10, background: "rgba(7,11,20,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={18} color="#F0EDE6" />
          </button>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6" style={{ zIndex: 10 }}>
          <div className="max-w-3xl">
            <p className="text-white/60 text-xs uppercase tracking-[0.15em] mb-2">{parcours.city}</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 5vw, 2.5rem)", lineHeight: 1.1, color: "#F0EDE6" }}>
              {parcours.title}
            </h1>
            {parcours.subtitle && (
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{parcours.subtitle}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "#8B8D94" }}>
              {parcours.duration && <span className="flex items-center gap-1"><Clock size={12} /> {parcours.duration}</span>}
              {parcours.budgetEstimate && <span style={{ color: "#C8A96E", fontWeight: 600 }}>{parcours.budgetEstimate}</span>}
              <span>{steps.length} étapes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 pt-6 max-w-3xl mx-auto">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#C8A96E" }}>
          Les étapes
        </h2>
        <div className="space-y-3">
          {steps.map((step: any, i: number) => (
            <Link key={i} href={step.slug ? `/lieu/${step.slug}` : "#"}>
              <div
                className="flex gap-3 p-3 rounded-xl cursor-pointer group"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#F0EDE6" }}>{step.name || step.title || `Étape ${i + 1}`}</p>
                  {step.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "rgba(255,255,255,0.5)" }}>{step.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: "#8B8D94" }}>
                    {step.timeSlot && <span>{step.timeSlot}</span>}
                    {step.priceEstimate && <span style={{ color: "#C8A96E" }}>{step.priceEstimate}€/pers</span>}
                    {step.travelFromPrevious && <span className="flex items-center gap-0.5"><MapPin size={9} /> {step.travelFromPrevious}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sticky bottom CTAs */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3"
        style={{ zIndex: 20, background: "linear-gradient(to top, rgba(7,11,20,0.98) 0%, rgba(7,11,20,0.85) 60%, rgba(7,11,20,0) 100%)" }}
      >
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={handleBookmark}
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: saved ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${saved ? "rgba(200,169,110,0.4)" : "rgba(255,255,255,0.1)"}` }}
          >
            <Bookmark size={18} color={saved ? "#C8A96E" : "#F0EDE6"} fill={saved ? "#C8A96E" : "none"} />
          </button>
          <Link href={user ? `/maya?parcours_maison=${slug}` : `/auth?redirect=/maya&parcours_maison=${slug}`} className="flex-1">
            <button
              className="w-full rounded-xl flex items-center justify-center gap-2 font-semibold"
              style={{ minHeight: 48, background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", fontSize: "0.9rem" }}
            >
              <Sparkles size={16} />
              {user ? "Maya adapte ce parcours pour moi" : "Créer un compte pour personnaliser"}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
