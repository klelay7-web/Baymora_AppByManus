import { useState, useRef } from "react";
import { Share2, Download, Copy, Sparkles, MapPin } from "lucide-react";
import { toast } from "sonner";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

interface ShareableCardProps {
  title: string;
  destination: string;
  nights: number;
  budget: string;
  highlights: string[];
  imageUrl?: string;
  memberName?: string;
}

export default function ShareableCard({
  title,
  destination,
  nights,
  budget,
  highlights,
  imageUrl,
  memberName,
}: ShareableCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const defaultImage = `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`;

  const handleShare = async () => {
    const text = [
      `✨ ${title}`,
      `📍 ${destination} · ${nights} nuits · ${budget}`,
      ``,
      highlights.slice(0, 3).map((h) => `• ${h}`).join("\n"),
      ``,
      `Planifié avec Maya — Baymora`,
      `${window.location.origin}`,
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: window.location.origin });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Texte copié — collez-le dans Instagram, WhatsApp ou par email ✓");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast("Lien copié ✓");
  };

  return (
    <div className="space-y-3">
      {/* Story Card preview */}
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden"
        style={{ aspectRatio: "9/16", maxHeight: "420px", background: "#070B14" }}
      >
        {/* Background image */}
        <img
          src={imageUrl || defaultImage}
          alt={destination}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.5 }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(7,11,20,0.97) 0%, rgba(7,11,20,0.5) 50%, rgba(7,11,20,0.3) 100%)" }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-5">
          {/* Top: Logo Baymora */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
            >
              <span className="font-bold text-xs" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#C8A96E" }}>Baymora</span>
            <div
              className="ml-auto px-2 py-0.5 rounded-full text-xs"
              style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.3)" }}
            >
              <Sparkles size={10} className="inline mr-1" />
              Maya
            </div>
          </div>

          {/* Bottom: Trip info */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={12} color="#C8A96E" />
              <span className="text-xs font-medium" style={{ color: "#C8A96E" }}>{destination}</span>
            </div>
            <h3
              className="text-xl font-bold mb-2 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
            >
              {title}
            </h3>
            <div className="flex gap-3 mb-3">
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E" }}>
                {nights} nuits
              </span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E" }}>
                {budget}
              </span>
            </div>
            <div className="space-y-1 mb-3">
              {highlights.slice(0, 3).map((h, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#C8A96E" }} />
                  <span className="text-xs" style={{ color: "rgba(240,237,230,0.7)" }}>{h}</span>
                </div>
              ))}
            </div>
            {memberName && (
              <p className="text-xs" style={{ color: "#8B8D94" }}>
                Planifié par {memberName} · Baymora
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
        >
          <Share2 size={15} />
          {copied ? "Copié !" : "Partager"}
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
        >
          <Copy size={15} />
        </button>
        <button
          onClick={() => toast("Export PDF disponible avec Le Cercle Baymora")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  );
}
