import { useLocation, Link } from "wouter";
import { Bell, X, MessageSquare, Home, Sparkles, Route, Tag, Gift } from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

const HIDDEN_PATHS = ["/chat", "/pilotage", "/admin", "/team", "/lena"];

export default function MobileHeader() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mayaExpanded, setMayaExpanded] = useState(false);

  const shouldHide = HIDDEN_PATHS.some((p) => location.startsWith(p));

  // Auto-expand Maya quand on est sur /chat, /mes-parcours ou /trip
  useEffect(() => {
    if (location.startsWith("/chat") || location.startsWith("/mes-parcours") || location.startsWith("/trip")) {
      setMayaExpanded(true);
    }
  }, [location]);

  const { data: unreadData, refetch: refetchUnread } = trpc.team.getUnreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });
  const { data: notifications } = trpc.team.getRecentNotifications.useQuery(undefined, {
    enabled: !!user && drawerOpen,
  });
  const markAllRead = trpc.team.markAllNotificationsRead.useMutation({
    onSuccess: () => refetchUnread(),
  });

  const unreadCount = (unreadData as { count?: number })?.count ?? 0;

  if (shouldHide) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/8 pt-[env(safe-area-inset-top)]">
        {/* Ligne 1 : Logo B + Titre + Notifs + Avatar */}
        <div className="flex items-center justify-between h-11 px-4">
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-400/5">
              <span className="text-amber-400 font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>B</span>
            </div>
          </Link>

          <span className="text-white/80 font-semibold text-[11px] tracking-[0.2em] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
            Maison Baymora
          </span>

          <div className="flex items-center gap-3">
            <button
              className="relative text-white/50 hover:text-white transition-colors"
              onClick={() => user ? setDrawerOpen(true) : undefined}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {user && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full bg-amber-400 text-[#080c14] text-[8px] font-bold flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {user && (
              <Link href="/profile">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[10px] font-bold text-black">
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Ligne 2 : Pilules scrollables — Maison | IA Maya ↔ Parcours | Offres | Bundles */}
        <div className="flex items-center gap-2 px-3 pb-2.5 pt-0.5 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          {/* Pilule Maison */}
          <Link href="/">
            <button className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              location === "/" ? "bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/50 border border-white/8"
            }`}>
              <Home size={13} />
              Maison
            </button>
          </Link>

          {/* Groupe IA Maya + Parcours (dédoublable) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { setMayaExpanded(true); setLocation("/chat"); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                location.startsWith("/chat") ? "bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/50 border border-white/8"
              }`}
            >
              <Sparkles size={13} />
              IA Maya
            </button>
            {mayaExpanded && (
              <button
                onClick={() => setLocation("/mes-parcours")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  location.startsWith("/mes-parcours") || location.startsWith("/trip") ? "bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/50 border border-white/8"
                }`}
              >
                <Route size={13} />
                Parcours
              </button>
            )}
          </div>

          {/* Pilule Offres */}
          <Link href="/offres">
            <button className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              location.startsWith("/offres") ? "bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/50 border border-white/8"
            }`}>
              <Tag size={13} />
              Offres
            </button>
          </Link>

          {/* Pilule Bundles */}
          <Link href="/bundles">
            <button className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              location.startsWith("/bundles") ? "bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/50 border border-white/8"
            }`}>
              <Gift size={13} />
              Bundles
            </button>
          </Link>
        </div>
      </header>

      {/* Drawer notifications — identique à l'ancien */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[85vw] max-w-sm bg-[#0d0d14] border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)]">
              <div>
                <h2 className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Notifications</h2>
                {unreadCount > 0 && <p className="text-amber-400/70 text-xs mt-0.5">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</p>}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead.mutate()} className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">Tout lire</button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30 px-6">
                  <Bell size={32} className="opacity-30" />
                  <p className="text-sm">Aucune notification</p>
                  <p className="text-xs text-center">Les messages de Baymora apparaîtront ici</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif: any) => (
                    <div key={notif.id} className={`px-4 py-3 ${!notif.isRead ? "bg-amber-400/5" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare size={14} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm leading-relaxed line-clamp-3">{notif.content}</p>
                          <p className="text-white/30 text-xs mt-1">
                            {new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {user && ((user as { role?: string }).role === "team" || (user as { role?: string }).role === "admin") && (
              <div className="border-t border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <Link href="/team" onClick={() => setDrawerOpen(false)}>
                  <button className="w-full py-2.5 rounded-xl border border-amber-400/20 text-amber-400/70 text-sm hover:border-amber-400/40 hover:text-amber-400 transition-colors">
                    Ouvrir la messagerie terrain
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
