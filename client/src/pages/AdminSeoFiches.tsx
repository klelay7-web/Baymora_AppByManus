import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Eye, Edit2, Trash2, Globe, TrendingUp,
  FileText, Image, CheckCircle2, Clock, AlertTriangle, Filter, ExternalLink
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminSeoFiches() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("seo-cards");
  const [searchQuery, setSearchQuery] = useState("");

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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm tracking-widest uppercase mb-1">Administration</p>
              <h1 className="text-3xl font-serif text-foreground">SEO & Fiches</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9 bg-card/30 border-border/30 w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="seo-cards">Fiches SEO</TabsTrigger>
            <TabsTrigger value="establishments">Établissements</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
          </TabsList>

          <TabsContent value="seo-cards">
            <SeoCardsPanel searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="establishments">
            <EstablishmentsPanel searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="bundles">
            <BundlesPanel searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SeoCardsPanel({ searchQuery }: { searchQuery: string }) {
  const { data: cards, isLoading } = trpc.seo.getAllCards.useQuery();

  const filtered = cards?.filter((c: any) =>
    !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered?.length || 0} fiches SEO</p>
        <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2" onClick={() => toast.info("Génération IA en cours...")}>
          <Plus className="w-4 h-4" /> Générer avec l'IA
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={FileText} message="Aucune fiche SEO" sub="Créez votre première fiche ou laissez l'IA les générer" />
      ) : (
        <div className="space-y-2">
          {filtered.map((card: any) => (
            <div key={card.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between group hover:border-border/50 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${card.status === "published" ? "bg-green-400" : "bg-orange-400"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{card.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">/discover/{card.slug}</span>
                    <span className="text-xs text-primary">{card.category}</span>
                    {card.location && <span className="text-xs text-muted-foreground">{card.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{card.viewCount || 0}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${card.status === "published" ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}`}>
                  {card.status === "published" ? "Publié" : "Brouillon"}
                </span>
                <Link href={`/discover/${card.slug}`}>
                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EstablishmentsPanel({ searchQuery }: { searchQuery: string }) {
  const { data: establishments, isLoading } = trpc.establishments.getAll.useQuery();

  const filtered = establishments?.filter((e: any) =>
    !searchQuery || e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered?.length || 0} établissements</p>
        <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2" onClick={() => toast.info("Fonctionnalité à venir")}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={Globe} message="Aucun établissement" sub="Ajoutez des hôtels, restaurants et expériences" />
      ) : (
        <div className="space-y-2">
          {filtered.map((est: any) => (
            <div key={est.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between hover:border-border/50 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${est.status === "published" ? "bg-green-400" : "bg-orange-400"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{est.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-primary">{est.category}</span>
                    {est.city && <span className="text-xs text-muted-foreground">{est.city}, {est.country}</span>}
                    {est.priceRange && <span className="text-xs text-muted-foreground">{est.priceRange}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {est.rating && (
                  <span className="text-xs text-primary">{est.rating}/5</span>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{est.viewCount || 0}</span>
                </div>
                <Link href={`/establishment/${est.slug}`}>
                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BundlesPanel({ searchQuery }: { searchQuery: string }) {
  const { data: bundles, isLoading } = trpc.bundles.all.useQuery();

  const filtered = bundles?.filter((b: any) =>
    !searchQuery || b.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered?.length || 0} bundles</p>
        <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2" onClick={() => toast.info("Fonctionnalité à venir")}>
          <Plus className="w-4 h-4" /> Créer un bundle
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={Image} message="Aucun bundle" sub="Créez des collections d'expériences curatées" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((bundle: any) => (
            <div key={bundle.id} className="bg-card/30 border border-border/30 rounded-lg p-5 hover:border-border/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{bundle.title}</p>
                  <p className="text-xs text-primary mt-1">{bundle.category} — {bundle.destination || "Multi-destinations"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  bundle.status === "published" ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
                }`}>
                  {bundle.status === "published" ? "Publié" : "Brouillon"}
                </span>
              </div>
              {bundle.subtitle && <p className="text-sm text-muted-foreground">{bundle.subtitle}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                {bundle.duration && <span>{bundle.duration}</span>}
                {bundle.priceFrom && <span>À partir de {bundle.priceFrom}€</span>}
                {bundle.accessLevel && <span className="text-primary">{bundle.accessLevel}</span>}
                {bundle.isVip && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">VIP</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
      <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
