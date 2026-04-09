import { useLocation, Link } from "wouter";
import { Home, Sparkles, MapPin, Compass, User } from "lucide-react";

const tabs = [
  { href: "/maison", label: "Maison", icon: Home },
  { href: "/ma-position", label: "Ma position", icon: MapPin },
  { href: "/maya", label: "Maya", icon: Sparkles, accent: true },
  { href: "/parcours", label: "Parcours", icon: Compass },
  { href: "/profil", label: "Profil", icon: User },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/maison") return location === "/maison" || location === "/";
    return location.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around px-2"
      style={{
        background: "rgba(7, 11, 20, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(200, 169, 110, 0.1)",
        paddingTop: 8,
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        height: "calc(60px + env(safe-area-inset-bottom))",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        if (tab.accent) {
          return (
            <Link key={tab.href} href={tab.href}>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center -mt-5"
                  style={{
                    background: "linear-gradient(135deg, #C8A96E, #E8D5A8)",
                    boxShadow: "0 0 20px rgba(200, 169, 110, 0.4)",
                  }}
                >
                  <Icon size={22} color="#070B14" />
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? "#C8A96E" : "#8B8D94" }}
                >
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        }
        return (
          <Link key={tab.href} href={tab.href}>
            <div className="flex flex-col items-center gap-1 cursor-pointer min-w-[48px]">
              <Icon
                size={20}
                color={active ? "#C8A96E" : "#8B8D94"}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span
                className="text-[10px]"
                style={{
                  color: active ? "#C8A96E" : "#8B8D94",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {tab.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
