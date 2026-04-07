import { useLocation } from "wouter";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";

const FULLSCREEN_PATHS = ["/chat", "/pilotage", "/admin", "/team", "/lena"];
const NO_BOTTOM_NAV_PATHS = ["/chat", "/pilotage", "/admin", "/team", "/lena"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isFullscreen = FULLSCREEN_PATHS.some((p) => location.startsWith(p));
  const showBottomNav = !NO_BOTTOM_NAV_PATHS.some((p) => location.startsWith(p));

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Desktop navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile header */}
      <MobileHeader />

      {/* Main content — padding for mobile header and bottom nav */}
      <main className="pt-12 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
