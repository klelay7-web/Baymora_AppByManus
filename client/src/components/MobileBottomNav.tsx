import { useLocation, Link } from "wouter";
import { Home, Compass, MessageCircle, Tag, User } from "lucide-react";

const tabs = [
  { path: "/", icon: Home, label: "Accueil" },
  { path: "/discover", icon: Compass, label: "Découvrir" },
  { path: "/chat", icon: MessageCircle, label: "MAYA", accent: true },
  { path: "/offres", icon: Tag, label: "Offres" },
  { path: "/profile", icon: User, label: "Profil" },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.path === "/" ? location === "/" : location.startsWith(tab.path);
          const Icon = tab.icon;
          return (
            <Link key={tab.path} href={tab.path}>
              <button className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative">
                {tab.accent ? (
                  <div className="absolute -top-4 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-[#0d0d14]">
                    <Icon size={18} className="text-black" strokeWidth={2.5} />
                  </div>
                ) : (
                  <Icon
                    size={20}
                    className={isActive ? "text-amber-400" : "text-white/40"}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                )}
                <span className={`text-[10px] ${tab.accent ? "mt-7 text-amber-400 font-semibold" : isActive ? "text-amber-400 font-medium" : "text-white/40"}`}>
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
