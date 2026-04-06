import { useLocation } from "wouter";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout — Orchestrates the navigation system:
 * - Mobile: MobileHeader (top) + MobileBottomNav (bottom)
 * - Desktop: Navbar (top, full Quintessentially-style)
 * 
 * Pages that manage their own chrome (admin, pilotage, team, chat)
 * have their headers hidden automatically by the child components.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  // Full-chrome pages that handle their own layout
  const isFullChrome =
    location.startsWith("/admin") ||
    location.startsWith("/pilotage") ||
    location.startsWith("/team");

  // Chat has its own mobile header but needs bottom nav hidden
  const isChat = location.startsWith("/chat");

  return (
    <>
      {/* Desktop navbar — hidden on mobile via internal lg:hidden */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile header — visible only on mobile, hidden on special pages */}
      <MobileHeader />

      {/* Main content area */}
      <main
        className={`
          ${!isFullChrome && !isChat ? "pt-14 md:pt-[72px]" : "md:pt-[72px]"}
          ${!isFullChrome ? "pb-20 md:pb-0" : ""}
        `}
      >
        {children}
      </main>

      {/* Mobile bottom nav — visible only on mobile */}
      <MobileBottomNav />
    </>
  );
}
