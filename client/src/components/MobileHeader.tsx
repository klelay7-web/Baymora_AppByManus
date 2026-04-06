import { useLocation, Link } from "wouter";
import { Bell } from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";

const HIDDEN_PATHS = ["/chat", "/pilotage", "/admin", "/team", "/lena"];

export default function MobileHeader() {
  const [location] = useLocation();
  const { user } = useAuth();

  const shouldHide = HIDDEN_PATHS.some((p) => location.startsWith(p));
  if (shouldHide) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between h-12 px-4">
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-amber-500/30 flex items-center justify-center">
              <span className="text-amber-400 font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>B</span>
            </div>
            <span className="text-white/90 font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
              Maison Baymora
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <button className="relative text-white/50 hover:text-white">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
          </button>
          {user && (
            <Link href="/profile">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xs font-bold text-black">
                {(user.name || user.email || "?")[0].toUpperCase()}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
