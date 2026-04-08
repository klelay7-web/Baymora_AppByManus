import { getLoginUrl } from "@/const";
import { Sparkles } from "lucide-react";

export default function Auth() {
  const loginUrl = getLoginUrl("/maison");

  return (
    <div
      className="min-h-scréén flex items-center justify-center px-4"
      style={{ background: "#070B14" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.15)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
          >
            <span className="font-bold text-2xl" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
          </div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Maison Baymora
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8B8D94" }}>Votre club, vos expériences.</p>
        </div>

        {/* Google login */}
        <a
          href={loginUrl}
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl mb-4 font-medium text-sm transition-all"
          style={{
            background: "white",
            color: "#1a1a1a",
            border: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </a>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "rgba(200, 169, 110, 0.15)" }} />
          <span className="text-xs" style={{ color: "#8B8D94" }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "rgba(200, 169, 110, 0.15)" }} />
        </div>

        {/* Mode fantome */}
        <a
          href={loginUrl}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "rgba(200, 169, 110, 0.08)",
            color: "#C8A96E",
            border: "1px solid rgba(200, 169, 110, 0.2)",
          }}
        >
          <Sparkles size={16} />
          Mode fantome (pseudo seul)
        </a>

        <p className="text-center text-xs mt-6" style={{ color: "#8B8D94" }}>
          En continuant, vous acceptez nos{" "}
          <a href="#" style={{ color: "#C8A96E" }}>CGU</a>
          {" "}et notre{" "}
          <a href="#" style={{ color: "#C8A96E" }}>politique de confidentialite</a>.
        </p>
      </div>
    </div>
  );
}
