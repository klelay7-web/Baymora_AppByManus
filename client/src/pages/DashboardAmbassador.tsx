import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Users, DollarSign, Share2, Copy, Check, TrendingUp, Gift, Crown, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function DashboardAmbassador() {
  const { user, loading } = useAuth();
  const { data: ambassador, isLoading: ambLoading } = trpc.ambassador.me.useQuery(undefined, { enabled: !!user });
  const { data: referrals } = trpc.ambassador.referrals.useQuery(undefined, { enabled: !!ambassador });
  const { data: commissions } = trpc.ambassador.commissions.useQuery(undefined, { enabled: !!ambassador });
  const joinMutation = trpc.ambassador.join.useMutation({
    onSuccess: () => toast.success("Bienvenue dans le programme Ambassadeur !"),
    onError: (e) => toast.error(e.message),
  });
  const [copied, setCopied] = useState(false);

  if (loading || ambLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-sm tracking-wider animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <Crown className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-serif text-foreground">Programme Ambassadeur</h1>
          <p className="text-muted-foreground">Connectez-vous pour rejoindre le programme et gagner des commissions.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground">Se connecter</Button>
        </div>
      </div>
    );
  }

  // Not yet ambassador — show join CTA
  if (!ambassador) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-primary text-sm tracking-widest uppercase mb-2">Programme Ambassadeur</p>
            <h1 className="text-4xl font-serif text-foreground mb-4">Gagnez en partageant l'excellence</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recommandez Maison Baymora à votre réseau et recevez des commissions sur chaque inscription et réservation.
            </p>
          </div>

          {/* Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { tier: "Bronze", range: "1-10 filleuls", rate: "10%", color: "text-orange-400", bg: "bg-orange-500/10" },
              { tier: "Argent", range: "11-50 filleuls", rate: "15%", color: "text-gray-300", bg: "bg-gray-500/10" },
              { tier: "Or", range: "51+ filleuls", rate: "20%", color: "text-primary", bg: "bg-primary/10" },
            ].map((t) => (
              <div key={t.tier} className="bg-card/30 border border-border/30 rounded-lg p-6 text-center">
                <div className={`w-12 h-12 rounded-full ${t.bg} flex items-center justify-center mx-auto mb-4`}>
                  <Shield className={`w-6 h-6 ${t.color}`} />
                </div>
                <h3 className={`text-lg font-serif ${t.color}`}>{t.tier}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.range}</p>
                <p className="text-2xl font-bold text-foreground mt-3">{t.rate}</p>
                <p className="text-xs text-muted-foreground">de commission</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
            >
              {joinMutation.isPending ? "Inscription..." : "Devenir Ambassadeur"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ambassador dashboard
  const totalCommissions = commissions?.reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) || 0;
  const pendingCommissions = commissions?.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) || 0;
  const referralCount = referrals?.length || 0;
  const tier = referralCount >= 51 ? "Or" : referralCount >= 11 ? "Argent" : "Bronze";
  const tierColor = tier === "Or" ? "text-primary" : tier === "Argent" ? "text-gray-300" : "text-orange-400";

  const copyCode = () => {
    navigator.clipboard.writeText(ambassador.referralCode);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = `${window.location.origin}?ref=${ambassador.referralCode}`;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm tracking-widest uppercase mb-1">Programme Ambassadeur</p>
              <h1 className="text-3xl font-serif text-foreground">
                Ambassadeur <span className={tierColor}>{tier}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-card/50 border border-border/50 rounded-lg px-4 py-2 flex items-center gap-2">
                <code className="text-primary text-sm font-mono">{ambassador.referralCode}</code>
                <button onClick={copyCode} className="text-muted-foreground hover:text-primary transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Filleuls" value={referralCount.toString()} color="text-blue-400" />
          <StatCard icon={DollarSign} label="Total gagné" value={`${totalCommissions.toFixed(2)}€`} color="text-green-400" />
          <StatCard icon={TrendingUp} label="En attente" value={`${pendingCommissions.toFixed(2)}€`} color="text-primary" />
          <StatCard icon={Gift} label="Taux" value={tier === "Or" ? "20%" : tier === "Argent" ? "15%" : "10%"} color={tierColor} />
        </div>

        {/* Share Link */}
        <div className="bg-card/30 border border-border/30 rounded-lg p-6">
          <h2 className="text-lg font-serif text-foreground mb-3">Votre lien de parrainage</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background border border-border/50 rounded-lg px-4 py-3">
              <code className="text-sm text-muted-foreground break-all">{shareLink}</code>
            </div>
            <Button
              onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Lien copié !"); }}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 shrink-0"
            >
              <Share2 className="w-4 h-4 mr-2" /> Copier
            </Button>
          </div>
        </div>

        {/* Referrals List */}
        <div>
          <h2 className="text-lg font-serif text-foreground mb-4">Mes Filleuls</h2>
          {!referrals || referrals.length === 0 ? (
            <div className="text-center py-8 bg-card/20 rounded-lg border border-border/30">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun filleul pour le moment</p>
              <p className="text-sm text-muted-foreground mt-1">Partagez votre lien pour commencer à gagner</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref: any) => (
                <div key={ref.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ref.referredName || `Filleul #${ref.id}`}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(ref.createdAt).toLocaleDateString("fr-FR")} — {ref.status}
                    </p>
                  </div>
                  {ref.commissionEarned && (
                    <span className="text-sm text-green-400 font-medium">+{ref.commissionEarned}€</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commissions History */}
        <div>
          <h2 className="text-lg font-serif text-foreground mb-4">Historique des commissions</h2>
          {!commissions || commissions.length === 0 ? (
            <div className="text-center py-8 bg-card/20 rounded-lg border border-border/30">
              <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune commission pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map((com: any) => (
                <div key={com.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{com.sourceType}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(com.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">+{com.amount}{com.currency || "€"}</p>
                    <p className={`text-xs ${com.status === "paid" ? "text-green-400" : com.status === "pending" ? "text-primary" : "text-muted-foreground"}`}>
                      {com.status === "paid" ? "Payé" : com.status === "pending" ? "En attente" : com.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-5">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
