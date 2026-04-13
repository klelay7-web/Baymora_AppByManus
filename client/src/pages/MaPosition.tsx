/**
 * MaPosition.tsx — Radar Baymora
 * 3 états : verrouillé / actif / trial expiré
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Lock, Search, MapPin, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { EstablishmentCard, type EstablishmentCardData } from "@/components/EstablishmentCard";

// ─── Shimmer ─────────────────────────────────────────────────────────────────
function ShimmerCard() {
  return (
    <div
      className="rounded-2xl flex-shrink-0"
      style={{ width: 200, height: 220, background: "rgba(200,169,110,0.06)", animation: "pulse 1.5s infinite" }}
    />
  );
}

// ─── Section horizontale ─────────────────────────────────────────────────────
function RadarSection({ icon, title, items }: { icon: string; title: string; items: EstablishmentCardData[] }) {
  if (!items || items.length === 0) return null;
  return (
    <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center gap-2 mb-4 px-4">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-semibold" style={{ color: "#F0EDE6", fontFamily: "\'Playfair Display\', serif" }}>{title}</h2>
        <span className="text-xs ml-auto" style={{ color: "#8B8D94" }}>{items.length} adresses</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ paddingLeft: 16, paddingRight: 16, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {items.map((item) => (
          <div key={item.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
            <EstablishmentCard establishment={item} variant="compact" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── État 1 : Verrouillé ─────────────────────────────────────────────────────
function RadarLocked({ onUnlock, isLoading, plan }: { onUnlock: () => void; isLoading: boolean; plan?: string }) {
  const isGuest = !plan || plan === "free" || plan === "invite";
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="mx-auto mb-8 flex items-center justify-center rounded-full" style={{ width: 96, height: 96, background: "radial-gradient(circle, rgba(200,169,110,0.15) 0%, rgba(200,169,110,0.03) 100%)", border: "1px solid rgba(200,169,110,0.25)" }}>
          <Lock size={40} color="#C8A96E" />
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "\'Playfair Display\', serif", color: "#F0EDE6" }}>
          Découvrez ce qui se passe autour de vous
        </h1>
        <p className="text-sm mb-10 max-w-xs mx-auto leading-relaxed" style={{ color: "#8B8D94" }}>
          Maya explore votre ville, trouve les meilleurs événements, restaurants et expériences — avant même que vous ne cherchiez.
        </p>
        <button onClick={onUnlock} disabled={isLoading} className="flex items-center gap-2 mx-auto px-8 py-3.5 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          {isGuest ? "Débloquer pour aujourd\'hui" : "Activer Mon Radar"}
        </button>
        <p className="text-xs mt-3" style={{ color: "#8B8D94" }}>
          {isGuest ? "Gratuit · 1 jour d\'accès" : "1 mois offert · Sans engagement"}
        </p>
      </motion.div>
    </div>
  );
}

// ─── État 3 : Trial expiré ───────────────────────────────────────────────────
function RadarExpired({ onCheckout, isLoading, plan }: { onCheckout: () => void; isLoading: boolean; plan?: string }) {
  const isDuo = plan === "duo" || plan === "explorer";
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="mx-auto mb-8 flex items-center justify-center rounded-full" style={{ width: 96, height: 96, background: "radial-gradient(circle, rgba(200,169,110,0.1) 0%, rgba(200,169,110,0.02) 100%)", border: "1px solid rgba(200,169,110,0.2)" }}>
          <RefreshCw size={40} color="#C8A96E" />
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "\'Playfair Display\', serif", color: "#F0EDE6" }}>
          Votre mois d\'essai est terminé
        </h1>
        <p className="text-sm mb-4 max-w-xs mx-auto leading-relaxed" style={{ color: "#8B8D94" }}>
          Continuez à recevoir les recommandations de votre secteur.
        </p>
        <div className="inline-block px-5 py-2.5 rounded-xl mb-8" style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)" }}>
          <span className="text-lg font-bold" style={{ color: "#C8A96E" }}>Mon Radar — {isDuo ? "5,99€" : "3,99€"}/mois</span>
        </div>
        <button onClick={onCheckout} disabled={isLoading} className="flex items-center gap-2 mx-auto px-8 py-3.5 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          Activer Mon Radar
        </button>
        <p className="text-xs mt-3" style={{ color: "#8B8D94" }}>Sans engagement · Résiliable en 1 clic</p>
      </motion.div>
    </div>
  );
}

// ─── État 2 : Radar actif ────────────────────────────────────────────────────
function RadarActive({ status }: { status: any }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchCity, setSearchCity] = useState("Bordeaux");
  const [isSearching, setIsSearching] = useState(false);
  const [, navigate] = useLocation();

  const searchMutation = trpc.radar.searchCity.useMutation({
    onSuccess: () => { setSearchCity(searchInput); setIsSearching(false); },
    onError: (err) => { toast.error(err.message || "Erreur lors de la recherche"); setIsSearching(false); },
  });

  const { data: radarData, isLoading: isLoadingRadar } = trpc.radar.getForPosition.useQuery(
    { lat: 0, lng: 0, city: searchCity },
    { enabled: !!searchCity, staleTime: 5 * 60 * 1000 }
  );

  const handleSearch = useCallback(() => {
    if (!searchInput.trim()) return;
    const maxSearches = status?.maxSearches;
    const isUnlimited = status?.unlimited || maxSearches === null;
    if (!isUnlimited && typeof maxSearches === "number" && (status?.searchesUsed || 0) >= maxSearches) {
      toast.error("Limite atteinte. Utilisez 1 crédit pour une recherche supplémentaire.");
      navigate("/premium");
      return;
    }
    setIsSearching(true);
    searchMutation.mutate({ city: searchInput.trim() });
  }, [searchInput, status?.searchesUsed, status?.maxSearches, status?.unlimited, searchMutation, navigate]);

  const categories = radarData && !(radarData as any).locked ? (radarData as any).categories || [] : [];
  const hasResults = categories.some((c: any) => c.items && c.items.length > 0);

  const trialDaysLeft = status?.trialEnd
    ? Math.max(0, Math.ceil((new Date(status.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", paddingBottom: 80 }}>
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(200,169,110,0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} color="#C8A96E" />
            <span className="text-sm font-medium" style={{ color: "#F0EDE6" }}>
              {(radarData as any)?.city || searchCity || "Bordeaux"}
            </span>
          </div>
          {status?.trialActive && trialDaysLeft !== null && (
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}>
              Essai gratuit · {trialDaysLeft}j restants
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.15)" }}>
            <Search size={14} color="#8B8D94" />
            <input
              type="text" placeholder="Rechercher une ville..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F0EDE6" }}
            />
          </div>
          <button onClick={handleSearch} disabled={isSearching || !searchInput.trim()} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", opacity: isSearching || !searchInput.trim() ? 0.5 : 1 }}>
            {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Go"}
          </button>
        </div>
        {status && (status.unlimited ? (
          <p className="text-xs mt-2" style={{ color: "#C8A96E" }}>
            Recherches illimitées
          </p>
        ) : typeof status.maxSearches === "number" ? (
          <p className="text-xs mt-2" style={{ color: "#8B8D94" }}>
            Recherches : {status.searchesUsed || 0}/{status.maxSearches} utilisées ce mois
            {(status.searchesUsed || 0) >= status.maxSearches && (
              <span className="ml-2 underline cursor-pointer" style={{ color: "#C8A96E" }} onClick={() => navigate("/premium")}>
                Utiliser 1 crédit
              </span>
            )}
          </p>
        ) : null)}
      </div>
      <div className="pt-6">
        {isLoadingRadar || isSearching ? (
          <div className="px-4 mb-6">
            <p className="text-sm mb-4" style={{ color: "#C8A96E" }}>✨ Maya explore {searchInput || searchCity} pour vous...</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-8">
                <div className="h-4 w-32 rounded mb-4 mx-4" style={{ background: "rgba(200,169,110,0.1)" }} />
                <div className="flex gap-4 overflow-hidden px-4">{[1, 2, 3].map((j) => <ShimmerCard key={j} />)}</div>
              </div>
            ))}
          </div>
        ) : hasResults ? (
          <AnimatePresence>
            {categories.map((cat: any) => <RadarSection key={cat.title} icon={cat.icon} title={cat.title} items={cat.items} />)}
          </AnimatePresence>
        ) : (radarData as any)?.locked && (radarData as any)?.message ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <Lock size={40} color="#C8A96E" className="mb-4 opacity-60" />
            <p className="text-sm" style={{ color: "#F0EDE6" }}>{(radarData as any).message}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <MapPin size={40} color="#C8A96E" className="mb-4 opacity-40" />
            <p className="text-sm" style={{ color: "#8B8D94" }}>Aucune adresse trouvée pour cette ville.</p>
            <p className="text-xs mt-2" style={{ color: "#8B8D94" }}>Essayez Paris, Bordeaux, Monaco, Dubai...</p>
          </div>
        )}
      </div>
      <p className="text-center text-xs py-4" style={{ color: "rgba(139,141,148,0.5)" }}>Recommandations mises à jour par Maya</p>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function MaPosition() {
  const { user } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("radar") === "activated") {
      toast.success("Radar activé ! Bienvenue dans votre ville.");
      window.history.replaceState({}, "", "/ma-position");
    }
  }, []);

  const { data: status, isLoading: isLoadingStatus, refetch: refetchStatus } = trpc.radar.getStatus.useQuery(
    undefined, { staleTime: 30000 }
  );

  const unlockMutation = trpc.radar.unlock.useMutation({
    onSuccess: (result) => {
      if (result.success) { toast.success(result.message || "Radar débloqué !"); refetchStatus(); }
      else toast.error(result.message || "Impossible de débloquer le Radar.");
      setIsUnlocking(false);
    },
    onError: (err) => { toast.error(err.message || "Erreur."); setIsUnlocking(false); },
  });

  const checkoutMutation = trpc.radar.createRadarCheckout.useMutation({
    onSuccess: (data: any) => {
      if (data?.url) { window.open(data.url, "_blank"); toast.info("Redirection vers le paiement..."); }
      setIsCheckout(false);
    },
    onError: (err) => { toast.error(err.message || "Erreur checkout."); setIsCheckout(false); },
  });

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]" style={{ background: "#0A0A0F" }}>
        <Loader2 size={32} color="#C8A96E" className="animate-spin" />
      </div>
    );
  }

  const hasAccess = status?.hasAccess;
  const trialExpired = !hasAccess && status?.trialEnd && new Date(status.trialEnd as any) < new Date();
  const plan = (user as any)?.subscriptionTier || "free";

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh" }}>
      <AnimatePresence mode="wait">
        {!hasAccess && !trialExpired && (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RadarLocked onUnlock={() => { setIsUnlocking(true); unlockMutation.mutate(); }} isLoading={isUnlocking} plan={plan} />
          </motion.div>
        )}
        {!hasAccess && trialExpired && (
          <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RadarExpired onCheckout={() => { setIsCheckout(true); checkoutMutation.mutate(); }} isLoading={isCheckout} plan={plan} />
          </motion.div>
        )}
        {hasAccess && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RadarActive status={status} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
