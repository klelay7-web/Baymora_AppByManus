import { useLocation, Link } from "wouter";
import { Home, Search, Sparkles, Crown, PenTool } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const isTeamOrAdmin = user?.role === "admin" || user?.role === "team";

  const tabs = [
    { path: "/", icon: Home, label: "Maison" },
    { path: "/rechercher", icon: Search, label: "Rechercher" },
    { path: "/chat", icon: Sparkles, label: "Maya", accent: true },
    { path: "/premium", icon: Crown, label: "Premium" },
    ...(isTeamOrAdmin
      ? [{ path: "/lena-workspace", icon: PenTool, label: "Créer" }]
      : []),
  ];

  const handleMayaClick = () => {
    // Maya du bas → active Maya du haut (navigue vers /chat qui active le bouton pilule IA)
    setLocation("/chat");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/8 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.path === "/" ? location === "/" : location.startsWith(tab.path);
          const Icon = tab.icon;

          if (tab.accent) {
            return (
              <button
                key="maya"
                onClick={handleMayaClick}
                className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative"
              >
                <div className="absolute -top-5 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 border-[3px] border-[#0d0d14]">
                  <Icon size={20} className="text-black" strokeWidth={2.5} />
                </div>
                <span className="mt-8 text-[10px] text-amber-400 font-semibold tracking-wide">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link key={tab.path} href={tab.path}>
              <button className="flex flex-col items-center justify-center gap-0.5 w-16 h-full">
                <Icon
                  size={20}
                  className={isActive ? "text-amber-400" : "text-white/35"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span
                  className={`text-[10px] tracking-wide ${
                    isActive ? "text-amber-400 font-medium" : "text-white/35"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
