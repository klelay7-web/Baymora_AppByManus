/**
 * ThemePage.tsx
 * Page thématique immersive — route /inspiration/:slug
 *
 * - Hero plein écran + titre Playfair + accroche cinématique
 * - 4 sections de cartes : sorties, tables, hébergement, expériences
 * - Scroll horizontal snap sur mobile, stack desktop
 * - Sticky bottom button "Personnaliser avec Maya"
 * - ThemePortal s'affiche par-dessus au premier accès du jour
 */
import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Star, Sparkles, Play, MapPin, Bookmark } from "lucide-react";
import ThemePortal, { type DoorType } from "@/components/ThemePortal";
import { useCollections } from "@/hooks/useCollections";
import SEOHead from "@/components/SEOHead";

type Establishment = {
  id: number;
  slug: string;
  name: string;
  city: string;
  category: string;
  rating: string | null;
  photos: unknown;
  heroImageUrl: string | null;
  featuredPhoto: string | null;
  signature: string | null;
  shortDescription: string | null;
};

function resolveImage(e: Establishment): string | null {
  try {
    if (Array.isArray(e.photos) && e.photos.length > 0) return e.photos[0] as string;
    if (typeof e.photos === "string" && e.photos.trim().length > 0) {
      const parsed = JSON.parse(e.photos);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    }
  } catch { /* ignore */ }
  return e.heroImageUrl || e.featuredPhoto || null;
}

function EstablishmentCard({ est }: { est: Establishment }) {
  const img = resolveImage(est);
  const rating = est.rating ? parseFloat(est.rating) : null;
  return (
    <Link href={`/lieu/${est.slug}`}>
      <div
        className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer group"
        style={{
          width: 260,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,169,110,0.15)",
        }}
      >
        <div className="w-full h-40 bg-white/5 relative overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={est.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-3xl">
              {est.category[0]?.toUpperCase()}
            </div>
          )}
          {rating != null && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(7,11,20,0.75)", color: "#E8D5A8", backdropFilter: "blur(6px)" }}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>
        <div className="p-3">
          <p
            className="text-white text-sm font-semibold truncate"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {est.name}
          </p>
          <p className="text-white/50 text-xs mt-0.5 truncate">
            {est.signature || est.shortDescription || est.city}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Section({
  title,
  items,
  icon,
}: {
  title: string;
  items: Establishment[];
  icon?: React.ReactNode;
}) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-10">
      <h2
        className="mb-4 flex items-center gap-2 px-4 md:px-0"
        style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: "#F0EDE6" }}
      >
        {icon}
        {title}
      </h2>
      <div
        className="flex gap-4 overflow-x-auto pb-2 px-4 md:px-0"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map((it) => (
          <div key={it.id} style={{ scrollSnapAlign: "start" }}>
            <EstablishmentCard est={it} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ThemePage() {
  const [, params] = useRoute("/inspiration/:slug");
  const slug = params?.slug || "";
  const { user } = useAuth();
  const { isSaved, saveItem, removeItem } = useCollections();
  const { data, isLoading, error } = trpc.inspiration.getTheme.useQuery(
    { slug },
    { enabled: !!slug }
  );
  const [replayKey, setReplayKey] = useState(0);
  const [forcePortal, setForcePortal] = useState(false);
  const themeSaved = isSaved(slug, "inspiration");

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#070B14", color: "#F0EDE6" }}
      >
        <div className="animate-pulse text-sm text-white/50">Chargement…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "#070B14", color: "#F0EDE6" }}
      >
        <p className="text-white/60 mb-4">Ce thème n'est pas disponible.</p>
        <Link href="/maison">
          <button
            className="px-5 py-3 rounded-full text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #C8A96E, #E8D5A8)",
              color: "#070B14",
            }}
          >
            Retour à la Maison
          </button>
        </Link>
      </div>
    );
  }

  const { theme, sections } = data;
  const hero = theme.heroImageUrl || resolveImage((sections.hebergement[0] || sections.tables[0] || sections.sorties[0] || sections.experiences[0]) as any) || null;

  return (
    <>
      <ThemePortal
        key={`portal-${replayKey}`}
        theme={{
          slug: theme.slug + (forcePortal ? `-replay-${replayKey}` : ""),
          doorType: theme.doorType as DoorType,
          videoUrl: theme.videoUrl,
          heroImageUrl: theme.heroImageUrl,
          title: theme.title,
        }}
      />

      <SEOHead
        title={`${theme.title} — Maison Baymora`}
        description={theme.accroche?.slice(0, 155) || theme.subtitle || undefined}
        image={hero || undefined}
        type="article"
        jsonLd={{ "@context": "https://schema.org", "@type": "Article", headline: theme.title, description: theme.accroche || theme.subtitle, image: hero, author: { "@type": "Organization", name: "Maison Baymora" } }}
      />

      <div className="min-h-screen pb-28" style={{ background: "#070B14", color: "#F0EDE6" }}>
        {/* Hero */}
        <div
          className="relative w-full"
          style={{ height: "60vh", maxHeight: 680, minHeight: 380 }}
        >
          {hero ? (
            <img src={hero} alt={theme.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a1428 0%, #14253f 100%)" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,11,20,0.2) 0%, rgba(7,11,20,0.65) 65%, #070B14 100%)" }} />

          {/* Back button */}
          <Link href="/maison">
            <button
              className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                zIndex: 10,
                background: "rgba(7,11,20,0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <ArrowLeft size={18} color="#F0EDE6" />
            </button>
          </Link>

          {/* Bookmark button */}
          <button
            type="button"
            onClick={() => {
              if (themeSaved) {
                removeItem(slug, "inspiration");
              } else {
                saveItem({ type: "inspiration", slug, name: theme.title, photo: hero || undefined, savedAt: new Date().toISOString(), tags: ["inspiration", theme.city.toLowerCase()] });
              }
            }}
            className="absolute top-5 flex items-center justify-center"
            style={{
              right: theme.videoUrl ? 140 : 20,
              zIndex: 10, width: 40, height: 40, borderRadius: 20,
              background: "rgba(7,11,20,0.6)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Bookmark size={16} color={themeSaved ? "#C8A96E" : "#F0EDE6"} fill={themeSaved ? "#C8A96E" : "none"} />
          </button>

          {/* Revoir le film — discret */}
          {theme.videoUrl && (
            <button
              type="button"
              onClick={() => {
                setForcePortal(true);
                // Clear the "seen today" flag so the portal shows again
                try {
                  const keys = Object.keys(localStorage).filter((k) => k.startsWith(`baymora_theme_seen_${theme.slug}_`));
                  keys.forEach((k) => localStorage.removeItem(k));
                } catch { /* ignore */ }
                setReplayKey((k) => k + 1);
              }}
              className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs"
              style={{
                zIndex: 10,
                opacity: 0.6,
                background: "rgba(7,11,20,0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#F0EDE6",
              }}
            >
              <Play size={12} />
              Revoir le film
            </button>
          )}

          {/* Title + accroche */}
          <div
            className="absolute bottom-0 left-0 right-0 px-5 md:px-10 pb-8"
            style={{ zIndex: 10 }}
          >
            <div style={{ maxWidth: 820 }}>
              <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
                {theme.country}
              </p>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(2.2rem, 7vw, 4rem)",
                  lineHeight: 1.05,
                  color: "#F0EDE6",
                }}
              >
                {theme.title}
              </h1>
              {theme.subtitle && (
                <p
                  className="mt-2"
                  style={{
                    color: "#C8A96E",
                    fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                    fontStyle: "italic",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {theme.subtitle}
                </p>
              )}
              {theme.accroche && (
                <p
                  className="mt-4 text-white/80 max-w-2xl"
                  style={{ fontSize: "1.05rem", lineHeight: 1.6 }}
                >
                  {theme.accroche}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="pt-8">
          <Section
            title="Où sortir"
            items={sections.sorties}
            icon={<Sparkles className="w-4 h-4 text-amber-400" />}
          />
          <Section
            title="Tables remarquables"
            items={sections.tables}
          />
          <Section
            title="Se poser"
            items={sections.hebergement}
          />
          <Section
            title="Vivre l'inattendu"
            items={sections.experiences}
          />

          {/* Empty state if no rows at all */}
          {sections.sorties.length === 0 &&
            sections.tables.length === 0 &&
            sections.hebergement.length === 0 &&
            sections.experiences.length === 0 && (
              <div className="px-5 py-16 text-center">
                <MapPin className="w-10 h-10 mx-auto mb-4 text-white/30" />
                <p className="text-white/50 text-sm">
                  Les adresses de {theme.title} arrivent bientôt.
                </p>
                <p className="text-white/40 text-xs mt-2">
                  Demande à Maya de t'en révéler quelques-unes dès maintenant.
                </p>
              </div>
            )}
        </div>

        {/* Sticky CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3"
          style={{
            zIndex: 20,
            background:
              "linear-gradient(to top, rgba(7,11,20,0.98) 0%, rgba(7,11,20,0.85) 60%, rgba(7,11,20,0) 100%)",
          }}
        >
          <Link href={user ? `/maya?inspiration=${theme.slug}` : `/auth?redirect=/maya&inspiration=${theme.slug}`}>
            <button
              className="w-full rounded-full flex items-center justify-center gap-2 font-semibold transition-opacity hover:opacity-90"
              style={{
                maxWidth: 520,
                margin: "0 auto",
                minHeight: 52,
                display: "flex",
                background: "linear-gradient(135deg, #C8A96E, #E8D5A8)",
                color: "#070B14",
                boxShadow: "0 10px 30px rgba(200,169,110,0.25)",
                fontFamily: "'Playfair Display', serif",
                fontSize: "1rem",
              }}
            >
              <Sparkles className="w-4 h-4" />
              {user ? "Maya peut t'organiser cette expérience" : "Crée ton compte pour que Maya t'organise ça"}
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
