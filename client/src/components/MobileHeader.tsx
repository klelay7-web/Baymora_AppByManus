import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Bell, Search } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function MobileHeader() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Hide on admin/pilotage/team/chat pages (they have their own headers)
  if (
    location.startsWith("/admin") ||
    location.startsWith("/pilotage") ||
    location.startsWith("/team") ||
    location.startsWith("/chat")
  )
    return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-[#080c14]/95 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center border border-[#c8a94a]/40 rounded-full">
              <span className="font-['Playfair_Display'] text-base text-[#c8a94a] font-semibold leading-none">
                B
              </span>
            </div>
            <span className="font-['Playfair_Display'] text-sm text-[#c8a94a] tracking-wide">
              Baymora
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-[#c8a94a] transition-colors"
            >
              <Search size={18} strokeWidth={1.5} />
            </Link>

            {isAuthenticated ? (
              <>
                <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-[#c8a94a] transition-colors relative">
                  <Bell size={18} strokeWidth={1.5} />
                  {/* Notification dot */}
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#c8a94a] rounded-full" />
                </button>
                <Link href="/profile" className="ml-1">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full border border-[#c8a94a]/30 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#c8a94a]/15 border border-[#c8a94a]/30 flex items-center justify-center">
                      <span className="text-[10px] text-[#c8a94a] font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <div className="px-3 py-1.5 bg-[#c8a94a]/15 border border-[#c8a94a]/30 text-[#c8a94a] text-[11px] font-medium tracking-wider uppercase">
                  Connexion
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
