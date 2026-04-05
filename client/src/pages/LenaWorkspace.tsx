import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  FileText, Package, Map, Users, CheckCircle2, Clock, Archive,
  Globe, Star, Trash2, Eye, Edit3, ArrowLeft, RefreshCw,
  Sparkles, BookOpen, Route, ShieldCheck, AlertCircle, Plus
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type SeoCard = {
  id: number; slug: string; title: string; subtitle?: string | null;
  category: string; city: string; country: string;
  status: string; isVerified: boolean; lenaCreated: boolean;
  sourceType?: string | null; fieldReportId?: number | null;
  generatedBy: string; viewCount?: number | null;
  createdAt: Date; updatedAt: Date;
};

type Bundle = {
  id: number; slug: string; title: string; subtitle?: string | null;
  category: string; destination?: string | null; duration?: string | null;
  status: string; isVerified: boolean; lenaCreated: boolean;
  sourceType?: string | null; accessLevel: string;
  viewCount?: number | null; bookingCount?: number | null;
  createdAt: Date; updatedAt: Date;
};

type Parcours = {
  id: number; title: string; description?: string | null;
  destination?: string | null; tripType?: string | null;
  budget?: string | null; duration?: number | null;
  visibility: string; isVerified: boolean; isLenaGenerated: boolean;
  lenaDecision?: string | null; viewCount?: number | null; saveCount?: number | null;
  userId: number; createdAt: Date; updatedAt: Date;
};

// ─── Badge helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Brouillon", variant: "secondary" },
    published: { label: "Publié", variant: "default" },
    archived: { label: "Archivé", variant: "destructive" },
  };
  const cfg = map[status] || { label: status, variant: "outline" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function VerifiedBadge({ isVerified }: { isVerified: boolean }) {
  return isVerified ? (
    <Badge className="bg-emerald-600 text-white gap-1"><ShieldCheck className="w-3 h-3" />Vérifié</Badge>
  ) : (
    <Badge variant="outline" className="text-amber-600 border-amber-400 gap-1"><AlertCircle className="w-3 h-3" />Non vérifié</Badge>
  );
}

function SourceBadge({ source, lenaCreated }: { source?: string | null; lenaCreated: boolean }) {
  if (lenaCreated) return <Badge className="bg-violet-600 text-white gap-1"><Sparkles className="w-3 h-3" />LÉNA</Badge>;
  if (source === "field_report") return <Badge className="bg-blue-600 text-white gap-1"><Map className="w-3 h-3" />Terrain</Badge>;
  if (source === "ai_auto") return <Badge className="bg-sky-600 text-white gap-1"><RefreshCw className="w-3 h-3" />IA Auto</Badge>;
  return <Badge variant="outline">Manuel</Badge>;
}

function LenaDecisionBadge({ decision }: { decision?: string | null }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-amber-500" },
    keep: { label: "Conservé", color: "bg-emerald-600" },
    delete: { label: "À supprimer", color: "bg-red-600" },
    convert_bundle: { label: "→ Bundle", color: "bg-violet-600" },
    convert_seocard: { label: "→ Fiche SEO", color: "bg-blue-600" },
  };
  const cfg = map[decision || "pending"] || { label: decision || "—", color: "bg-gray-500" };
  return <Badge className={`${cfg.color} text-white`}>{cfg.label}</Badge>;
}

// ─── Fiches Tab ──────────────────────────────────────────────────────────────

function FichesTab({ fiches, onRefresh }: { fiches: SeoCard[]; onRefresh: () => void }) {
  const decideFiche = trpc.lena.decideFiche.useMutation({ onSuccess: () => { toast.success("Fiche mise à jour"); onRefresh(); } });
  const [filter, setFilter] = useState("all");

  const filtered = fiches.filter(f => {
    if (filter === "lena") return f.lenaCreated;
    if (filter === "verified") return f.isVerified;
    if (filter === "draft") return f.status === "draft";
    if (filter === "published") return f.status === "published";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {["all", "lena", "verified", "draft", "published"].map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-[#C9A84C] text-black hover:bg-[#b8973d]" : ""}>
              {f === "all" ? `Toutes (${fiches.length})` :
               f === "lena" ? `LÉNA (${fiches.filter(x => x.lenaCreated).length})` :
               f === "verified" ? `Vérifiées (${fiches.filter(x => x.isVerified).length})` :
               f === "draft" ? `Brouillons (${fiches.filter(x => x.status === "draft").length})` :
               `Publiées (${fiches.filter(x => x.status === "published").length})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune fiche dans cette catégorie</p>
          </div>
        )}
        {filtered.map(fiche => (
          <Card key={fiche.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white truncate">{fiche.title}</span>
                    <StatusBadge status={fiche.status} />
                    <VerifiedBadge isVerified={fiche.isVerified} />
                    <SourceBadge source={fiche.sourceType} lenaCreated={fiche.lenaCreated} />
                  </div>
                  <div className="text-sm text-zinc-400">
                    {fiche.category} · {fiche.city}, {fiche.country}
                    {fiche.fieldReportId && <span className="ml-2 text-blue-400">· Rapport #{fiche.fieldReportId}</span>}
                    <span className="ml-2">· {fiche.viewCount || 0} vues</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!fiche.isVerified && (
                    <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-400 hover:bg-emerald-900"
                      onClick={() => decideFiche.mutate({ id: fiche.id, isVerified: true })}>
                      <ShieldCheck className="w-3 h-3 mr-1" />Vérifier
                    </Button>
                  )}
                  {fiche.status === "draft" && (
                    <Button size="sm" className="bg-[#C9A84C] text-black hover:bg-[#b8973d]"
                      onClick={() => decideFiche.mutate({ id: fiche.id, status: "published" })}>
                      <Globe className="w-3 h-3 mr-1" />Publier
                    </Button>
                  )}
                  {fiche.status === "published" && (
                    <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900"
                      onClick={() => decideFiche.mutate({ id: fiche.id, status: "archived" })}>
                      <Archive className="w-3 h-3 mr-1" />Archiver
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Bundles Tab ─────────────────────────────────────────────────────────────

function BundlesTab({ bundles, onRefresh }: { bundles: Bundle[]; onRefresh: () => void }) {
  const decideBundle = trpc.lena.decideBundle.useMutation({ onSuccess: () => { toast.success("Bundle mis à jour"); onRefresh(); } });
  const [filter, setFilter] = useState("all");

  const filtered = bundles.filter(b => {
    if (filter === "lena") return b.lenaCreated;
    if (filter === "verified") return b.isVerified;
    if (filter === "draft") return b.status === "draft";
    if (filter === "published") return b.status === "published";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "lena", "verified", "draft", "published"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-[#C9A84C] text-black hover:bg-[#b8973d]" : ""}>
            {f === "all" ? `Tous (${bundles.length})` :
             f === "lena" ? `LÉNA (${bundles.filter(x => x.lenaCreated).length})` :
             f === "verified" ? `Vérifiés (${bundles.filter(x => x.isVerified).length})` :
             f === "draft" ? `Brouillons (${bundles.filter(x => x.status === "draft").length})` :
             `Publiés (${bundles.filter(x => x.status === "published").length})`}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun bundle dans cette catégorie</p>
          </div>
        )}
        {filtered.map(bundle => (
          <Card key={bundle.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white truncate">{bundle.title}</span>
                    <StatusBadge status={bundle.status} />
                    <VerifiedBadge isVerified={bundle.isVerified} />
                    <SourceBadge source={bundle.sourceType} lenaCreated={bundle.lenaCreated} />
                  </div>
                  <div className="text-sm text-zinc-400">
                    {bundle.category} · {bundle.destination || "Destination libre"}
                    {bundle.duration && <span> · {bundle.duration}</span>}
                    <span className="ml-2">· {bundle.viewCount || 0} vues · {bundle.bookingCount || 0} réservations</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!bundle.isVerified && (
                    <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-400 hover:bg-emerald-900"
                      onClick={() => decideBundle.mutate({ id: bundle.id, isVerified: true })}>
                      <ShieldCheck className="w-3 h-3 mr-1" />Vérifier
                    </Button>
                  )}
                  {bundle.status === "draft" && (
                    <Button size="sm" className="bg-[#C9A84C] text-black hover:bg-[#b8973d]"
                      onClick={() => decideBundle.mutate({ id: bundle.id, status: "published" })}>
                      <Globe className="w-3 h-3 mr-1" />Publier
                    </Button>
                  )}
                  {bundle.status === "published" && (
                    <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900"
                      onClick={() => decideBundle.mutate({ id: bundle.id, status: "archived" })}>
                      <Archive className="w-3 h-3 mr-1" />Archiver
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Parcours Tab ─────────────────────────────────────────────────────────────

function ParcoursTab({ parcours, saves, onRefresh }: { parcours: Parcours[]; saves: any[]; onRefresh: () => void }) {
  const decideParcours = trpc.lena.decideParcours.useMutation({ onSuccess: () => { toast.success("Décision enregistrée"); onRefresh(); } });
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decision, setDecision] = useState("keep");
  const [notes, setNotes] = useState("");

  const filtered = parcours.filter(p => {
    if (filter === "lena") return p.isLenaGenerated;
    if (filter === "verified") return p.isVerified;
    if (filter === "pending") return p.lenaDecision === "pending";
    if (filter === "keep") return p.lenaDecision === "keep";
    return true;
  });

  const getSaveCount = (id: number) => saves.filter(s => s.destinationId === id).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "lena", "pending", "keep", "verified"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-[#C9A84C] text-black hover:bg-[#b8973d]" : ""}>
            {f === "all" ? `Tous (${parcours.length})` :
             f === "lena" ? `LÉNA (${parcours.filter(x => x.isLenaGenerated).length})` :
             f === "pending" ? `En attente (${parcours.filter(x => x.lenaDecision === "pending").length})` :
             f === "keep" ? `Conservés (${parcours.filter(x => x.lenaDecision === "keep").length})` :
             `Vérifiés (${parcours.filter(x => x.isVerified).length})`}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun parcours dans cette catégorie</p>
          </div>
        )}
        {filtered.map(p => {
          const clientSaves = getSaveCount(p.id);
          return (
            <Card key={p.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white truncate">{p.title}</span>
                      {p.isLenaGenerated && <Badge className="bg-violet-600 text-white gap-1"><Sparkles className="w-3 h-3" />LÉNA</Badge>}
                      <VerifiedBadge isVerified={p.isVerified} />
                      <LenaDecisionBadge decision={p.lenaDecision} />
                    </div>
                    <div className="text-sm text-zinc-400">
                      {p.tripType || "Loisirs"} · {p.destination || "Destination libre"}
                      {p.budget && <span> · {p.budget}</span>}
                      {p.duration && <span> · {p.duration}j</span>}
                      <span className="ml-2">· {p.viewCount || 0} vues</span>
                      {clientSaves > 0 && (
                        <span className="ml-2 text-[#C9A84C] font-medium">· ⭐ {clientSaves} enregistrement{clientSaves > 1 ? "s" : ""} client</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="border-zinc-600"
                      onClick={() => { setSelectedId(p.id); setDecision(p.lenaDecision || "keep"); setNotes(""); }}>
                      <Edit3 className="w-3 h-3 mr-1" />Décider
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog décision LÉNA */}
      <Dialog open={selectedId !== null} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Décision LÉNA sur ce parcours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Décision</label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="keep">Conserver</SelectItem>
                  <SelectItem value="delete">Supprimer</SelectItem>
                  <SelectItem value="convert_bundle">Convertir en Bundle</SelectItem>
                  <SelectItem value="convert_seocard">Convertir en Fiche SEO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Notes LÉNA (optionnel)</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Justification de la décision..."
                className="bg-zinc-800 border-zinc-700 text-white" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedId(null)}>Annuler</Button>
            <Button className="bg-[#C9A84C] text-black hover:bg-[#b8973d]"
              disabled={decideParcours.isPending}
              onClick={() => {
                if (selectedId) {
                  decideParcours.mutate({
                    id: selectedId,
                    lenaDecision: decision as any,
                    lenaDecisionNotes: notes || undefined,
                  });
                  setSelectedId(null);
                }
              }}>
              Confirmer la décision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ data }: { data: any }) {
  const { lenaContent, allFiches, allBundles, allParcours, saves } = data;

  const stats = [
    { label: "Fiches SEO totales", value: allFiches.length, sub: `${lenaContent.fiches.length} créées par LÉNA`, icon: FileText, color: "text-blue-400" },
    { label: "Bundles totaux", value: allBundles.length, sub: `${lenaContent.bundles.length} créés par LÉNA`, icon: Package, color: "text-violet-400" },
    { label: "Parcours totaux", value: allParcours.length, sub: `${lenaContent.parcours.length} générés par LÉNA`, icon: Route, color: "text-emerald-400" },
    { label: "Enregistrements clients", value: saves.length, sub: "parcours sauvegardés", icon: Star, color: "text-[#C9A84C]" },
    { label: "Fiches vérifiées", value: allFiches.filter((f: SeoCard) => f.isVerified).length, sub: `sur ${allFiches.length} fiches`, icon: ShieldCheck, color: "text-emerald-400" },
    { label: "Fiches publiées", value: allFiches.filter((f: SeoCard) => f.status === "published").length, sub: "en ligne", icon: Globe, color: "text-sky-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{s.sub}</p>
                </div>
                <s.icon className={`w-6 h-6 ${s.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-[#C9A84C] text-base flex items-center gap-2">
            <Star className="w-4 h-4" />Enregistrements clients récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saves.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucun enregistrement pour l'instant</p>
          ) : (
            <div className="space-y-2">
              {saves.slice(0, 10).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b border-zinc-800 pb-2">
                  <span className="text-zinc-300">Parcours #{s.destinationId}</span>
                  <span className="text-zinc-500">Client #{s.userId}</span>
                  <span className="text-zinc-500">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LenaWorkspace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");

  const { data, isLoading, refetch } = trpc.lena.adminContent.useQuery(undefined, {
    enabled: !!user && (user.role === "admin"),
  });

  if (!user || (user.role !== "admin" && user.role !== "team")) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center max-w-md">
          <ShieldCheck className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Accès restreint</h2>
          <p className="text-zinc-400 mb-4">Cette page est réservée à l'équipe Baymora.</p>
          <Link href="/"><Button variant="outline">Retour à l'accueil</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pilotage">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" />Pilotage
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-lg">
                🧠
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">LÉNA Workspace</h1>
                <p className="text-xs text-zinc-400">Gestion interne — Fiches · Bundles · Parcours</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-violet-900 text-violet-200 border-violet-700">
              <Sparkles className="w-3 h-3 mr-1" />Binôme LÉNA + SCOUT
            </Badge>
            <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => refetch()}>
              <RefreshCw className="w-3 h-3 mr-1" />Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">LÉNA charge le contenu interne...</p>
            </div>
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-zinc-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Accès admin requis pour voir le contenu LÉNA</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
              <TabsTrigger value="stats" className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black">
                <Star className="w-4 h-4 mr-1" />Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="fiches" className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black">
                <FileText className="w-4 h-4 mr-1" />
                Fiches SEO
                <Badge className="ml-1 bg-zinc-700 text-zinc-300 text-xs">{data.allFiches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="bundles" className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black">
                <Package className="w-4 h-4 mr-1" />
                Bundles
                <Badge className="ml-1 bg-zinc-700 text-zinc-300 text-xs">{data.allBundles.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="parcours" className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black">
                <Route className="w-4 h-4 mr-1" />
                Parcours
                <Badge className="ml-1 bg-zinc-700 text-zinc-300 text-xs">{data.allParcours.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <StatsTab data={data} />
            </TabsContent>

            <TabsContent value="fiches">
              <FichesTab fiches={data.allFiches as SeoCard[]} onRefresh={refetch} />
            </TabsContent>

            <TabsContent value="bundles">
              <BundlesTab bundles={data.allBundles as Bundle[]} onRefresh={refetch} />
            </TabsContent>

            <TabsContent value="parcours">
              <ParcoursTab parcours={data.allParcours as Parcours[]} saves={data.saves} onRefresh={refetch} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
