import { useLocation, Link } from "wouter";
import { Home, MessageCircle, Compass, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Accueil" },
  { path: "/discover", icon: Compass, label: "Explorer" },
  { path: "/chat", icon: Sparkles, label: "Assistant" },
  { path: "/profile", icon: User, label: "Profil" },
];

export default function MobileNav() {
  const [location] = useLocation();

  // Hide on admin pages
  if (location.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-card border-t border-gold/10 px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div className="flex flex-col items-center gap-0.5 py-1 px-3 relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={20}
                    className={isActive ? "text-gold" : "text-muted-foreground"}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  <span className={`text-[10px] font-medium ${isActive ? "text-gold" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
