import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles, Brain, Globe, Shield, Clock, Zap, Star } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const FREE_FEATURES = [
  "15 messages avec l'assistant IA",
  "1 à 2 parcours complets",
  "Accès au feed d'inspirations",
  "Consultation des fiches locales",
];

const EXPLORER_FEATURES = [
  "20 messages assistant IA / mois",
  "Accès aux fiches & bundles publics",
  "Offres exclusives premier prix",
  "Sauvegarde de 5 favoris",
  "1 parcours par mois",
  "Mise en pause possible (1 mois/an)",
];

const PREMIUM_FEATURES = [
  "Messages illimités",
  "Parcours personnalisés avec carte GPS",
  "Fiches détaillées & secrets d'initiés",
  "Mémoire client & profil enrichi",
  "Favoris & collections illimités",
  "Accès programme ambassadeur",
  "Conciergerie par chat",
  "Mise en pause possible (2 mois/an)",
];

const ELITE_FEATURES = [
  "Tout Premium inclus",
  "Recommandations proactives",
  "Accès off-market exclusif",
  "Mode Fantôme (anonymat total)",
  "Réservations anonymisées",
  "Conciergerie prioritaire 24/7",
  "Accès ventes privées & yachts",
  "Mise en pause illimitée",
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const handleSubscribe = (planName: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    toast.info(`L'abonnement ${planName} sera bientôt disponible. Stripe en cours d'intégration.`);
  };

  return (
    <div className="min-h-screen">
      <header className="glass-card border-b border-gold/10 px-4 py-3 sticky top-0 z-20">
        <div className="container flex items-center gap-3">
          <Link href="/">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-gold transition-colors" />
          </Link>
          <h1 className="font-serif text-lg font-semibold">Tarifs</h1>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Votre concierge IA,<br />
            <span className="text-gradient-gold">sans limites</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">Des forfaits pensés pour chaque ambition de voyage.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Explorer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-7 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-muted-foreground" />
                <h3 className="font-serif text-xl font-semibold">Explorer</h3>
              </div>
              <p className="text-xs text-muted-foreground">Découvrez le luxe accessible</p>
            </div>
            <div className="mb-5">
              <span className="text-4xl font-bold">9,90€</span>
              <span className="text-muted-foreground text-sm">/mois</span>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {EXPLORER_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-border text-foreground hover:border-gold/30" onClick={() => handleSubscribe("Explorer")}>
              Commencer l'aventure
            </Button>
          </motion.div>

          {/* Premium */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card gold-glow rounded-xl p-7 border-gold/30 relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-navy-dark text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Le plus populaire
            </div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={16} className="text-gold" />
                <h3 className="font-serif text-xl font-semibold">Premium</h3>
              </div>
              <p className="text-xs text-muted-foreground">L'expérience complète</p>
            </div>
            <div className="mb-5">
              <span className="text-4xl font-bold text-gold">29,90€</span>
              <span className="text-muted-foreground text-sm">/mois</span>
              <p className="text-[10px] text-muted-foreground mt-1">Sans engagement — Annulable à tout moment</p>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {PREMIUM_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check size={14} className="text-gold shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full bg-gold text-navy-dark hover:bg-gold-light font-semibold gap-2" onClick={() => handleSubscribe("Premium")}>
              <Sparkles size={16} />
              Devenir Premium
            </Button>
          </motion.div>

          {/* Élite */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-7 border-purple-500/20 relative flex flex-col opacity-80">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border border-purple-500/30">
              Bientôt disponible
            </div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} className="text-purple-400" />
                <h3 className="font-serif text-xl font-semibold">Élite</h3>
              </div>
              <p className="text-xs text-muted-foreground">Le privilège absolu</p>
            </div>
            <div className="mb-5">
              <span className="text-4xl font-bold text-purple-400">89,90€</span>
              <span className="text-muted-foreground text-sm">/mois</span>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {ELITE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check size={14} className="text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-purple-500/30 text-purple-300 cursor-not-allowed" disabled>
              Bientôt disponible
            </Button>
          </motion.div>
        </div>

        {/* Forfait Découverte gratuit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6 mb-12 border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-semibold mb-1">Découverte — Gratuit</h3>
              <p className="text-sm text-muted-foreground">Essayez Baymora sans carte bancaire</p>
              <ul className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check size={12} className="text-muted-foreground shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/chat">
              <Button variant="outline" className="border-border text-foreground hover:border-gold/30 shrink-0">
                Essayer gratuitement
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Crédits one-shot */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center mb-12">
          <p className="text-sm text-muted-foreground mb-4">Pas d'abonnement ? Achetez des crédits à la carte</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[{ credits: "10", price: "2,99€" }, { credits: "50", price: "9,99€" }, { credits: "150", price: "24,99€" }].map((pack) => (
              <button key={pack.credits} onClick={() => toast.info("Les crédits à la carte seront disponibles prochainement.")} className="px-5 py-2.5 rounded-full border border-gold/20 text-sm hover:border-gold/50 transition-colors">
                <span className="text-gold font-semibold">{pack.credits} crédits</span>
                <span className="text-muted-foreground ml-2">{pack.price}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ icon: Brain, label: "IA de pointe" }, { icon: Globe, label: "Couverture mondiale" }, { icon: Shield, label: "Données sécurisées" }, { icon: Clock, label: "Disponible 24/7" }].map((item, i) => (
            <div key={i} className="text-center py-4">
              <item.icon size={20} className="text-gold mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
