import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User, Heart, Compass, Users, Crown, CreditCard, Gift,
  Bell, Globe, Shield, LogOut, ChevronRight, Sparkles, Zap,
  X, Plus, Check, Copy, Share2, MapPin, UtensilsCrossed,
  Plane, Dumbbell, Calendar
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveSection = null | "preferences" | "collections" | "proches" | "parrainage" | "notifications" | "confidentialite";

// ─── Section : Préférences ────────────────────────────────────────────────────
function SectionPreferences({ onClose }: { onClose: () => void }) {
  const { data: profile, isLoading } = trpc.profileEnriched.get.useQuery();
  const updateMutation = trpc.profileEnriched.update.useMutation({
    onSuccess: () => toast.success("Profil mis à jour ✓"),
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const [form, setForm] = useState({
    pseudo: "",
    dietRegime: "",
    dietAllergies: "",
    travelStyles: "",
    favoriteCuisines: "",
    favoriteCities: "",
    bucketList: "",
    freeNotes: "",
  });

  // Sync form with profile data
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setForm({
      pseudo: (profile as any).pseudo || "",
      dietRegime: (profile as any).dietRegime || "",
      dietAllergies: (profile as any).dietAllergies || "",
      travelStyles: (profile as any).travelStyles || "",
      favoriteCuisines: (profile as any).favoriteCuisines || "",
      favoriteCities: (profile as any).favoriteCities || "",
      bucketList: (profile as any).bucketList || "",
      freeNotes: (profile as any).freeNotes || "",
    });
    setSynced(true);
  }

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A96E", borderTopColor: "transparent" }} /></div>;

  const fields = [
    { key: "pseudo", label: "Pseudo", placeholder: "Votre pseudo (optionnel)", icon: User },
    { key: "dietRegime", label: "Régime alimentaire", placeholder: "Ex: végétarien, sans gluten...", icon: UtensilsCrossed },
    { key: "dietAllergies", label: "Allergies", placeholder: "Ex: arachides, lactose...", icon: UtensilsCrossed },
    { key: "travelStyles", label: "Style de voyage", placeholder: "Ex: luxe, aventure, culturel...", icon: Plane },
    { key: "favoriteCuisines", label: "Cuisines favorites", placeholder: "Ex: japonaise, italienne...", icon: UtensilsCrossed },
    { key: "favoriteCities", label: "Villes favorites", placeholder: "Ex: Paris, Tokyo, New York...", icon: MapPin },
    { key: "bucketList", label: "Bucket list", placeholder: "Vos rêves de voyage...", icon: Sparkles },
    { key: "freeNotes", label: "Notes libres pour Maya", placeholder: "Tout ce que Maya doit savoir sur vous...", icon: Sparkles },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-xl" style={{ color: "#C8A96E" }}>Mes préférences</h2>
        <button onClick={onClose}><X size={20} color="#8B8D94" /></button>
      </div>
      <div className="space-y-4">
        {fields.map(({ key, label, placeholder, icon: Icon }) => (
          <div key={key}>
            <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: "#8B8D94" }}>
              <Icon size={12} color="#C8A96E" /> {label}
            </label>
            {key === "freeNotes" || key === "bucketList" ? (
              <textarea
                rows={3}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E]/40 resize-none"
              />
            ) : (
              <input
                type="text"
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E]/40"
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full mt-6 py-3 rounded-xl text-sm font-semibold"
        style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
      >
        {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}

// ─── Section : Collections ────────────────────────────────────────────────────
function SectionCollections({ onClose }: { onClose: () => void }) {
  const { data: favorites, isLoading } = trpc.favorites.list.useQuery();
  const { data: collections } = trpc.collections.list.useQuery();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-xl" style={{ color: "#C8A96E" }}>Mes collections</h2>
        <button onClick={onClose}><X size={20} color="#8B8D94" /></button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A96E", borderTopColor: "transparent" }} /></div>
      ) : !favorites?.length ? (
        <div className="text-center py-12">
          <Heart size={40} color="#C8A96E" className="mx-auto mb-4 opacity-40" />
          <p className="text-gray-400 text-sm mb-2">Aucun favori pour l'instant</p>
          <p className="text-gray-600 text-xs">Explorez les offres et sauvegardez vos coups de cœur</p>
          <Link href="/offres">
            <button className="mt-4 px-5 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }}>
              Explorer les offres
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(favorites as any[]).map((fav: any) => (
            <div key={fav.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.1)" }}>
              <Heart size={16} color="#C8A96E" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{fav.targetType}</p>
                <p className="text-xs text-gray-500">ID #{fav.targetId}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {(collections as any[])?.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8B8D94" }}>Mes listes</p>
          <div className="space-y-2">
            {(collections as any[]).map((col: any) => (
              <div key={col.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.1)" }}>
                <Compass size={16} color="#C8A96E" />
                <span className="text-sm text-white">{col.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section : Proches ────────────────────────────────────────────────────────
function SectionProches({ onClose }: { onClose: () => void }) {
  const { data: companions, isLoading, refetch } = trpc.companions.list.useQuery();
  const createMutation = trpc.companions.create.useMutation({
    onSuccess: () => { toast.success("Proche ajouté ✓"); setShowForm(false); setNewName(""); setNewRel("ami"); refetch(); },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRel, setNewRel] = useState<"conjoint" | "enfant" | "parent" | "ami" | "collegue" | "autre">("ami");

  const RELS = ["conjoint", "enfant", "parent", "ami", "collegue", "autre"] as const;
  const REL_LABELS: Record<string, string> = { conjoint: "Conjoint(e)", enfant: "Enfant", parent: "Parent", ami: "Ami(e)", collegue: "Collègue", autre: "Autre" };
  const REL_EMOJI: Record<string, string> = { conjoint: "💑", enfant: "👶", parent: "👨‍👩‍👧", ami: "🤝", collegue: "💼", autre: "👤" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-xl" style={{ color: "#C8A96E" }}>Mes proches</h2>
        <button onClick={onClose}><X size={20} color="#8B8D94" /></button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A96E", borderTopColor: "transparent" }} /></div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {(companions as any[] || []).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.1)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "rgba(200,169,110,0.12)" }}>
                  {REL_EMOJI[c.relationship] || "👤"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-gray-500">{REL_LABELS[c.relationship] || c.relationship}</p>
                </div>
              </div>
            ))}
            {!(companions as any[])?.length && !showForm && (
              <div className="text-center py-8">
                <Users size={36} color="#C8A96E" className="mx-auto mb-3 opacity-40" />
                <p className="text-gray-400 text-sm">Ajoutez vos proches pour que Maya les connaisse</p>
              </div>
            )}
          </div>
          {showForm ? (
            <div className="p-4 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.15)" }}>
              <p className="text-sm font-medium text-white mb-3">Ajouter un proche</p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Prénom"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none mb-3"
              />
              <div className="flex flex-wrap gap-2 mb-4">
                {RELS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setNewRel(r)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: newRel === r ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)",
                      color: newRel === r ? "#C8A96E" : "#8B8D94",
                      border: `1px solid ${newRel === r ? "rgba(200,169,110,0.4)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    {REL_EMOJI[r]} {REL_LABELS[r]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg text-xs text-gray-400 border border-white/10">Annuler</button>
                <button
                  onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim(), relationship: newRel })}
                  disabled={!newName.trim() || createMutation.isPending}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                >
                  {createMutation.isPending ? "..." : "Ajouter"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
            >
              <Plus size={16} /> Ajouter un proche
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Section : Parrainage ─────────────────────────────────────────────────────
function SectionParrainage({ onClose }: { onClose: () => void }) {
  const { data: ambassador } = trpc.ambassador.me.useQuery();
  const { data: referrals } = trpc.ambassador.referrals.useQuery();
  const joinMutation = trpc.ambassador.join.useMutation({
    onSuccess: () => toast.success("Programme ambassadeur activé ✓"),
    onError: (e) => toast.error(e.message),
  });

  const referralLink = ambassador ? `https://maisonbaymora.com/?ref=${(ambassador as any).referralCode}` : "";
  const copyLink = () => { navigator.clipboard.writeText(referralLink); toast.success("Lien copié !"); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-xl" style={{ color: "#C8A96E" }}>Parrainer un ami</h2>
        <button onClick={onClose}><X size={20} color="#8B8D94" /></button>
      </div>
      <div className="p-4 rounded-xl mb-5" style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.04))", border: "1px solid rgba(200,169,110,0.2)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Gift size={18} color="#C8A96E" />
          <span className="text-sm font-semibold text-white">Gagnez 1 mois offert</span>
        </div>
        <p className="text-xs text-gray-400">Pour chaque ami qui s'inscrit avec votre lien et souscrit un forfait, vous recevez 1 mois Social Club offert. Après 3 filleuls, votre mois est automatiquement crédité.</p>
      </div>

      {ambassador ? (
        <>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Votre code ambassadeur</p>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)" }}>
              <span className="text-sm font-mono font-bold" style={{ color: "#C8A96E" }}>{(ambassador as any).referralCode}</span>
              <button onClick={copyLink} className="ml-auto"><Copy size={14} color="#8B8D94" /></button>
            </div>
          </div>
          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-2">Votre lien de parrainage</p>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)" }}>
              <span className="text-xs text-gray-300 truncate flex-1">{referralLink}</span>
              <button onClick={copyLink}><Copy size={14} color="#8B8D94" /></button>
            </div>
          </div>
          <button
            onClick={() => navigator.share?.({ title: "Rejoins Maison Baymora", url: referralLink })}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mb-5"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            <Share2 size={16} /> Partager mon lien
          </button>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.1)" }}>
              <p className="text-xl font-bold" style={{ color: "#C8A96E" }}>{(referrals as any[])?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Filleuls</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.1)" }}>
              <p className="text-xl font-bold" style={{ color: "#C8A96E" }}>{Math.floor(((referrals as any[])?.length || 0) / 3)}</p>
              <p className="text-xs text-gray-500 mt-1">Mois offerts</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.1)" }}>
              <p className="text-xl font-bold" style={{ color: "#C8A96E" }}>{3 - ((referrals as any[])?.length || 0) % 3}</p>
              <p className="text-xs text-gray-500 mt-1">Avant prochain</p>
            </div>
          </div>
        </>
      ) : (
        <button
          onClick={() => joinMutation.mutate()}
          disabled={joinMutation.isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
        >
          {joinMutation.isPending ? "Activation..." : "Activer le programme ambassadeur"}
        </button>
      )}
    </div>
  );
}

// ─── Section : Notifications ──────────────────────────────────────────────────
function SectionNotifications({ onClose }: { onClose: () => void }) {
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({ limit: 20 });
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {},
  });

  const TYPE_ICON: Record<string, string> = {
    offer_flash: "🎁",
    trip_reminder: "✈️",
    maya_proactive: "✨",
    birthday: "🎂",
    system: "🔔",
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-xl" style={{ color: "#C8A96E" }}>Notifications</h2>
        <button onClick={onClose}><X size={20} color="#8B8D94" /></button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A96E", borderTopColor: "transparent" }} /></div>
      ) : !(notifications as any[])?.length ? (
        <div className="text-center py-12">
          <Bell size={36} color="#C8A96E" className="mx-auto mb-3 opacity-40" />
          <p className="text-gray-400 text-sm">Aucune notification pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(notifications as any[]).map((n: any) => (
            <div
              key={n.id}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
              style={{
                background: n.readAt ? "rgba(255,255,255,0.02)" : "rgba(200,169,110,0.06)",
                border: `1px solid ${n.readAt ? "rgba(255,255,255,0.06)" : "rgba(200,169,110,0.15)"}`,
              }}
              onClick={() => !n.readAt && markReadMutation.mutate({ id: n.id })}
            >
              <span className="text-xl flex-shrink-0">{TYPE_ICON[n.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-600 mt-1">{formatDate(n.createdAt)}</p>
              </div>
              {!n.readAt && (
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#C8A96E" }} />
              )}
            </div>
          ))}
        </div>
      )}
      {(notifications as any[])?.some((n: any) => !n.readAt) && (
        <button
          onClick={() => markReadMutation.mutate({ all: true } as any)}
          className="w-full mt-4 py-2.5 rounded-xl text-xs font-medium"
          style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.15)" }}
        >
          Tout marquer comme lu
        </button>
      )}
    </div>
  );
}

// ─── Section : Confidentialité ────────────────────────────────────────────────
function SectionConfidentialite({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-xl" style={{ color: "#C8A96E" }}>Confidentialité</h2>
        <button onClick={onClose}><X size={20} color="#8B8D94" /></button>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.1)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} color="#C8A96E" />
            <span className="text-sm font-semibold text-white">Vos droits RGPD</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">Vos données sont utilisées uniquement pour personnaliser les recommandations de Maya. Elles ne sont jamais revendues.</p>
        </div>
        <Link href="/confidentialite">
          <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm text-white">Politique de confidentialité complète</span>
            <ChevronRight size={14} color="#8B8D94" />
          </div>
        </Link>
        <Link href="/mentions-legales">
          <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm text-white">Mentions légales</span>
            <ChevronRight size={14} color="#8B8D94" />
          </div>
        </Link>
        <Link href="/cgu">
          <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm text-white">Conditions Générales d'Utilisation</span>
            <ChevronRight size={14} color="#8B8D94" />
          </div>
        </Link>
        <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-sm font-medium text-red-400 mb-1">Supprimer mon compte</p>
          <p className="text-xs text-gray-500 mb-3">Toutes vos données seront effacées définitivement dans les 30 jours.</p>
          <a href="mailto:privacy@maisonbaymora.com?subject=Demande de suppression de compte" className="text-xs text-red-400 hover:underline">
            Envoyer une demande de suppression →
          </a>
        </div>
      </div>
    </div>
  );
}

// // ─── Section : Dashboard Affilié (owner only) ────────────────────────
function AffiliateDashboardSection() {
  const { data: stats, isLoading } = trpc.affiliateDashboard.getStats.useQuery();
  const { data: topPartners } = trpc.affiliateDashboard.getTopPartners.useQuery({ limit: 5 });

  return (
    <div className="mb-6 p-4 rounded-2xl" style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} color="#C8A96E" />
        <h3 className="text-sm font-semibold" style={{ color: "#C8A96E" }}>Dashboard Affilié — Kevin</h3>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-4"><div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A96E", borderTopColor: "transparent" }} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.08)" }}>
              <p className="text-xs" style={{ color: "#8B8D94" }}>Clics totaux</p>
              <p className="text-xl font-bold" style={{ color: "#C8A96E" }}>{(stats as any)?.totalClicks ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.08)" }}>
              <p className="text-xs" style={{ color: "#8B8D94" }}>Conversions est.</p>
              <p className="text-xl font-bold" style={{ color: "#C8A96E" }}>{(stats as any)?.totalConversions ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.08)" }}>
              <p className="text-xs" style={{ color: "#8B8D94" }}>Commission totale</p>
              <p className="text-xl font-bold" style={{ color: "#C8A96E" }}>{((stats as any)?.totalCommission ?? 0).toFixed(2)}€</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(200,169,110,0.08)" }}>
              <p className="text-xs" style={{ color: "#8B8D94" }}>En attente</p>
              <p className="text-xl font-bold" style={{ color: "#E8A040" }}>{((stats as any)?.pendingCommission ?? 0).toFixed(2)}€</p>
            </div>
          </div>
          {(topPartners as any[])?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8B8D94" }}>Top 5 partenaires</p>
              <div className="space-y-2">
                {(topPartners as any[]).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: "#F0EDE6" }}>{p.partnerName || p.partner || `Partenaire ${i+1}`}</span>
                    <span style={{ color: "#C8A96E" }}>{p.clickCount || 0} clics</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page principale Profil ─────────────────────────────────────────────
export default function Profil() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const stripePortalMutation = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: () => toast.error("Impossible d'accéder au portail Stripe"),
  });

  const handleStripePortal = () => {
    stripePortalMutation.mutate({ origin: window.location.origin });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070B14" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A96E", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#070B14" }}>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Connectez-vous pour accéder à votre profil
          </h2>
          <Link href="/auth">
            <button className="px-6 py-3 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
              Se connecter
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "Membre";
  const initial = (user.name || user.email || "M")[0].toUpperCase();

  const OWNER_EMAILS = ["k.lelay7@gmail.com", "klelay7@gmail.com"];
  const isOwner = OWNER_EMAILS.includes(user.email || "") || user.role === "admin";

  const isFree = !isOwner && user.subscriptionTier === "free";
  const tierLabel = isOwner ? "Admin" : isFree ? "Invité" : user.subscriptionTier === "explorer" ? "Membre" : "Illimité";

  const freeUsed = user.freeMessagesUsed ?? 0;
  const freeTotal = 3;
  const freeRemaining = Math.max(0, freeTotal - freeUsed);
  const creditPct = (freeRemaining / freeTotal) * 100;
  const creditColor = freeRemaining >= 2 ? "#C8A96E" : freeRemaining === 1 ? "#E8A040" : "#E85050";

  const MENU_SECTIONS = [
    {
      title: "Mon compte",
      items: [
        { icon: User, label: "Compléter mon profil", desc: "Goûts, allergies, préférences", action: () => setActiveSection("preferences") },
        { icon: Compass, label: "Mes parcours", desc: "Voyages créés avec Maya", action: () => navigate("/parcours") },
        { icon: Heart, label: "Mes collections", desc: "Favoris et lieux sauvegardés", action: () => setActiveSection("collections") },
        { icon: Users, label: "Mes proches", desc: "Cercle familial et amis", action: () => setActiveSection("proches") },
      ],
    },
    {
      title: "Forfait & crédits",
      items: [
        { icon: Crown, label: "Mon forfait", desc: `Actuel : ${tierLabel}`, action: () => navigate("/premium") },
        { icon: CreditCard, label: "Gérer mon abonnement", desc: "Modifier ou annuler", action: () => handleStripePortal() },
        { icon: Gift, label: "Parrainer un ami", desc: "Gagnez 1 mois offert", action: () => setActiveSection("parrainage") },
      ],
    },
    {
      title: "Paramètres",
      items: [
        { icon: Bell, label: "Notifications", desc: "Alertes et rappels", action: () => setActiveSection("notifications") },
        { icon: Globe, label: "Langue", desc: "Français", action: () => toast.info("Bientôt disponible") },
        { icon: Shield, label: "Confidentialité", desc: "Gestion des données", action: () => setActiveSection("confidentialite") },
      ],
    },
  ];

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-12">
        {/* Avatar + nom */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", fontFamily: "'Playfair Display', serif" }}
            >
              {initial}
            </div>
            {isOwner && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
                <Zap size={12} color="#070B14" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            {user.name || user.email || "Membre"}
          </h1>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isOwner ? "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(232,213,168,0.2))" : "rgba(200, 169, 110, 0.12)",
              color: "#C8A96E",
              border: isOwner ? "1px solid rgba(200, 169, 110, 0.5)" : "1px solid rgba(200, 169, 110, 0.25)"
            }}
          >
            {isOwner ? "⚡ Admin — Accès illimité" : tierLabel}
          </div>
        </div>

        {/* Card crédits */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.15)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} color="#C8A96E" />
              <span className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>Crédits Maya</span>
            </div>
            <span className="text-sm font-bold" style={{ color: isOwner ? "#C8A96E" : creditColor }}>
              {isOwner ? "Illimité ∞" : `${freeRemaining} / ${freeTotal}`}
            </span>
          </div>
          {isOwner ? (
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(200, 169, 110, 0.12)" }}>
              <div className="h-full rounded-full w-full" style={{ background: "linear-gradient(90deg, #C8A96E, #E8D5A8)" }} />
            </div>
          ) : (
            <>
              <div className="h-2 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(200, 169, 110, 0.12)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${creditPct}%`, background: `linear-gradient(90deg, ${creditColor}, ${creditColor}dd)` }}
                />
              </div>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                onClick={() => navigate("/premium")}
              >
                Passer au Social Club — 9,90€/mois
              </button>
            </>
          )}
        </div>

        {/* Sections menu */}
        {MENU_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "#8B8D94" }}>
              {section.title}
            </h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.1)" }}
            >
              {section.items.map((item, i) => {
                const Icon = item.icon;
                const isLast = i === section.items.length - 1;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                    style={{ borderBottom: isLast ? "none" : "1px solid rgba(200, 169, 110, 0.06)" }}
                    onClick={item.action}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(200, 169, 110, 0.08)" }}
                    >
                      <Icon size={16} color="#C8A96E" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "#F0EDE6" }}>{item.label}</div>
                      <div className="text-xs" style={{ color: "#8B8D94" }}>{item.desc}</div>
                    </div>
                    <ChevronRight size={14} color="#8B8D94" className="flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Dashboard Affilié — Owner Kevin uniquement */}
        {isOwner && (
          <AffiliateDashboardSection />
        )}

        {/* Déconnexion */}
        <button
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium mt-2"
          style={{ background: "rgba(239, 68, 68, 0.08)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.15)" }}
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={16} />
          {logoutMutation.isPending ? "Déconnexion..." : "Se déconnecter"}
        </button>

        {/* Footer */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(200, 169, 110, 0.08)" }}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#C8A96E" }}>Maison Baymora</p>
              <div className="space-y-1.5">
                <p><Link href="/maya" className="text-xs" style={{ color: "#8B8D94" }}>Maya IA</Link></p>
                <p><Link href="/offres" className="text-xs" style={{ color: "#8B8D94" }}>Offres</Link></p>
                <p><Link href="/premium" className="text-xs" style={{ color: "#8B8D94" }}>Forfaits</Link></p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#C8A96E" }}>Support</p>
              <div className="space-y-1.5">
                <p><Link href="/contact" className="text-xs" style={{ color: "#8B8D94" }}>Contact</Link></p>
                <p><a href="mailto:partenaires@maisonbaymora.com" className="text-xs" style={{ color: "#8B8D94" }}>Devenir partenaire</a></p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#C8A96E" }}>Légal</p>
              <div className="space-y-1.5">
                <p><Link href="/mentions-legales" className="text-xs" style={{ color: "#8B8D94" }}>Mentions légales</Link></p>
                <p><Link href="/confidentialite" className="text-xs" style={{ color: "#8B8D94" }}>Confidentialité</Link></p>
                <p><Link href="/cgu" className="text-xs" style={{ color: "#8B8D94" }}>CGU</Link></p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: "rgba(139, 141, 148, 0.5)" }}>
            © 2026 Maison Baymora — Social club virtuel premium
          </p>
        </div>
      </div>

      {/* Drawer sections */}
      {activeSection && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setActiveSection(null)}>
          <div
            className="w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeSection === "preferences" && <SectionPreferences onClose={() => setActiveSection(null)} />}
            {activeSection === "collections" && <SectionCollections onClose={() => setActiveSection(null)} />}
            {activeSection === "proches" && <SectionProches onClose={() => setActiveSection(null)} />}
            {activeSection === "parrainage" && <SectionParrainage onClose={() => setActiveSection(null)} />}
            {activeSection === "notifications" && <SectionNotifications onClose={() => setActiveSection(null)} />}
            {activeSection === "confidentialite" && <SectionConfidentialite onClose={() => setActiveSection(null)} />}
          </div>
        </div>
      )}
    </div>
  );
}
