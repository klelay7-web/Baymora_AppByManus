import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, User, Heart, Users, CreditCard, LogOut, Plus, Crown, Sparkles } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: preferences } = trpc.profile.getPreferences.useQuery(undefined, { enabled: isAuthenticated });
  const { data: companions } = trpc.profile.getCompanions.useQuery(undefined, { enabled: isAuthenticated });
  const { data: creditInfo } = trpc.credits.getBalance.useQuery(undefined, { enabled: isAuthenticated });

  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [companionName, setCompanionName] = useState("");
  const [companionRelation, setCompanionRelation] = useState("");

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
            <User size={28} className="text-gold" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-3">Connectez-vous</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Accédez à votre profil, vos préférences et votre historique de voyage.
          </p>
          <a href={getLoginUrl()}>
            <Button className="bg-gold text-navy-dark hover:bg-gold-light font-semibold">
              Se connecter
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const groupedPrefs: Record<string, Array<{ key: string; value: string }>> = {};
  preferences?.forEach((p) => {
    if (!groupedPrefs[p.category]) groupedPrefs[p.category] = [];
    groupedPrefs[p.category].push({ key: p.key, value: p.value });
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-gold/10 px-4 py-3 sticky top-0 z-20">
        <div className="container flex items-center gap-3">
          <Link href="/">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-gold transition-colors" />
          </Link>
          <h1 className="font-serif text-lg font-semibold flex-1">Mon Profil</h1>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => { logout(); navigate("/"); }}>
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* User Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
              <User size={24} className="text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-lg font-semibold">{user?.name || "Voyageur"}</h2>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            {creditInfo?.tier === "premium" ? (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gold/10">
                <Crown size={14} className="text-gold" />
                <span className="text-xs text-gold font-semibold">Premium</span>
              </div>
            ) : (
              <Link href="/pricing">
                <Button size="sm" className="bg-gold text-navy-dark hover:bg-gold-light text-xs font-semibold gap-1">
                  <Sparkles size={12} />
                  Passer Premium
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Credits */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard size={18} className="text-gold" />
            <h3 className="font-serif font-semibold">Crédits</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gold">{creditInfo?.credits || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Crédits disponibles</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{creditInfo?.rollover || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Rollover</p>
            </div>
          </div>
          {creditInfo?.tier === "free" && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Messages gratuits utilisés : {creditInfo.freeMessagesUsed}/3
            </p>
          )}
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart size={18} className="text-gold" />
            <h3 className="font-serif font-semibold">Mes Préférences</h3>
          </div>
          {Object.keys(groupedPrefs).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Vos préférences seront automatiquement détectées lors de vos conversations avec le concierge.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPrefs).map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs text-gold uppercase tracking-wider font-semibold mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                        {item.key}: {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Companions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-gold" />
              <h3 className="font-serif font-semibold">Compagnons de voyage</h3>
            </div>
            <Button variant="ghost" size="icon" className="text-gold" onClick={() => setShowAddCompanion(!showAddCompanion)}>
              <Plus size={18} />
            </Button>
          </div>

          {showAddCompanion && (
            <div className="bg-secondary/50 rounded-lg p-4 mb-4 space-y-3">
              <input
                type="text"
                value={companionName}
                onChange={(e) => setCompanionName(e.target.value)}
                placeholder="Nom du compagnon"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
              <input
                type="text"
                value={companionRelation}
                onChange={(e) => setCompanionRelation(e.target.value)}
                placeholder="Relation (conjoint, enfant, ami...)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
              <Button
                size="sm"
                className="bg-gold text-navy-dark hover:bg-gold-light w-full font-semibold"
                onClick={() => companionName && addCompanion.mutate({ name: companionName, relationship: companionRelation || undefined })}
                disabled={!companionName || addCompanion.isPending}
              >
                Ajouter
              </Button>
            </div>
          )}

          {!companions || companions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ajoutez vos compagnons de voyage pour des recommandations personnalisées.
            </p>
          ) : (
            <div className="space-y-2">
              {companions.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <User size={14} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.relationship && <p className="text-[10px] text-muted-foreground">{c.relationship}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
