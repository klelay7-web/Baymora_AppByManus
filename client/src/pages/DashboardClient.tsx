import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Heart, FolderOpen, MessageSquare, MapPin, CreditCard, Crown, ArrowRight, Star, Sparkles, Plus, ChevronRight, Route, Bookmark, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function DashboardClient() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-sm tracking-wider animate-pulse">Chargement de votre espace...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-primary/30 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-serif text-foreground">Mon Espace Baymora</h1>
          <p className="text-muted-foreground">Connectez-vous pour accéder à vos favoris, parcours et conversations.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm tracking-widest uppercase mb-1">Mon Espace</p>
              <h1 className="text-3xl font-serif text-foreground">
                Bienvenue, <span className="text-primary">{user.name?.split(" ")[0] || "Membre"}</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Membre {user.subscriptionTier || "Explorer"} {(user.subscriptionTier as string) === "elite" && "✦"}
              </p>
            </div>
            <Link href="/chat">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Sparkles className="w-4 h-4" />
                Parler à mon assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 mb-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
            <TabsTrigger value="trips">Mes Parcours</TabsTrigger>
            <TabsTrigger value="saved">Enregistrements</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab userId={user.id} tier={user.subscriptionTier} />
          </TabsContent>
          <TabsContent value="favorites">
            <FavoritesTab />
          </TabsContent>
          <TabsContent value="trips">
            <TripsTab />
          </TabsContent>
          <TabsContent value="saved">
            <SavedParcoursTab />
          </TabsContent>
          <TabsContent value="conversations">
            <ConversationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({ userId, tier }: { userId: number; tier?: string | null }) {
  const { data: balance } = trpc.credits.getBalance.useQuery();
  const { data: favorites } = trpc.favorites.list.useQuery();
  const { data: conversations } = trpc.chat.getConversations.useQuery();
  const { data: trips } = trpc.trips.getMyPlans.useQuery();

  const stats = [
    { icon: Heart, label: "Favoris", value: favorites?.length || 0, color: "text-red-400" },
    { icon: MessageSquare, label: "Conversations", value: conversations?.length || 0, color: "text-blue-400" },
    { icon: MapPin, label: "Parcours", value: trips?.length || 0, color: "text-green-400" },
    { icon: CreditCard, label: "Crédits", value: balance?.credits || 0, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card/50 border border-border/50 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="Parler à mon assistant"
          description="Demandez n'importe quoi à votre concierge IA"
          href="/chat"
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />
        <QuickAction
          title="Explorer les destinations"
          description="Découvrez nos sélections curatées"
          href="/discover"
          icon={<MapPin className="w-5 h-5 text-green-400" />}
        />
        <QuickAction
          title={(tier as string) === "elite" ? "Espace Élite" : "Passer Premium"}
          description={(tier as string) === "elite" ? "Accédez à vos avantages exclusifs" : "Débloquez l'accès illimité"}
          href="/pricing"
          icon={<Crown className="w-5 h-5 text-primary" />}
        />
      </div>

      {/* Recent Conversations */}
      {conversations && conversations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif text-foreground">Conversations récentes</h2>
            <button onClick={() => {}} className="text-primary text-sm hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {conversations.slice(0, 3).map((conv: any) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <div className="bg-card/30 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{conv.title || "Conversation"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ title, description, href, icon }: { title: string; description: string; href: string; icon: React.ReactNode }) {
  return (
    <Link href={href}>
      <div className="bg-card/30 border border-border/30 rounded-lg p-5 hover:border-primary/30 transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="font-medium text-foreground group-hover:text-primary transition-colors">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FavoritesTab() {
  const { data: favorites, isLoading } = trpc.favorites.list.useQuery();
  const { data: collections } = trpc.collections.list.useQuery();
  const removeFav = trpc.favorites.remove.useMutation();

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Chargement des favoris...</div>;

  return (
    <div className="space-y-6">
      {/* Collections */}
      {collections && collections.length > 0 && (
        <div>
          <h2 className="text-lg font-serif text-foreground mb-4">Mes Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {collections.map((col: any) => (
              <div key={col.id} className="bg-card/30 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
                <FolderOpen className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-sm text-foreground">{col.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{col.description || "Collection"}</p>
              </div>
            ))}
            <div className="bg-card/10 border border-dashed border-border/50 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* All Favorites */}
      <div>
        <h2 className="text-lg font-serif text-foreground mb-4">Tous les favoris</h2>
        {!favorites || favorites.length === 0 ? (
          <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
            <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun favori pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">Explorez nos destinations et ajoutez vos coups de cœur</p>
            <Link href="/discover">
              <Button variant="outline" className="mt-4 border-primary/30 text-primary hover:bg-primary/10">
                Explorer
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav: any) => (
              <div key={fav.id} className="bg-card/30 border border-border/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-primary uppercase tracking-wider">{fav.targetType}</span>
                    <p className="text-sm font-medium text-foreground mt-1">#{fav.targetId}</p>
                  </div>
                  <button
                    onClick={() => removeFav.mutate({ targetType: fav.targetType, targetId: fav.targetId })}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ajouté le {new Date(fav.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TripsTab() {
  const { data: trips, isLoading } = trpc.trips.getMyPlans.useQuery();

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Chargement des parcours...</div>;

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
        <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Aucun parcours créé</p>
        <p className="text-sm text-muted-foreground mt-1">Demandez à votre assistant de créer un parcours sur-mesure</p>
        <Link href="/chat">
          <Button variant="outline" className="mt-4 border-primary/30 text-primary hover:bg-primary/10">
            Créer un parcours
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trips.map((trip: any) => (
        <Link key={trip.id} href={`/trip/${trip.id}`}>
          <div className="bg-card/30 border border-border/30 rounded-lg p-5 hover:border-primary/30 transition-all cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{trip.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{trip.destination}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  {trip.startDate && <span>{trip.startDate}</span>}
                  {trip.totalDays && <span>{trip.totalDays} jours</span>}
                  {trip.tripType && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{trip.tripType}</span>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                trip.status === "confirmed" ? "bg-green-500/10 text-green-400" :
                trip.status === "completed" ? "bg-blue-500/10 text-blue-400" :
                "bg-primary/10 text-primary"
              }`}>
                {trip.status === "planning" ? "En cours" : trip.status === "confirmed" ? "Confirmé" : trip.status}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ConversationsTab() {
  const { data: conversations, isLoading } = trpc.chat.getConversations.useQuery();

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Chargement des conversations...</div>;

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Aucune conversation</p>
        <p className="text-sm text-muted-foreground mt-1">Commencez à discuter avec votre concierge IA</p>
        <Link href="/chat">
          <Button variant="outline" className="mt-4 border-primary/30 text-primary hover:bg-primary/10">
            Nouvelle conversation
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv: any) => (
        <Link key={conv.id} href={`/chat/${conv.id}`}>
          <div className="bg-card/30 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{conv.title || "Conversation"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {conv.department && <span className="text-primary mr-2">{conv.department}</span>}
                  {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Onglet Enregistrements — Parcours sauvegardés depuis le chat IA ─────────

function SavedParcoursTab() {
  const { data: myParcours, isLoading: loadingMine } = trpc.lena.myParcours.useQuery();
  const { data: savedParcours, isLoading: loadingSaved } = trpc.lena.savedParcours.useQuery();
  const toggleSave = trpc.lena.toggleSave.useMutation();
  const [activeSection, setActiveSection] = useState<"mine" | "saved">("mine");

  const isLoading = loadingMine || loadingSaved;

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Chargement de vos enregistrements...</div>;

  const tripTypeLabel: Record<string, string> = {
    leisure: "Loisirs", business: "Business", romantic: "Romantique",
    family: "Famille", staycation: "Staycation", adventure: "Aventure", wellness: "Bien-être",
  };
  const budgetLabel: Record<string, string> = {
    economique: "Économique", confort: "Confort", premium: "Premium", luxe: "Luxe",
  };

  const renderParcours = (items: any[], showUnsave = false) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
          <Route className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun parcours ici</p>
          <p className="text-sm text-muted-foreground mt-1">
            {showUnsave ? "Enregistrez des parcours depuis le chat pour les retrouver ici" : "Demandez à votre assistant de créer un parcours"}
          </p>
          <Link href="/chat">
            <Button variant="outline" className="mt-4 border-primary/30 text-primary hover:bg-primary/10">
              Créer un parcours
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p: any) => (
          <div key={p.id} className="bg-card/30 border border-border/30 rounded-lg p-5 hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-medium text-foreground truncate">{p.title}</p>
                  {p.isVerified && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs gap-1">
                      <ShieldCheck className="w-3 h-3" />Vérifié
                    </Badge>
                  )}
                  {p.isLenaGenerated && (
                    <Badge className="bg-violet-600/20 text-violet-400 border-violet-600/30 text-xs">
                      ✦ LÉNA
                    </Badge>
                  )}
                </div>
                {p.destination && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />{p.destination}{p.country ? `, ${p.country}` : ""}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {p.tripType && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {tripTypeLabel[p.tripType] || p.tripType}
                    </span>
                  )}
                  {p.budget && (
                    <span className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded">
                      {budgetLabel[p.budget] || p.budget}
                    </span>
                  )}
                  {p.duration && (
                    <span className="text-xs text-muted-foreground">{p.duration} jour{p.duration > 1 ? "s" : ""}</span>
                  )}
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>{new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  {(p.saveCount || 0) > 0 && (
                    <span className="text-primary">⭐ {p.saveCount} enregistrement{p.saveCount > 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
              {showUnsave && (
                <button
                  onClick={() => toggleSave.mutate({ destinationId: p.id, save: false })}
                  className="text-primary hover:text-primary/70 transition-colors shrink-0 mt-1"
                  title="Retirer des enregistrements"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section switcher */}
      <div className="flex gap-3">
        <Button
          size="sm"
          variant={activeSection === "mine" ? "default" : "outline"}
          onClick={() => setActiveSection("mine")}
          className={activeSection === "mine" ? "bg-primary text-primary-foreground" : "border-border/50"}
        >
          <Route className="w-4 h-4 mr-2" />
          Mes parcours ({myParcours?.length || 0})
        </Button>
        <Button
          size="sm"
          variant={activeSection === "saved" ? "default" : "outline"}
          onClick={() => setActiveSection("saved")}
          className={activeSection === "saved" ? "bg-primary text-primary-foreground" : "border-border/50"}
        >
          <Bookmark className="w-4 h-4 mr-2" />
          Enregistrés ({savedParcours?.length || 0})
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <Star className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            {activeSection === "mine"
              ? "Vos parcours créés avec l'assistant IA. Ceux marqués ✦ LÉNA ont été enrichis par notre équipe éditoriale."
              : "Parcours que vous avez enregistrés. Ils restent disponibles même si leur créateur les modifie."}
          </span>
        </p>
      </div>

      {/* Parcours list */}
      {activeSection === "mine"
        ? renderParcours(myParcours || [], false)
        : renderParcours(savedParcours || [], true)}
    </div>
  );
}
