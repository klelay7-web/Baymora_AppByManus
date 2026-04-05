import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, FileText, BarChart3, Zap, Globe, Plus,
  TrendingUp, Eye, MousePointer, DollarSign, Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: affiliateStats } = trpc.affiliate.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: allCards } = trpc.seo.getAllCards.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // SEO Card Generation
  const [showGenerate, setShowGenerate] = useState(false);
  const [genName, setGenName] = useState("");
  const [genCategory, setGenCategory] = useState<string>("restaurant");
  const [genCity, setGenCity] = useState("");
  const [genCountry, setGenCountry] = useState("France");

  const generateCard = trpc.seo.generateCard.useMutation({
    onSuccess: (data) => {
      toast.success(`Fiche #${data.cardId} générée avec succès !`);
      setShowGenerate(false);
      setGenName("");
      setGenCity("");
    },
    onError: (err) => toast.error(err.message),
  });

  const publishCard = trpc.seo.publishCard.useMutation({
    onSuccess: () => toast.success("Fiche publiée !"),
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold mb-3">Accès réservé</h2>
          <p className="text-muted-foreground text-sm mb-4">Cette page est réservée aux administrateurs.</p>
          <Link href="/">
            <Button variant="outline" className="border-gold/30 text-gold">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-gold/10 px-4 py-3 sticky top-0 z-20">
        <div className="container flex items-center gap-3">
          <Link href="/">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-gold transition-colors" />
          </Link>
          <h1 className="font-serif text-lg font-semibold flex-1">Administration</h1>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Utilisateurs", value: stats?.totalUsers || 0, sub: `${stats?.premiumUsers || 0} premium` },
            { icon: FileText, label: "Fiches SEO", value: stats?.totalCards || 0, sub: `${stats?.publishedCards || 0} publiées` },
            { icon: MousePointer, label: "Clics affiliation", value: affiliateStats?.totalClicks || 0, sub: `${affiliateStats?.totalConversions || 0} conversions` },
            { icon: DollarSign, label: "Commissions", value: `${affiliateStats?.totalCommission?.toFixed(0) || 0}€`, sub: `${affiliateStats?.pendingCommission?.toFixed(0) || 0}€ en attente` },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon size={16} className="text-gold" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* SEO Card Generator */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-gold" />
              <h3 className="font-serif font-semibold">Générateur de Fiches SEO</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gold gap-1"
              onClick={() => setShowGenerate(!showGenerate)}
            >
              <Plus size={14} />
              Nouvelle fiche
            </Button>
          </div>

          {showGenerate && (
            <div className="bg-secondary/50 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={genName}
                  onChange={(e) => setGenName(e.target.value)}
                  placeholder="Nom du lieu (ex: Le Cinq)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
                <select
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="hotel">Hôtel</option>
                  <option value="activity">Activité</option>
                  <option value="bar">Bar</option>
                  <option value="spa">Spa</option>
                  <option value="experience">Expérience</option>
                </select>
                <input
                  type="text"
                  value={genCity}
                  onChange={(e) => setGenCity(e.target.value)}
                  placeholder="Ville (ex: Paris)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
                <input
                  type="text"
                  value={genCountry}
                  onChange={(e) => setGenCountry(e.target.value)}
                  placeholder="Pays"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
              <Button
                className="bg-gold text-navy-dark hover:bg-gold-light w-full font-semibold gap-2"
                onClick={() => genName && genCity && generateCard.mutate({
                  name: genName,
                  category: genCategory as any,
                  city: genCity,
                  country: genCountry,
                })}
                disabled={!genName || !genCity || generateCard.isPending}
              >
                {generateCard.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Générer avec l'IA
              </Button>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {allCards?.map((card) => (
              <div key={card.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gold uppercase">{card.category}</span>
                    <span className="text-[10px] text-muted-foreground">{card.city}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      card.status === "published" ? "bg-green-500/10 text-green-400" :
                      card.status === "draft" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {card.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Eye size={12} />
                    {card.viewCount}
                  </div>
                  {card.status === "draft" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gold text-xs h-7"
                      onClick={() => publishCard.mutate({ id: card.id })}
                    >
                      Publier
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!allCards || allCards.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune fiche. Utilisez le générateur ci-dessus pour créer votre première fiche SEO.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
