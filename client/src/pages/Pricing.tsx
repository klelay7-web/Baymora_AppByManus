import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles, MessageCircle, Brain, Globe, Shield, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const FREE_FEATURES = [
  "3 messages avec le concierge IA",
  "Accès au feed d'inspirations",
  "Consultation des fiches locales",
];

const PREMIUM_FEATURES = [
  "Chat concierge IA illimité",
  "Mémoire client persistante",
  "Parcours de voyage sur-mesure",
  "Recommandations personnalisées",
  "Compagnons de voyage enregistrés",
  "Crédits mensuels avec rollover",
  "Réservations assistées par IA",
  "Support prioritaire 24/7",
  "Accès aux offres exclusives",
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-gold/10 px-4 py-3 sticky top-0 z-20">
        <div className="container flex items-center gap-3">
          <Link href="/">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-gold transition-colors" />
          </Link>
          <h1 className="font-serif text-lg font-semibold">Tarifs</h1>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Votre concierge IA,
            <br />
            <span className="text-gradient-gold">sans limites</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choisissez le plan qui correspond à vos ambitions de voyage.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-8"
          >
            <div className="mb-6">
              <h3 className="font-serif text-xl font-semibold mb-1">Découverte</h3>
              <p className="text-xs text-muted-foreground">Pour explorer Baymora</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">0€</span>
              <span className="text-muted-foreground text-sm">/mois</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/chat">
              <Button variant="outline" className="w-full border-border text-foreground hover:border-gold/30">
                Essayer gratuitement
              </Button>
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card gold-glow rounded-xl p-8 border-gold/30 relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-navy-dark text-[10px] font-bold uppercase tracking-wider">
              Recommandé
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-gold" />
                <h3 className="font-serif text-xl font-semibold">Premium</h3>
              </div>
              <p className="text-xs text-muted-foreground">L'expérience complète</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gold">90€</span>
              <span className="text-muted-foreground text-sm">/mois</span>
              <p className="text-[10px] text-muted-foreground mt-1">Sans engagement — Annulable à tout moment</p>
            </div>
            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check size={16} className="text-gold shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {isAuthenticated ? (
              <Button
                className="w-full bg-gold text-navy-dark hover:bg-gold-light font-semibold gap-2"
                onClick={() => toast.info("L'intégration Stripe sera bientôt disponible.")}
              >
                <Sparkles size={16} />
                Passer Premium
              </Button>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="w-full bg-gold text-navy-dark hover:bg-gold-light font-semibold gap-2">
                  <Sparkles size={16} />
                  Se connecter pour s'abonner
                </Button>
              </a>
            )}
          </motion.div>
        </div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
        >
          {[
            { icon: Brain, label: "IA de pointe" },
            { icon: Globe, label: "Couverture mondiale" },
            { icon: Shield, label: "Données sécurisées" },
            { icon: Clock, label: "Disponible 24/7" },
          ].map((item, i) => (
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
