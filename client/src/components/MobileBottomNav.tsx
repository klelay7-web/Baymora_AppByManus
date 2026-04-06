import { useLocation, Link } from "wouter";
import { Home, Compass, Sparkles, Route, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const navItems = [
  { path: "/", icon: Home, label: "Accueil", exact: true },
  { path: "/discover", icon: Compass, label: "Découvrir" },
  { path: "/chat", icon: Sparkles, label: "ARIA", isCenter: true },
  { path: "/parcours", icon: Route, label: "Parcours" },
  { path: "/profile", icon: User, label: "Profil" },
];

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  // Hide on admin/pilotage/team pages
  if (
    location.startsWith("/admin") ||
    location.startsWith("/pilotage") ||
    location.startsWith("/team")
  )
    return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient fade above nav */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#080c14] to-transparent pointer-events-none" />

      <div className="bg-[#080c14]/98 backdrop-blur-xl border-t border-white/[0.06]">
        <div
          className="flex items-end justify-around px-1"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}
        >
          {navItems.map((item) => {
            const isActive = item.exact
              ? location === item.path
              : location.startsWith(item.path);
            const Icon = item.icon;

            // ARIA center button — special treatment
            if (item.isCenter) {
              const href = isAuthenticated ? item.path : getLoginUrl();
              const Tag = isAuthenticated ? Link : "a";
              return (
                <Tag
                  key={item.path}
                  href={href}
                  className="flex flex-col items-center -mt-3 relative"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#c8a94a] shadow-[0_0_20px_rgba(200,169,74,0.4)]"
                        : "bg-[#c8a94a]/20 border border-[#c8a94a]/40"
                    }`}
                  >
                    <Icon
                      size={22}
                      className={isActive ? "text-[#080c14]" : "text-[#c8a94a]"}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </div>
                  <span
                    className={`text-[9px] mt-0.5 font-medium tracking-wider uppercase ${
                      isActive ? "text-[#c8a94a]" : "text-white/40"
                    }`}
                  >
                    {item.label}
                  </span>
                </Tag>
              );
            }

            // For profile/parcours, redirect to login if not authenticated
            const needsAuth = item.path === "/profile" || item.path === "/parcours";
            const href =
              needsAuth && !isAuthenticated ? getLoginUrl() : item.path;
            const Tag = needsAuth && !isAuthenticated ? "a" : Link;

            return (
              <Tag key={item.path} href={href} className="flex flex-col items-center py-2 px-2 relative">
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[#c8a94a] rounded-full" />
                )}
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-[#c8a94a]" : "text-white/35"
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                <span
                  className={`text-[9px] mt-0.5 font-medium tracking-wide ${
                    isActive ? "text-[#c8a94a]" : "text-white/35"
                  }`}
                >
                  {item.label}
                </span>
              </Tag>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
