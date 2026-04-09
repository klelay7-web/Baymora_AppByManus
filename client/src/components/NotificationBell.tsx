import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  readAt: Date | null;
  createdAt: Date;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: count = 0, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 60000, // toutes les minutes
  });

  const { data: notifications = [], refetch: refetchList } = trpc.notifications.list.useQuery(
    { limit: 20, unreadOnly: false },
    { enabled: open }
  );

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetchCount();
      refetchList();
    },
  });

  const handleOpen = () => {
    setOpen(true);
    // Marquer toutes comme lues après 2s
    setTimeout(() => {
      if (count > 0) {
        markReadMutation.mutate({ id: undefined });
      }
    }, 2000);
  };

  const formatDate = (d: Date) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const TYPE_ICON: Record<string, string> = {
    trip: "✈️",
    offer: "⭐",
    system: "🔔",
    ambassador: "👑",
    welcome: "🎉",
  };

  return (
    <div className="relative">
      {/* Cloche */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell size={20} color="#C8A96E" strokeWidth={1.8} />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "#ef4444", color: "white", border: "2px solid #070B14" }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 z-50 rounded-2xl overflow-hidden"
              style={{
                background: "#0D1117",
                border: "1px solid rgba(200,169,110,0.2)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Notifications</h3>
                {count > 0 && (
                  <button
                    onClick={() => markReadMutation.mutate({ id: undefined })}
                    className="text-[#C8A96E] text-xs hover:underline"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>

              {/* Liste */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <Bell size={32} strokeWidth={1} className="mb-2 opacity-30" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map((notif: Notification) => (
                    <div
                      key={notif.id}
                      className="flex gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                      style={{ opacity: notif.readAt ? 0.6 : 1 }}
                    >
                      <span className="text-xl mt-0.5 flex-shrink-0">
                        {TYPE_ICON[notif.type] || "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium leading-snug">{notif.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                        <p className="text-gray-600 text-[10px] mt-1">{formatDate(notif.createdAt)}</p>
                      </div>
                      {!notif.readAt && (
                        <div className="w-2 h-2 rounded-full bg-[#C8A96E] mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
