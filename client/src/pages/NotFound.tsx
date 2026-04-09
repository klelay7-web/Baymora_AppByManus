import { Link } from "wouter";
import { Sparkles, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#070B14", color: "#F0EDE6" }}
    >
      <div className="mb-8 text-center">
        <div
          className="text-4xl font-bold mb-1"
          style={{ fontFamily: "'Playfair Display', serif", color: "#C8A96E", letterSpacing: "0.08em" }}
        >
          BAYMORA
        </div>
        <div className="text-xs tracking-[0.3em] uppercase" style={{ color: "#8B8D94" }}>
          Maison de conciergerie
        </div>
      </div>

      <div className="relative mb-6">
        <div
          className="text-[120px] font-bold leading-none select-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            background: "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={32} color="#C8A96E" className="opacity-60" />
        </div>
      </div>

      <h1
        className="text-2xl font-bold mb-3 text-center"
        style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
      >
        Cette page n'existe pas
      </h1>
      <p className="text-sm text-center mb-8 max-w-xs" style={{ color: "#8B8D94", lineHeight: "1.7" }}>
        La page que vous cherchez a peut-être été déplacée ou n'existe plus.
        Laissez Maya vous guider vers votre prochaine expérience.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link href="/" className="flex-1">
          <button
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            <Home size={16} />
            Accueil
          </button>
        </Link>
        <Link href="/maya" className="flex-1">
          <button
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }}
          >
            <Sparkles size={16} />
            Parler à Maya
          </button>
        </Link>
      </div>

      <div className="mt-16 text-xs" style={{ color: "rgba(139,141,148,0.4)" }}>
        © 2026 Maison Baymora
      </div>
    </div>
  );
}
