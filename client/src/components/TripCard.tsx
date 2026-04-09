import { useState } from "react";
import { MapPin, Calendar, Users, Share2, Heart, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface TripDay {
  day: number;
  label: string;
  items: string[];
}

interface TripCardProps {
  id: string | number;
  title: string;
  destination: string;
  dates?: string;
  nights: number;
  budget?: string;
  scenario?: string; // Signature | Privilège | Prestige | Sur-Mesure
  coverImage?: string;
  days?: TripDay[];
  companions?: number;
  isPublic?: boolean;
  onShare?: () => void;
}

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const SCENARIO_COLORS: Record<string, string> = {
  "Signature": "#C8A96E",
  "Privilège": "#8B5CF6",
  "Prestige": "#10B981",
  "Sur-Mesure": "#F59E0B",
};

export default function TripCard({
  id,
  title,
  destination,
  dates,
  nights,
  budget,
  scenario,
  coverImage,
  days = [],
  companions = 0,
  isPublic = false,
  onShare,
}: TripCardProps) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const defaultImage = `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`;
  const scenarioColor = scenario ? SCENARIO_COLORS[scenario] || "#C8A96E" : "#C8A96E";

  const handleShare = () => {
    if (onShare) { onShare(); return; }
    const url = `${window.location.origin}/parcours/${id}`;
    if (navigator.share) {
      navigator.share({ title, text: `Découvrez mon parcours ${destination} sur Baymora`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast("Lien copié ✓");
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.1)" }}
    >
      {/* Cover image */}
      <div className="relative h-40">
        <img
          src={coverImage || defaultImage}
          alt={destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.9) 0%, transparent 60%)" }} />

        {/* Scenario badge */}
        {scenario && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: scenarioColor, color: "#fff" }}
          >
            {scenario}
          </div>
        )}

        {/* Public badge */}
        {isPublic && (
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs"
            style={{ background: "rgba(16,185,129,0.2)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            Public
          </div>
        )}

        {/* Title */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3
            className="text-base font-bold leading-tight"
            style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}
          >
            {title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Meta */}
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-1 text-xs" style={{ color: "#8B8D94" }}>
            <MapPin size={12} />
            {destination}
          </div>
          {dates && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "#8B8D94" }}>
              <Calendar size={12} />
              {dates}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs" style={{ color: "#8B8D94" }}>
            <Sparkles size={12} />
            {nights} nuits{budget ? ` · ${budget}` : ""}
          </div>
          {companions > 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "#8B8D94" }}>
              <Users size={12} />
              {companions + 1} voyageurs
            </div>
          )}
        </div>

        {/* Programme preview */}
        {days.length > 0 && (
          <div className="mb-3">
            <div className="space-y-1">
              {(expanded ? days : days.slice(0, 2)).map((d) => (
                <div key={d.day} className="flex gap-2 text-xs">
                  <span className="font-semibold flex-shrink-0" style={{ color: "#C8A96E", minWidth: "40px" }}>
                    J{d.day}
                  </span>
                  <span style={{ color: "#8B8D94" }}>{d.items.slice(0, 2).join(" · ")}</span>
                </div>
              ))}
            </div>
            {days.length > 2 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs mt-1"
                style={{ color: "#C8A96E" }}
              >
                {expanded ? "Voir moins" : `+${days.length - 2} jours`}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: liked ? "#C8A96E" : "#8B8D94" }}
            >
              <Heart size={15} fill={liked ? "#C8A96E" : "none"} color={liked ? "#C8A96E" : "#8B8D94"} />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#8B8D94" }}
            >
              <Share2 size={15} />
              Partager
            </button>
          </div>
          <Link href={`/parcours/${id}`}>
            <button
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }}
            >
              Voir le parcours
              <ChevronRight size={13} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
