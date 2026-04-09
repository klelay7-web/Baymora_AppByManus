import { useState } from "react";
import { Heart, Bookmark, Share2, MapPin, Star, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const FEED_ITEMS = [
  {
    id: "feed-1",
    type: "hotel",
    name: "Le Bristol Paris",
    city: "Paris, 8ème",
    country: "France",
    image: `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
    rating: 5,
    tag: "Adresse du jour",
    tagColor: "#C8A96E",
    remise: "-20%",
    teaser: "Le palace qui accueille les présidents depuis 1925. Suite Royale avec vue sur les jardins.",
    likes: 142,
  },
  {
    id: "feed-2",
    type: "restaurant",
    name: "Septime",
    city: "Paris, 11ème",
    country: "France",
    image: `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`,
    rating: 5,
    tag: "Table secrète",
    tagColor: "#8B5CF6",
    remise: "-15%",
    teaser: "1 étoile Michelin. Menu dégustation 7 plats. Réservation impossible — sauf pour les membres Baymora.",
    likes: 89,
  },
  {
    id: "feed-3",
    type: "spa",
    name: "Six Senses Ibiza",
    city: "Ibiza",
    country: "Espagne",
    image: `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`,
    rating: 5,
    tag: "Expérience exclusive",
    tagColor: "#10B981",
    remise: "-25%",
    teaser: "Retraite wellness sur les falaises d'Ibiza. Soin signature 3h + accès hammam privatif.",
    likes: 67,
  },
];

export default function DailyFeed() {
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(FEED_ITEMS.map((i) => [i.id, i.likes]))
  );

  const saveFavoriteMutation = trpc.favorites.add.useMutation();

  const handleLike = (id: string) => {
    setLiked((prev) => {
      const isLiked = prev[id];
      setLikeCounts((c) => ({ ...c, [id]: c[id] + (isLiked ? -1 : 1) }));
      return { ...prev, [id]: !isLiked };
    });
  };

  const handleSave = (id: string) => {
    if (!saved[id]) {
      saveFavoriteMutation.mutate({ targetType: "establishment", targetId: parseInt(id.replace("feed-", "")) });
    }
    setSaved((prev) => ({ ...prev, [id]: !prev[id] }));
    toast(saved[id] ? "Retiré des favoris" : "Ajouté aux favoris ✓");
  };

  const handleShare = (item: typeof FEED_ITEMS[0]) => {
    const text = `${item.name} — ${item.city}\n${item.teaser}\n\nDécouvrez cette adresse sur Baymora : ${window.location.origin}/lieu/${item.id}`;
    if (navigator.share) {
      navigator.share({ title: item.name, text, url: `${window.location.origin}/lieu/${item.id}` });
    } else {
      navigator.clipboard.writeText(text);
      toast("Lien copié ✓");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} color="#C8A96E" />
          <h2 className="text-sm font-semibold" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>
            Adresses du jour
          </h2>
        </div>
        <Link href="/offres">
          <span className="text-xs" style={{ color: "#C8A96E" }}>Voir tout →</span>
        </Link>
      </div>

      <div className="space-y-3">
        {FEED_ITEMS.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.1)" }}
          >
            {/* Image */}
            <div className="relative h-44">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.85) 0%, transparent 60%)" }} />
              {/* Badge tag */}
              <div
                className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: item.tagColor, color: "#fff" }}
              >
                {item.tag}
              </div>
              {/* Badge remise */}
              {item.remise && (
                <div
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(200,169,110,0.9)", color: "#070B14" }}
                >
                  {item.remise} membres
                </div>
              )}
              {/* Nom en bas de l'image */}
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-base font-bold leading-tight" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>
                  {item.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} color="#8B8D94" />
                  <span className="text-xs" style={{ color: "#8B8D94" }}>{item.city}</span>
                  <div className="flex ml-2">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} size={10} fill="#C8A96E" color="#C8A96E" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="px-4 py-3">
              <p className="text-xs leading-relaxed mb-3" style={{ color: "#8B8D94" }}>
                {item.teaser}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(item.id)}
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: liked[item.id] ? "#E8D5A8" : "#8B8D94" }}
                  >
                    <Heart
                      size={16}
                      fill={liked[item.id] ? "#C8A96E" : "none"}
                      color={liked[item.id] ? "#C8A96E" : "#8B8D94"}
                    />
                    {likeCounts[item.id]}
                  </button>
                  <button
                    onClick={() => handleSave(item.id)}
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: saved[item.id] ? "#C8A96E" : "#8B8D94" }}
                  >
                    <Bookmark
                      size={16}
                      fill={saved[item.id] ? "#C8A96E" : "none"}
                      color={saved[item.id] ? "#C8A96E" : "#8B8D94"}
                    />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => handleShare(item)}
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: "#8B8D94" }}
                  >
                    <Share2 size={16} />
                    Partager
                  </button>
                </div>
                <Link href={`/lieu/${item.id}`}>
                  <button
                    className="text-xs px-4 py-1.5 rounded-full font-semibold"
                    style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }}
                  >
                    Voir la fiche
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
