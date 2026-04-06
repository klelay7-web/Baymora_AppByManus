import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  User,
  Heart,
  Users,
  CreditCard,
  LogOut,
  Plus,
  Crown,
  Sparkles,
  Settings,
  ChevronRight,
  Brain,
  Star,
  Shield,
  MapPin,
  MessageCircle,
  Route,
  X,
  Coins,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: preferences } = trpc.profile.getPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: companions } = trpc.profile.getCompanions.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: creditInfo } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [companionName, setCompanionName] = useState("");
  const [companionRelation, setCompanionRelation] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "prefs" | "companions" | "memory">("overview");

  const addCompanion = trpc.profile.addCompanion.useMutation({
    onSuccess: () => {
      toast.success("Compagnon ajouté");
      setShowAddCompanion(false);
      setCompanionName("");
      setCompanionRelation("");
    },
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#c8a94a] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#c8a94a]/10 border border-[#c8a94a]/20 flex items-center justify-center mb-6">
          <User size={28} className="text-[#c8a94a]" />
        </div>
        <h2 className="font-['Playfair_Display'] text-xl text-white/90 mb-2">
          Mon Profil
        </h2>
        <p className="text-white/40 text-sm max-w-xs mb-6 leading-relaxed">
          Connectez-vous pour accéder à votre profil, vos préférences et votre
          historique.
        </p>
        <a href={getLoginUrl()}>
          <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8 py-5 text-sm tracking-wider uppercase font-medium">
            Se connecter
          </Button>
        </a>
      </div>
    );
  }

  const groupedPrefs: Record<string, Array<{ key: string; value: string }>> = {};
  preferences?.forEach((p: any) => {
    if (!groupedPrefs[p.category]) groupedPrefs[p.category] = [];
    groupedPrefs[p.category].push({ key: p.key, value: p.value });
  });

  const tabs = [
    { id: "overview" as const, label: "Aperçu" },
    { id: "prefs" as const, label: "Préférences" },
    { id: "companions" as const, label: "Compagnons" },
    { id: "memory" as const, label: "Mémoire" },
  ];

  return (
    <div className="min-h-[80vh]">
      {/* ─── Profile Header ─── */}
      <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full border-2 border-[#c8a94a]/30 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#c8a94a]/10 border-2 border-[#c8a94a]/20 flex items-center justify-center">
                <span className="font-['Playfair_Display'] text-xl text-[#c8a94a]">
                  {user?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-['Playfair_Display'] text-lg text-white/90">
                {user?.name || "Voyageur"}
              </h1>
              <p className="text-[11px] text-white/35 mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {creditInfo?.tier === "premium" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#c8a94a]/15 border border-[#c8a94a]/25 text-[9px] text-[#c8a94a] tracking-wider uppercase font-medium">
                    <Crown size={10} />
                    Premium
                  </span>
                ) : creditInfo?.tier === "elite" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#c8a94a]/20 border border-[#c8a94a]/40 text-[9px] text-[#c8a94a] tracking-wider uppercase font-medium">
                    <Star size={10} />
                    Élite
                  </span>
                ) : (
                  <Link href="/pricing">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] text-[9px] text-white/40 tracking-wider uppercase font-medium">
                      <Sparkles size={10} />
                      Passer Premium
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast("Paramètres bientôt disponibles")}
              className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-[#c8a94a] transition-colors"
            >
              <Settings size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="px-4 md:px-6 grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-lg font-semibold text-[#c8a94a]">
            {creditInfo?.credits || 0}
          </p>
          <p className="text-[9px] text-white/30 tracking-wider uppercase mt-0.5">
            Crédits
          </p>
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-lg font-semibold text-white/80">
            {companions?.length || 0}
          </p>
          <p className="text-[9px] text-white/30 tracking-wider uppercase mt-0.5">
            Compagnons
          </p>
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-lg font-semibold text-white/80">
            {Object.keys(groupedPrefs).length}
          </p>
          <p className="text-[9px] text-white/30 tracking-wider uppercase mt-0.5">
            Catégories
          </p>
        </div>
      </div>

      {/* ─── Tab Pills ─── */}
      <div className="px-4 md:px-6 flex gap-2 overflow-x-auto scrollbar-hide pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-200 flex-shrink-0 ${
              activeTab === tab.id
                ? "bg-[#c8a94a] text-[#080c14]"
                : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="px-4 md:px-6 pb-8">
        {activeTab === "overview" && (
          <OverviewTab
            creditInfo={creditInfo}
            companions={companions}
            groupedPrefs={groupedPrefs}
            isAuthenticated={isAuthenticated}
          />
        )}
        {activeTab === "prefs" && <PreferencesTab groupedPrefs={groupedPrefs} />}
        {activeTab === "companions" && (
          <CompanionsTab
            companions={companions}
            showAdd={showAddCompanion}
            setShowAdd={setShowAddCompanion}
            name={companionName}
            setName={setCompanionName}
            relation={companionRelation}
            setRelation={setCompanionRelation}
            addMutation={addCompanion}
          />
        )}
        {activeTab === "memory" && <MemoryTab />}
      </div>

      {/* ─── Quick Links ─── */}
      <div className="px-4 md:px-6 pb-8 space-y-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/50 font-medium mb-3">
          Accès rapide
        </p>
        {[
          { icon: MessageCircle, label: "Mes conversations", href: "/chat", count: null },
          { icon: Route, label: "Mes parcours", href: "/parcours", count: null },
          { icon: Heart, label: "Mes favoris", href: "/mon-espace", count: null },
          { icon: CreditCard, label: "Abonnement & crédits", href: "/pricing", count: null },
          { icon: Users, label: "Programme ambassadeur", href: "/ambassadeur", count: null },
          { icon: Shield, label: "Confidentialité", href: "#", count: null },
        ].map((link) => (
          <Link key={link.label} href={link.href}>
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] hover:border-[#c8a94a]/15 transition-colors group">
              <link.icon size={16} className="text-white/25 group-hover:text-[#c8a94a]/60 transition-colors" />
              <span className="flex-1 text-xs text-white/60 group-hover:text-white/80 transition-colors">
                {link.label}
              </span>
              <ChevronRight size={14} className="text-white/15 group-hover:text-[#c8a94a]/40 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Overview Tab ──────────────────────────────────── */

function OverviewTab({
  creditInfo,
  companions,
  groupedPrefs,
  isAuthenticated,
}: any) {
  return (
    <div className="space-y-5">
      {/* Credits card */}
      <div className="p-4 bg-[#c8a94a]/[0.04] border border-[#c8a94a]/15">
        <div className="flex items-center gap-2 mb-3">
          <Coins size={16} className="text-[#c8a94a]/60" />
          <h3 className="text-xs font-medium text-white/70">Crédits & Abonnement</h3>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-semibold text-[#c8a94a]">
            {creditInfo?.credits || 0}
          </span>
          <span className="text-xs text-white/30">crédits</span>
        </div>
        {creditInfo?.rollover > 0 && (
          <p className="text-[10px] text-white/25">
            +{creditInfo.rollover} en rollover
          </p>
        )}
        {creditInfo?.tier === "free" && (
          <p className="text-[10px] text-white/30 mt-2">
            Messages gratuits : {creditInfo.freeMessagesUsed}/3
          </p>
        )}
        <Link href="/pricing">
          <Button className="mt-3 w-full bg-[#c8a94a]/10 text-[#c8a94a] hover:bg-[#c8a94a]/20 rounded-none py-3 text-[11px] tracking-wider uppercase font-medium border border-[#c8a94a]/20">
            Gérer mon abonnement
          </Button>
        </Link>
      </div>

      {/* Companions preview */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-white/30" />
            <h3 className="text-xs font-medium text-white/70">Compagnons</h3>
          </div>
          <span className="text-[10px] text-white/25">
            {companions?.length || 0} enregistré(s)
          </span>
        </div>
        {!companions || companions.length === 0 ? (
          <p className="text-[11px] text-white/30 leading-relaxed">
            Ajoutez vos compagnons pour des recommandations adaptées à votre groupe.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {companions.slice(0, 5).map((c: any) => (
              <div
                key={c.id}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="w-6 h-6 rounded-full bg-[#c8a94a]/10 flex items-center justify-center">
                  <User size={10} className="text-[#c8a94a]/60" />
                </div>
                <div>
                  <p className="text-[11px] text-white/60">{c.name}</p>
                  {c.relationship && (
                    <p className="text-[9px] text-white/25">{c.relationship}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences preview */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={16} className="text-white/30" />
          <h3 className="text-xs font-medium text-white/70">Préférences</h3>
        </div>
        {Object.keys(groupedPrefs).length === 0 ? (
          <p className="text-[11px] text-white/30 leading-relaxed">
            Vos préférences seront détectées automatiquement lors de vos conversations avec ARIA.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(groupedPrefs)
              .flatMap(([, items]) => items)
              .slice(0, 8)
              .map((item: any, i: number) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 bg-white/[0.04] border border-white/[0.06] text-white/40"
                >
                  {item.key}: {item.value}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Preferences Tab ───────────────────────────────── */

function PreferencesTab({
  groupedPrefs,
}: {
  groupedPrefs: Record<string, Array<{ key: string; value: string }>>;
}) {
  if (Object.keys(groupedPrefs).length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={24} className="text-white/15 mx-auto mb-3" />
        <h3 className="text-sm text-white/50 mb-1">Aucune préférence</h3>
        <p className="text-[11px] text-white/25 max-w-xs mx-auto leading-relaxed">
          Parlez à ARIA de vos goûts, allergies, style de voyage. Elle mémorisera
          tout automatiquement.
        </p>
        <Link href="/chat">
          <Button className="mt-4 bg-[#c8a94a]/10 text-[#c8a94a] hover:bg-[#c8a94a]/20 rounded-none px-6 py-3 text-[11px] tracking-wider uppercase font-medium border border-[#c8a94a]/20">
            <Sparkles size={12} className="mr-1.5" />
            Parler à ARIA
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(groupedPrefs).map(([category, items]) => (
        <div key={category}>
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#c8a94a]/50 font-medium mb-2">
            {category}
          </p>
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06]"
              >
                <span className="text-[11px] text-white/50">{item.key}</span>
                <span className="text-[11px] text-white/70 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Companions Tab ────────────────────────────────── */

function CompanionsTab({
  companions,
  showAdd,
  setShowAdd,
  name,
  setName,
  relation,
  setRelation,
  addMutation,
}: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-white/60">
          {companions?.length || 0} compagnon(s)
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-[11px] text-[#c8a94a]/70 hover:text-[#c8a94a] transition-colors"
        >
          {showAdd ? <X size={12} /> : <Plus size={12} />}
          {showAdd ? "Annuler" : "Ajouter"}
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-white/[0.02] border border-[#c8a94a]/15 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="Nom du compagnon"
            className="w-full bg-[#080c14] border border-white/[0.08] px-3 py-2.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#c8a94a]/30"
          />
          <input
            type="text"
            value={relation}
            onChange={(e: any) => setRelation(e.target.value)}
            placeholder="Relation (conjoint, enfant, ami...)"
            className="w-full bg-[#080c14] border border-white/[0.08] px-3 py-2.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#c8a94a]/30"
          />
          <Button
            className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none py-3 text-[11px] tracking-wider uppercase font-medium"
            onClick={() =>
              name &&
              addMutation.mutate({
                name,
                relationship: relation || undefined,
              })
            }
            disabled={!name || addMutation.isPending}
          >
            {addMutation.isPending ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      )}

      {!companions || companions.length === 0 ? (
        <div className="text-center py-8">
          <Users size={24} className="text-white/15 mx-auto mb-3" />
          <p className="text-[11px] text-white/30 max-w-xs mx-auto">
            Ajoutez vos compagnons de voyage pour des recommandations adaptées.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {companions.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="w-10 h-10 rounded-full bg-[#c8a94a]/10 border border-[#c8a94a]/15 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-[#c8a94a]/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 font-medium">{c.name}</p>
                {c.relationship && (
                  <p className="text-[10px] text-white/30">{c.relationship}</p>
                )}
              </div>
              {c.dietaryRestrictions && (
                <span className="text-[9px] px-2 py-0.5 bg-white/[0.04] text-white/30">
                  {c.dietaryRestrictions}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Memory Tab ────────────────────────────────────── */

function MemoryTab() {
  // This will connect to the userMemory table once the tRPC route is created
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain size={16} className="text-[#c8a94a]/50" />
        <h3 className="text-xs font-medium text-white/60">
          Ce qu'ARIA sait de vous
        </h3>
      </div>
      <p className="text-[11px] text-white/30 leading-relaxed">
        ARIA mémorise vos préférences, habitudes et informations importantes au fil
        de vos conversations. Ces données sont privées et vous pouvez les modifier
        ou les supprimer à tout moment.
      </p>
      <div className="text-center py-8 border border-dashed border-white/[0.08]">
        <Brain size={24} className="text-white/10 mx-auto mb-3" />
        <p className="text-[11px] text-white/25">
          Aucune mémoire enregistrée pour le moment.
        </p>
        <p className="text-[10px] text-white/15 mt-1">
          Commencez à discuter avec ARIA pour enrichir votre profil.
        </p>
        <Link href="/chat">
          <Button className="mt-4 bg-[#c8a94a]/10 text-[#c8a94a] hover:bg-[#c8a94a]/20 rounded-none px-6 py-3 text-[11px] tracking-wider uppercase font-medium border border-[#c8a94a]/20">
            <Sparkles size={12} className="mr-1.5" />
            Parler à ARIA
          </Button>
        </Link>
      </div>
    </div>
  );
}
