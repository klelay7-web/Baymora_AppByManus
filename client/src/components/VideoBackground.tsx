import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  src: string;           // URL CDN S3
  fallbackImage: string; // Image statique pour mobile lent
  overlay?: number;      // Opacité overlay sombre (0-1, défaut 0.4)
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * VideoBackground — Lecture auto, muette, boucle, pas de contrôles.
 * Sur mobile avec connexion lente → affiche fallbackImage.
 * Lazy loading : ne charge la vidéo que quand visible (IntersectionObserver).
 */
export function VideoBackground({
  src,
  fallbackImage,
  overlay = 0.4,
  className = "",
  style,
  children,
}: VideoBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Détection connexion lente (cellular ou slow-2g/2g)
  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    };
    const conn = nav.connection;
    if (conn) {
      const slowTypes = ["slow-2g", "2g"];
      if (slowTypes.includes(conn.effectiveType || "") || conn.saveData) {
        setUseFallback(true);
        return;
      }
    }
    // Sur iOS Safari, certaines vidéos autoplay sont bloquées
    // On garde la vidéo mais avec fallback en cas d'erreur
  }, []);

  // IntersectionObserver pour lazy loading
  useEffect(() => {
    if (useFallback) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [useFallback]);

  // Lecture auto quand visible
  useEffect(() => {
    if (!isVisible || !videoRef.current) return;
    videoRef.current.play().catch(() => {
      // Autoplay bloqué → fallback image
      setUseFallback(true);
    });
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* Fallback image (toujours présent, caché si vidéo active) */}
      <img
        src={fallbackImage}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          useFallback || !isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Vidéo (chargée uniquement quand visible et connexion OK) */}
      {!useFallback && isVisible && (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setUseFallback(true)}
        />
      )}

      {/* Overlay sombre */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlay }}
      />

      {/* Contenu par-dessus */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default VideoBackground;
