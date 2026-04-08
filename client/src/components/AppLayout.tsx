import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Home, Search, Sparkles, Crown, User, Star, Compass } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";
const LOGO = `${CDN}/baymora_logo_1c0fc185.png`;

const NAV_ITEMS = [
  { path: "/maison", label: "Maison", icon: Home },
  { path: "/offres", label: "Chercher", icon: Search },
  { path: "/maya", label: "Maya", icon: Sparkles, center: true },
  { path: "/parcours", label: "Premium", icon: Crown },
  { path: "/profil", label: "Profil", icon: User },
];

const SIDEBAR_ITEMS = [
  { path: "/maison", label: "Maison", icon: Home },
  { path: "/maya", label: "Maya IA", icon: Sparkles },
  { path: "/offres", label: "Offres", icon: Star },
  { path: "/parcours", label: "Parcours", icon: Compass },
  { path: "/profil", label: "Profil", icon: User },
];

const TOP_PILLS = [
  { path: "/maison", label: "Maison" },
  { path: "/maya", label: "Maya" },
  { path: "/offres", label: "Offres" },
  { path: "/parcours", label: "Bundles" },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "rgba(7, 11, 20, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(200, 169, 110, 0.12)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== "/maison" && location.startsWith(item.path));
          if (item.center) {
            return (
              <Link key={item.path} href={item.path}>
                <div className="flex flex-col items-center -mt-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #C8A96E 0%, #E8D5A8 100%)",
                      boxShadow: "0 0 20px rgba(200, 169, 110, 0.4)",
                    }}
                  >
                    <Icon size={24} color="#070B14" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] mt-1 font-medium" style={{ color: "#C8A96E" }}>{item.label}</span>
                </div>
              </Link>
            );
          }
          return (
            <Link key={item.path} href={item.path}>
              <div className="flex flex-col items-center gap-1 px-2 py-1">
                <Icon
                  size={22}
                  color={isActive ? "#C8A96E" : "#8B8D94"}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? "#C8A96E" : "#8B8D94" }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function TopPills() {
  const [location] = useLocation();
  return (
    <div
      className="sticky top-0 z-40 md:hidden pill-nav"
      style={{
        background: "rgba(7, 11, 20, 0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(200, 169, 110, 0.08)",
      }}
    >
      <Link href="/maison">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mr-1"
          style={{ background: "linear-gradient(135deg, #C8A96E 0%, #E8D5A8 100%)" }}
        >
          <span className="font-bold text-base" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
        </div>
      </Link>
      {TOP_PILLS.map((pill) => {
        const isActive = location === pill.path || (pill.path !== "/maison" && location.startsWith(pill.path));
        return (
          <Link key={pill.path} href={pill.path}>
            <span className={`pill-item${isActive ? " active" : ""}`}>{pill.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[250px] z-40"
      style={{
        background: "#0D1117",
        borderRight: "1px solid rgba(200, 169, 110, 0.12)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #C8A96E 0%, #E8D5A8 100%)" }}
        >
          <span className="font-bold text-lg" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>Maison</div>
          <div className="text-xs" style={{ color: "#C8A96E" }}>Baymora</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== "/maison" && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                style={{
                  background: isActive ? "rgba(200, 169, 110, 0.12)" : "transparent",
                  color: isActive ? "#C8A96E" : "#8B8D94",
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.path === "/maya" && (
                  <span
                    className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(200, 169, 110, 0.15)", color: "#C8A96E" }}
                  >
                    IA
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div
          className="mx-3 mb-4 p-3 rounded-xl"
          style={{ background: "rgba(200, 169, 110, 0.06)", border: "1px solid rgba(200, 169, 110, 0.12)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            >
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "#F0EDE6" }}>
                {user.name || user.email || "Membre"}
              </div>
              <div className="text-[10px]" style={{ color: "#C8A96E" }}>
                {user.subscriptionTier === "free" ? "Decouverte" : user.subscriptionTier === "explorer" ? "Social Club" : "Premium"}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Pages sans layout (landing, auth)
  const noLayout = location === "/" || location === "/auth";
  const isMayaPage = location === "/maya";

  if (noLayout) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#070B14" }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top pills */}
      {!isMayaPage && <TopPills />}

      {/* Main content */}
      <main
        className={`${isMayaPage ? "" : "pb-20 md:pb-0"} md:ml-[250px]`}
        style={{ minHeight: "100vh" }}
      >
        {children}
      </main>

      {/* Mobile bottom nav */}
      {!isMayaPage && <BottomNav />}
    </div>
  );
}
