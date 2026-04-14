/**
 * ThemePortal.tsx
 * Animation d'ouverture plein écran pour les pages thématiques immersives.
 *
 * Flow :
 * 1. Check localStorage baymora_theme_seen_{slug}_{YYYY-MM-DD}
 * 2. Si pas vu aujourd'hui → portes plein écran (z-50) → animation 1.5s
 *    → (optionnel) vidéo plein écran 8-15s → fondu → marquage vu
 * 3. Si déjà vu aujourd'hui → rien (la page est affichée directement)
 *
 * Le bouton "Passer ›" est toujours visible pendant portes + vidéo.
 * Touch/click anywhere skippe aussi sur mobile.
 */
import { useEffect, useRef, useState } from "react";

export type DoorType =
  | "beach"
  | "riad"
  | "palace"
  | "japanese"
  | "haussmann"
  | "temple"
  | "chalet"
  | "artdeco";

interface ThemePortalProps {
  theme: {
    slug: string;
    doorType: DoorType;
    videoUrl?: string | null;
    heroImageUrl?: string | null;
    title?: string;
  };
  onDone?: () => void;
}

type PortalPhase = "idle" | "doors" | "video" | "fading" | "done";

const DAILY_KEY = (slug: string) => {
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `baymora_theme_seen_${slug}_${ymd}`;
};

const DOOR_PALETTES: Record<DoorType, { bg: string; accent: string; panel: string; motif: string }> = {
  beach: {
    bg: "linear-gradient(180deg, #0b3554 0%, #1e6091 50%, #f4d9a8 100%)",
    accent: "#f0c56a",
    panel: "linear-gradient(180deg, #1c3b5a 0%, #274a6e 100%)",
    motif: "░",
  },
  riad: {
    bg: "linear-gradient(180deg, #4a1a0f 0%, #7a2e15 100%)",
    accent: "#e8b254",
    panel: "linear-gradient(180deg, #5c1e10 0%, #8a3518 100%)",
    motif: "✦",
  },
  palace: {
    bg: "linear-gradient(180deg, #0a1428 0%, #14253f 100%)",
    accent: "#E8D5A8",
    panel: "linear-gradient(180deg, #0f1a30 0%, #1a2d4a 100%)",
    motif: "♛",
  },
  japanese: {
    bg: "linear-gradient(180deg, #0a0a12 0%, #1a0f14 100%)",
    accent: "#d94646",
    panel: "linear-gradient(180deg, #141420 0%, #1f1820 100%)",
    motif: "◯",
  },
  haussmann: {
    bg: "linear-gradient(180deg, #1a1410 0%, #2a2018 100%)",
    accent: "#C8A96E",
    panel: "linear-gradient(180deg, #1f1812 0%, #32281c 100%)",
    motif: "✷",
  },
  temple: {
    bg: "linear-gradient(180deg, #0a1f15 0%, #1a3a28 100%)",
    accent: "#9ec7a3",
    panel: "linear-gradient(180deg, #0e2a1c 0%, #1e4530 100%)",
    motif: "❋",
  },
  chalet: {
    bg: "linear-gradient(180deg, #1a1a1f 0%, #2c2a28 100%)",
    accent: "#d4b180",
    panel: "linear-gradient(180deg, #221f1c 0%, #35302a 100%)",
    motif: "▲",
  },
  artdeco: {
    bg: "linear-gradient(180deg, #0a0a14 0%, #1a1a28 100%)",
    accent: "#c8a96e",
    panel: "linear-gradient(180deg, #121220 0%, #1e1e32 100%)",
    motif: "◈",
  },
};

export default function ThemePortal({ theme, onDone }: ThemePortalProps) {
  const [phase, setPhase] = useState<PortalPhase>("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<number[]>([]);

  // Decide on mount whether to play the portal or skip to done
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(DAILY_KEY(theme.slug));
    if (seen) {
      setPhase("done");
      return;
    }
    setPhase("doors");
    // After 1.5s the doors are fully open → start video or finish
    const t1 = window.setTimeout(() => {
      if (theme.videoUrl) {
        setPhase("video");
      } else {
        setPhase("fading");
        const t2 = window.setTimeout(() => finish(), 600);
        timers.current.push(t2);
      }
    }, 1500);
    timers.current.push(t1);

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.slug]);

  const finish = () => {
    try {
      localStorage.setItem(DAILY_KEY(theme.slug), "1");
    } catch {
      /* quota? ignore */
    }
    setPhase("done");
    onDone?.();
  };

  const handleSkip = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch { /* ignore */ }
    }
    setPhase("fading");
    const t = window.setTimeout(() => finish(), 300);
    timers.current.push(t);
  };

  if (phase === "done" || phase === "idle") return null;

  const palette = DOOR_PALETTES[theme.doorType] || DOOR_PALETTES.palace;
  const doorsOpen = phase !== "doors"; // open as soon as we transition away from the doors phase
  const isFading = phase === "fading";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center select-none"
      style={{
        zIndex: 50,
        background: palette.bg,
        opacity: isFading ? 0 : 1,
        transition: "opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onClick={(e) => {
        // Touch-to-dismiss on mobile only if we're past the initial door animation
        if (phase === "video") handleSkip();
        e.stopPropagation();
      }}
    >
      {/* Background hero teaser */}
      {theme.heroImageUrl && phase !== "video" && (
        <img
          src={theme.heroImageUrl}
          alt={theme.title || theme.slug}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: doorsOpen ? 0.5 : 0, transition: "opacity 800ms" }}
        />
      )}

      {/* Doors */}
      {phase === "doors" && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-end pr-6 md:pr-10"
            style={{
              background: palette.panel,
              borderRight: `2px solid ${palette.accent}`,
              transform: doorsOpen ? "translateX(-100%)" : "translateX(0)",
              transition: "transform 1500ms cubic-bezier(0.65, 0, 0.25, 1)",
              boxShadow: "inset -30px 0 60px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="text-[80px] md:text-[140px] font-thin"
              style={{ color: palette.accent, opacity: 0.8, fontFamily: "'Playfair Display', serif" }}
            >
              {palette.motif}
            </div>
          </div>
          <div
            className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-start pl-6 md:pl-10"
            style={{
              background: palette.panel,
              borderLeft: `2px solid ${palette.accent}`,
              transform: doorsOpen ? "translateX(100%)" : "translateX(0)",
              transition: "transform 1500ms cubic-bezier(0.65, 0, 0.25, 1)",
              boxShadow: "inset 30px 0 60px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="text-[80px] md:text-[140px] font-thin"
              style={{ color: palette.accent, opacity: 0.8, fontFamily: "'Playfair Display', serif" }}
            >
              {palette.motif}
            </div>
          </div>
          {theme.title && (
            <div
              className="relative text-center px-6"
              style={{
                color: "#F0EDE6",
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                textShadow: "0 2px 20px rgba(0,0,0,0.6)",
                opacity: 0.95,
              }}
            >
              {theme.title}
            </div>
          )}
        </>
      )}

      {/* Video */}
      {phase === "video" && theme.videoUrl && (
        <video
          ref={videoRef}
          src={theme.videoUrl}
          autoPlay
          muted
          playsInline
          onEnded={() => {
            setPhase("fading");
            const t = window.setTimeout(() => finish(), 600);
            timers.current.push(t);
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Skip button — always visible during doors + video */}
      {(phase === "doors" || phase === "video") && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="absolute bottom-5 right-5 px-4 py-2 rounded-full text-xs"
          style={{
            zIndex: 60,
            minHeight: 40,
            color: "rgba(255,255,255,0.85)",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          Passer ›
        </button>
      )}
    </div>
  );
}
