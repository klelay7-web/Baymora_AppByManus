import { useState, useEffect } from "react";
import { Lock, Clock, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

// Adresse secrète du jour — change chaque jour à minuit
const getSecretOfDay = () => {
  const secrets = [
    {
      id: "secret-1",
      name: "Villa Feltrinelli",
      city: "Lac de Garde, Italie",
      image: `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`,
      teaser: "Villa privée du XIXème siècle sur le lac de Garde. 21 suites. Réservée aux membres Le Cercle.",
      privilege: "-30%",
      type: "Villa exclusive",
    },
    {
      id: "secret-2",
      name: "Aman Tokyo",
      city: "Tokyo, Japon",
      image: `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`,
      teaser: "Dernier étage du Tour Otemachi. Vue sur le Mont Fuji. Spa onsen privé. Accès Baymora uniquement.",
      privilege: "-20%",
      type: "Palace urbain",
    },
    {
      id: "secret-3",
      name: "La Mamounia",
      city: "Marrakech, Maroc",
      image: `${CDN}/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp`,
      teaser: "Le palace légendaire de Marrakech. Suite Winston Churchill. Jardins d'orangers centenaires.",
      privilege: "-25%",
      type: "Palace historique",
    },
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return secrets[dayOfYear % secrets.length];
};

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return timeLeft;
}

export default function SecretOfDay() {
  const { user } = useAuth();
  const secret = getSecretOfDay();
  const { h, m, s } = useCountdown();
  const [revealed, setRevealed] = useState(false);

  const isMember = user && (user as { plan?: string }).plan && (user as { plan?: string }).plan !== "invite";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.2)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(200,169,110,0.1)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} color="#C8A96E" />
          <span className="text-sm font-semibold" style={{ color: "#C8A96E", fontFamily: "'Playfair Display', serif" }}>
            Adresse secrète du jour
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8B8D94" }}>
          <Clock size={12} />
          <span>
            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Image avec overlay si non révélé */}
      <div className="relative h-48">
        <img
          src={secret.image}
          alt={revealed || isMember ? secret.name : "Adresse secrète"}
          className="w-full h-full object-cover"
          style={{ filter: revealed || isMember ? "none" : "blur(12px) brightness(0.4)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.9) 0%, transparent 50%)" }} />

        {/* Badge type */}
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: "rgba(200,169,110,0.9)", color: "#070B14" }}
        >
          {secret.type}
        </div>

        {/* Badge privilège */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(139,92,246,0.9)", color: "#fff" }}
        >
          {secret.privilege} Le Cercle
        </div>

        {/* Overlay lock si non membre */}
        {!revealed && !isMember && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
              style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.3)" }}
            >
              <Lock size={20} color="#C8A96E" />
            </div>
            <p className="text-xs font-semibold mb-1" style={{ color: "#C8A96E" }}>Réservé aux membres</p>
            <p className="text-xs" style={{ color: "#8B8D94" }}>Révélée dans {String(h).padStart(2,"0")}h{String(m).padStart(2,"0")}</p>
          </div>
        )}

        {/* Nom en bas */}
        {(revealed || isMember) && (
          <div className="absolute bottom-3 left-3">
            <p className="text-lg font-bold" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>
              {secret.name}
            </p>
            <p className="text-xs" style={{ color: "#8B8D94" }}>{secret.city}</p>
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="px-4 py-3">
        {revealed || isMember ? (
          <>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#8B8D94" }}>
              {secret.teaser}
            </p>
            <Link href={`/lieu/${secret.id}`}>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
              >
                Voir l'adresse complète
                <ChevronRight size={16} />
              </button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: "#8B8D94" }}>
              Une adresse exclusive révélée chaque jour — uniquement pour les membres Le Cercle.
            </p>
            <div className="flex gap-2">
              <Link href="/premium" className="flex-1">
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                >
                  Rejoindre Le Cercle
                </button>
              </Link>
              <button
                onClick={() => setRevealed(true)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
              >
                Aperçu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
