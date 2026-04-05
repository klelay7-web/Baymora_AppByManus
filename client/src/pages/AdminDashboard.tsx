import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  ArrowLeft, Users, FileText, BarChart3, Zap, Globe, Plus,
  TrendingUp, Eye, DollarSign, Loader2, Brain, Target,
  TrendingDown, Activity, CreditCard, Server, UserPlus,
  ChevronRight, Crown, Sparkles, Building2, LayoutDashboard
} from "lucide-react";
import BackNav from "@/components/BackNav";
import { toast } from "sonner";

const GOLD = "#c8a94a";
const NAVY = "#080c14";

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1525] border border-white/10 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-white/60 mb-2 font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}: <strong>{typeof p.value === "number" && p.name?.includes("€") || p.dataKey?.includes("revenue") || p.dataKey?.includes("costs") || p.dataKey?.includes("profit")
              ? `${p.value.toFixed(0)}€`
              : p.value}
            </strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: revenue, isLoading: revenueLoading } = trpc.admin.getRevenueStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: affiliateStats } = trpc.affiliate.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: allCards } = trpc.seo.getAllCards.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const [showGenerate, setShowGenerate] = useState(false);
  const [genName, setGenName] = useState("");
  const [genCategory, setGenCategory] = useState<string>("restaurant");
  const [genCity, setGenCity] = useState("");
  const [genCountry, setGenCountry] = useState("France");

  const generateCard = trpc.seo.generateCard.useMutation({
    onSuccess: (data) => {
      toast.success(`Fiche #${data.cardId} générée avec succès !`);
      setShowGenerate(false);
      setGenName(""); setGenCity("");
    },
    onError: (err) => toast.error(err.message),
  });

  const publishCard = trpc.seo.publishCard.useMutation({
    onSuccess: () => toast.success("Fiche publiée !"),
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
        <div className="text-center text-white">
          <Crown className="mx-auto mb-4 text-[#c8a94a]" size={40} />
          <h2 className="font-['Playfair_Display'] text-2xl font-bold mb-3">Accès réservé</h2>
          <p className="text-white/40 text-sm mb-6">Cette page est réservée aux administrateurs.</p>
          <Link href="/"><Button variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a]">Retour à l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  const isLoading = statsLoading || revenueLoading;

  // Prepare chart data
  const monthlyData = revenue?.monthlyData || [];
  const profitData = monthlyData.map((d: any) => ({
    ...d,
    profit: d.revenue - d.costs,
  }));

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      <BackNav
        title="Centre de Gestion"
        icon={<LayoutDashboard size={16} />}
        backHref="/"
        backLabel="Accueil"
        breadcrumb={[
          { label: "Accueil", href: "/" },
          { label: "Dashboard Admin" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── KPIs Financiers ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-[#c8a94a]" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/60">Finances & Rentabilité</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: TrendingUp, label: "Revenus totaux", value: isLoading ? "—" : `${revenue?.totalRevenue?.toFixed(0) || 0}€`,
                sub: `Abonnements + crédits + commissions`, color: "text-green-400", bg: "bg-green-400/5 border-green-400/15"
              },
              {
                icon: TrendingDown, label: "Coûts totaux", value: isLoading ? "—" : `${revenue?.totalCosts?.toFixed(0) || 0}€`,
                sub: `IA ${revenue?.aiCosts?.toFixed(0) || 0}€ + Infra ${revenue?.infraCosts || 0}€`, color: "text-red-400", bg: "bg-red-400/5 border-red-400/15"
              },
              {
                icon: Activity, label: "Bénéfice net", value: isLoading ? "—" : `${revenue?.netProfit?.toFixed(0) || 0}€`,
                sub: `Marge ${revenue?.margin || 0}%`, color: (revenue?.netProfit || 0) >= 0 ? "text-[#c8a94a]" : "text-red-400", bg: "bg-[#c8a94a]/5 border-[#c8a94a]/15"
              },
              {
                icon: Target, label: "Marge bénéficiaire", value: isLoading ? "—" : `${revenue?.margin || 0}%`,
                sub: `Objectif : 60%`, color: (revenue?.margin || 0) >= 60 ? "text-green-400" : (revenue?.margin || 0) >= 30 ? "text-[#c8a94a]" : "text-red-400",
                bg: "bg-white/3 border-white/8"
              },
            ].map((item, i) => (
              <div key={i} className={`border rounded-none p-5 ${item.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <item.icon size={14} className={item.color} />
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">{item.label}</span>
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-white/30 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Détail Revenus ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: CreditCard, label: "Abonnements", value: `${revenue?.subscriptionRevenue?.toFixed(0) || 0}€`, sub: `${revenue?.premiumUsers || 0} Premium × 29,90€ + ${revenue?.eliteUsers || 0} Élite × 89,90€` },
            { icon: Zap, label: "Crédits à la carte", value: `${revenue?.creditRevenue?.toFixed(0) || 0}€`, sub: "Achats de crédits supplémentaires" },
            { icon: Globe, label: "Commissions affiliation", value: `${revenue?.commissionRevenue?.toFixed(0) || 0}€`, sub: `${affiliateStats?.totalConversions || 0} conversions réalisées` },
          ].map((item, i) => (
            <div key={i} className="border border-white/8 bg-white/2 p-5">
              <div className="flex items-center gap-2 mb-3">
                <item.icon size={14} className="text-[#c8a94a]" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-xl font-bold text-[#c8a94a]">{item.value}</p>
              <p className="text-[10px] text-white/30 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Courbe Revenus / Coûts / Bénéfice ──────────────────── */}
        <div className="border border-white/8 bg-[#0a0f1a] p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={16} className="text-[#c8a94a]" />
            <h3 className="text-sm font-semibold">Évolution Financière — 6 derniers mois</h3>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#c8a94a]" size={24} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={profitData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8a94a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c8a94a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }} />
                <Area type="monotone" dataKey="revenue" name="Revenus (€)" stroke="#c8a94a" fill="url(#gradRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="costs" name="Coûts (€)" stroke="#ef4444" fill="url(#gradCosts)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Bénéfice (€)" stroke="#22c55e" fill="url(#gradProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── KPIs Utilisateurs ───────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-[#c8a94a]" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/60">Utilisateurs & Croissance</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Total inscrits", value: isLoading ? "—" : revenue?.totalUsers || stats?.totalUsers || 0, sub: "Tous comptes confondus", color: "text-white" },
              { icon: UserPlus, label: "Nouveaux ce mois", value: isLoading ? "—" : revenue?.newUsersThisMonth || 0, sub: `${revenue?.userGrowthRate || 0}% vs mois dernier`, color: (revenue?.userGrowthRate || 0) >= 0 ? "text-green-400" : "text-red-400" },
              { icon: Crown, label: "Membres Premium", value: isLoading ? "—" : revenue?.premiumUsers || stats?.premiumUsers || 0, sub: "29,90€/mois", color: "text-[#c8a94a]" },
              { icon: Sparkles, label: "Membres Élite", value: isLoading ? "—" : revenue?.eliteUsers || 0, sub: "89,90€/mois — bientôt", color: "text-purple-400" },
            ].map((item, i) => (
              <div key={i} className="border border-white/8 bg-white/2 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <item.icon size={14} className={item.color} />
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">{item.label}</span>
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-white/30 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Courbe Croissance Utilisateurs ──────────────────────── */}
        <div className="border border-white/8 bg-[#0a0f1a] p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-[#c8a94a]" />
            <h3 className="text-sm font-semibold">Croissance Utilisateurs — 6 derniers mois</h3>
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#c8a94a]" size={24} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" name="Utilisateurs" fill="#c8a94a" opacity={0.8} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Coûts IA & Infrastructure ───────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-[#c8a94a]" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/60">Coûts IA & Infrastructure</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Brain, label: "Coûts IA (messages)", value: `${revenue?.aiCosts?.toFixed(2) || "0.00"}€`, sub: `~0,02€ par message IA`, color: "text-purple-400" },
              { icon: Server, label: "Infrastructure", value: `${revenue?.infraCosts || 0}€/mois`, sub: "Hébergement, base de données, CDN", color: "text-blue-400" },
              { icon: Activity, label: "Coût par utilisateur", value: revenue?.totalUsers ? `${((revenue?.totalCosts || 0) / revenue.totalUsers).toFixed(2)}€` : "—", sub: "Coût moyen par membre actif", color: "text-[#c8a94a]" },
            ].map((item, i) => (
              <div key={i} className="border border-white/8 bg-white/2 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <item.icon size={14} className={item.color} />
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">{item.label}</span>
                </div>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-white/30 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Raccourcis Admin ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-[#c8a94a]" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/60">Accès Rapide</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/admin/command-center", icon: Brain, label: "Salle de Réunion IA", sub: "Agents, directives, KPIs" },
              { href: "/admin/seo-fiches", icon: FileText, label: "Fiches SEO", sub: `${stats?.totalCards || 0} fiches` },
              { href: "/admin/partners-commissions", icon: Globe, label: "Affiliations & Partenaires", sub: `${affiliateStats?.totalClicks || 0} clics` },
              { href: "/admin/partners-commissions", icon: DollarSign, label: "Commissions", sub: `${affiliateStats?.totalCommission?.toFixed(0) || 0}€ total` },
              { href: "/admin/content-social", icon: Sparkles, label: "Social Media", sub: "Calendrier éditorial" },
              { href: "/admin/seo-fiches", icon: Zap, label: "IA SEO Autonome", sub: "Agents 24/7" },
              { href: "/team/fiches", icon: Building2, label: "Rapports Terrain", sub: "Fiches membres équipe" },
              { href: "/discover", icon: Eye, label: "Établissements", sub: `${stats?.totalEstablishments || 0} fiches publiées` },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="group border border-white/8 bg-white/2 hover:border-[#c8a94a]/30 hover:bg-[#c8a94a]/5 p-4 cursor-pointer transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <item.icon size={16} className="text-[#c8a94a]" />
                    <ChevronRight size={12} className="text-white/20 group-hover:text-[#c8a94a] transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Générateur de Fiches SEO ─────────────────────────────── */}
        <div className="border border-white/8 bg-[#0a0f1a] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-[#c8a94a]" />
              <h3 className="font-['Playfair_Display'] font-semibold">Générateur de Fiches SEO</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-[#c8a94a] gap-1 text-xs" onClick={() => setShowGenerate(!showGenerate)}>
              <Plus size={14} /> Nouvelle fiche
            </Button>
          </div>

          {showGenerate && (
            <div className="bg-white/3 border border-white/8 p-4 mb-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={genName} onChange={(e) => setGenName(e.target.value)} placeholder="Nom du lieu (ex: Le Cinq)"
                  className="w-full bg-[#080c14] border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8a94a]/50" />
                <select value={genCategory} onChange={(e) => setGenCategory(e.target.value)}
                  className="w-full bg-[#080c14] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c8a94a]/50">
                  <option value="restaurant">Restaurant</option>
                  <option value="hotel">Hôtel</option>
                  <option value="activity">Activité</option>
                  <option value="bar">Bar</option>
                  <option value="spa">Spa</option>
                  <option value="experience">Expérience</option>
                  <option value="wellness">Wellness / Clinique</option>
                </select>
                <input type="text" value={genCity} onChange={(e) => setGenCity(e.target.value)} placeholder="Ville (ex: Istanbul)"
                  className="w-full bg-[#080c14] border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8a94a]/50" />
                <input type="text" value={genCountry} onChange={(e) => setGenCountry(e.target.value)} placeholder="Pays"
                  className="w-full bg-[#080c14] border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8a94a]/50" />
              </div>
              <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] w-full rounded-none font-semibold gap-2"
                onClick={() => genName && genCity && generateCard.mutate({ name: genName, category: genCategory as any, city: genCity, country: genCountry })}
                disabled={!genName || !genCity || generateCard.isPending}>
                {generateCard.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Générer avec l'IA
              </Button>
            </div>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allCards?.slice(0, 10).map((card) => (
              <div key={card.id} className="flex items-center justify-between bg-white/3 border border-white/5 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white/80">{card.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#c8a94a] uppercase">{card.category}</span>
                    <span className="text-[10px] text-white/30">{card.city}</span>
                    <Badge className={`text-[9px] rounded-none px-1.5 py-0 ${card.status === "published" ? "bg-green-500/10 text-green-400 border-green-400/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-400/20"}`}>
                      {card.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="flex items-center gap-1 text-[10px] text-white/30">
                    <Eye size={11} /> {card.viewCount}
                  </div>
                  {card.status === "draft" && (
                    <Button size="sm" variant="ghost" className="text-[#c8a94a] text-xs h-7 rounded-none" onClick={() => publishCard.mutate({ id: card.id })}>
                      Publier
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!allCards || allCards.length === 0) && (
              <p className="text-sm text-white/30 text-center py-8">Aucune fiche. Utilisez le générateur ci-dessus.</p>
            )}
            {allCards && allCards.length > 10 && (
              <Link href="/admin/seo-fiches">
                <p className="text-center text-xs text-[#c8a94a] py-3 hover:underline cursor-pointer">
                  Voir toutes les {allCards.length} fiches →
                </p>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
