import { Link, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SEOHead from "@/components/SEOHead";
import { useCollections } from "@/hooks/useCollections";

export default function ContentPage() {
  const [, params] = useRoute("/guide/:slug");
  const slug = params?.slug || "";
  const { user } = useAuth();
  const { isSaved, saveItem, removeItem } = useCollections();
  const saved = isSaved(slug, "inspiration");

  const { data: page, isLoading } = trpc.contentPages.getBySlug.useQuery(
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

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#070B14", color: "#F0EDE6" }}>
        <p className="text-white/60 mb-4">Ce guide n'est pas disponible.</p>
        <Link href="/parcours">
          <button className="px-5 py-3 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
            Retour
          </button>
        </Link>
      </div>
    );
  }

  const estSlugs = Array.isArray(page.establishmentSlugs) ? page.establishmentSlugs as string[] : [];

  const handleBookmark = () => {
    if (saved) removeItem(slug, "inspiration");
    else saveItem({ type: "inspiration", slug, name: page.title, photo: page.heroImage || undefined, savedAt: new Date().toISOString(), tags: [page.category || "guide", page.city] });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription || page.introText?.slice(0, 155),
    image: page.heroImage,
    author: { "@type": "Organization", name: "Maison Baymora" },
    publisher: { "@type": "Organization", name: "Maison Baymora" },
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "#070B14", color: "#F0EDE6" }}>
      <SEOHead
        title={page.metaTitle || page.title}
        description={page.metaDescription || undefined}
        image={page.heroImage || undefined}
        type="article"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <div className="relative w-full" style={{ height: "40vh", maxHeight: 380, minHeight: 240 }}>
        {page.heroImage ? (
          <img src={page.heroImage} alt={page.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a1428, #14253f)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,11,20,0.3) 0%, rgba(7,11,20,0.7) 65%, #070B14 100%)" }} />

        <Link href="/parcours">
          <button className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center" style={{ zIndex: 10, background: "rgba(7,11,20,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={18} color="#F0EDE6" />
          </button>
        </Link>

        <button
          onClick={handleBookmark}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ zIndex: 10, background: "rgba(7,11,20,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <Bookmark size={16} color={saved ? "#C8A96E" : "#F0EDE6"} fill={saved ? "#C8A96E" : "none"} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6" style={{ zIndex: 10 }}>
          <div className="max-w-3xl">
            <p className="text-white/60 text-xs uppercase tracking-[0.15em] mb-2">{page.city}</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 5vw, 2.5rem)", lineHeight: 1.1, color: "#F0EDE6" }}>
              {page.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 max-w-3xl mx-auto">
        {page.introText && (
          <div className="mb-8 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            {page.introText.split("\n").map((p, i) => <p key={i} className="mb-3">{p}</p>)}
          </div>
        )}

        {page.content && (
          <div className="prose prose-invert max-w-none text-sm leading-relaxed" style={{ color: "#F0EDE6" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 className="text-lg font-bold mt-8 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#C8A96E" }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-6 mb-2" style={{ color: "#E8D5A8" }}>{children}</h3>,
                p: ({ children }) => <p className="mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>{children}</p>,
                strong: ({ children }) => <strong style={{ color: "#E8D5A8", fontWeight: 600 }}>{children}</strong>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#C8A96E", textDecoration: "underline" }}>{children}</a>,
              }}
            >
              {page.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Linked establishments */}
        {estSlugs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#C8A96E" }}>
              Les adresses mentionnées
            </h2>
            <div className="space-y-2">
              {estSlugs.map((s) => (
                <Link key={s} href={`/lieu/${s}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E" }}>📍</div>
                    <span className="text-sm" style={{ color: "#F0EDE6" }}>{s.replace(/-/g, " ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3" style={{ zIndex: 20, background: "linear-gradient(to top, rgba(7,11,20,0.98) 0%, rgba(7,11,20,0.85) 60%, rgba(7,11,20,0) 100%)" }}>
        <Link href={user ? `/maya?guide=${slug}` : `/auth?redirect=/maya&guide=${slug}`}>
          <button
            className="w-full rounded-full flex items-center justify-center gap-2 font-semibold"
            style={{ maxWidth: 520, margin: "0 auto", minHeight: 52, display: "flex", background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", boxShadow: "0 10px 30px rgba(200,169,110,0.25)", fontFamily: "'Playfair Display', serif", fontSize: "1rem" }}
          >
            <Sparkles className="w-4 h-4" />
            {user ? "Maya peut t'organiser cette expérience" : "Crée ton compte pour que Maya t'organise ça"}
          </button>
        </Link>
      </div>
    </div>
  );
}
