import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2, DollarSign, Users, TrendingUp, Plus, Search,
  Globe, Phone, Mail, Star, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Wallet, PieChart
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdminPartnersCommissions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("providers");

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div>
            <p className="text-primary text-sm tracking-widest uppercase mb-1">Administration</p>
            <h1 className="text-3xl font-serif text-foreground">Partenaires & Commissions</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="providers">Prestataires</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="ambassadors">Ambassadeurs</TabsTrigger>
          </TabsList>

          <TabsContent value="providers"><ProvidersPanel /></TabsContent>
          <TabsContent value="commissions"><CommissionsPanel /></TabsContent>
          <TabsContent value="ambassadors"><AmbassadorsAdminPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProvidersPanel() {
  const { data: providers, isLoading } = trpc.providers.list.useQuery();
  const [search, setSearch] = useState("");

  const filtered = providers?.filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(providers?.map((p: any) => p.category) || []));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total" value={(providers?.length || 0).toString()} color="text-blue-400" />
        <StatCard icon={CheckCircle2} label="Actifs" value={(providers?.filter((p: any) => p.status === "active").length || 0).toString()} color="text-green-400" />
        <StatCard icon={Clock} label="En attente" value={(providers?.filter((p: any) => p.status === "pending").length || 0).toString()} color="text-orange-400" />
        <StatCard icon={Globe} label="Catégories" value={categories.length.toString()} color="text-primary" />
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un prestataire..." className="pl-9 bg-card/30 border-border/30" />
        </div>
        <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2" onClick={() => toast.info("Fonctionnalité à venir")}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun prestataire</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez vos premiers partenaires prestataires</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((prov: any) => (
            <div key={prov.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between hover:border-border/50 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0`}>
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{prov.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-primary">{prov.category}</span>
                    {prov.city && <span className="text-xs text-muted-foreground">{prov.city}, {prov.country}</span>}
                    {prov.commissionRate && <span className="text-xs text-green-400">{prov.commissionRate}% commission</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {prov.contactEmail && <Mail className="w-4 h-4 text-muted-foreground" />}
                {prov.contactPhone && <Phone className="w-4 h-4 text-muted-foreground" />}
                <span className={`text-xs px-2 py-0.5 rounded ${
                  prov.status === "active" ? "bg-green-500/10 text-green-400" :
                  prov.status === "pending" ? "bg-orange-500/10 text-orange-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {prov.status === "active" ? "Actif" : prov.status === "pending" ? "En attente" : prov.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommissionsPanel() {
  const { data: commissions, isLoading } = trpc.commissions.list.useQuery();
  const { data: stats } = trpc.commissions.stats.useQuery();

  const totalPaid = commissions?.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + parseFloat(c.amount || "0"), 0) || 0;
  const totalPending = commissions?.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + parseFloat(c.amount || "0"), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total versé" value={`${totalPaid.toFixed(0)}€`} color="text-green-400" />
        <StatCard icon={Clock} label="En attente" value={`${totalPending.toFixed(0)}€`} color="text-orange-400" />
        <StatCard icon={Wallet} label="Transactions" value={(commissions?.length || 0).toString()} color="text-blue-400" />
        <StatCard icon={TrendingUp} label="Ce mois" value={`${(stats as any)?.monthlyTotal || 0}€`} color="text-primary" />
      </div>

      {/* Commission List */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !commissions || commissions.length === 0 ? (
        <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune commission enregistrée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {commissions.map((com: any) => (
            <div key={com.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  com.recipientType === "ambassador" ? "bg-purple-500/10" :
                  com.recipientType === "partner" ? "bg-blue-500/10" :
                  "bg-green-500/10"
                }`}>
                  {com.recipientType === "ambassador" ? <Users className="w-4 h-4 text-purple-400" /> :
                   com.recipientType === "partner" ? <Building2 className="w-4 h-4 text-blue-400" /> :
                   <Star className="w-4 h-4 text-green-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{com.recipientName || `#${com.recipientId}`}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary">{com.recipientType}</span>
                    <span className="text-xs text-muted-foreground">{com.sourceType}</span>
                    <span className="text-xs text-muted-foreground">{new Date(com.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${com.status === "paid" ? "text-green-400" : "text-primary"}`}>
                  {com.amount}{com.currency || "€"}
                </p>
                <span className={`text-xs ${com.status === "paid" ? "text-green-400" : com.status === "pending" ? "text-orange-400" : "text-muted-foreground"}`}>
                  {com.status === "paid" ? "Payé" : com.status === "pending" ? "En attente" : com.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AmbassadorsAdminPanel() {
  const { data: ambassadors, isLoading } = trpc.ambassador.all.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{ambassadors?.length || 0} ambassadeurs inscrits</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !ambassadors || ambassadors.length === 0 ? (
        <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun ambassadeur inscrit</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ambassadors.map((amb: any) => (
            <div key={amb.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ambassadeur #{amb.userId}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-primary">{amb.referralCode}</code>
                    <span className="text-xs text-muted-foreground">Tier: {amb.tier}</span>
                    <span className="text-xs text-green-400">{amb.totalEarned || "0"}€ gagné</span>
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                amb.status === "active" ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
              }`}>
                {amb.status === "active" ? "Actif" : amb.status}
              </span>
            </div>
          ))}
        </div>
      )}
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
