import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Globe, Shield, Clock, Star, MessageCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: cards } = trpc.seo.getPublishedCards.useQuery({ limit: 6, offset: 0 });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-gold/10">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <h1 className="text-xl font-bold font-serif text-gradient-gold tracking-wide">BAYMORA</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-gold transition-colors">Explorer</Link>
            <Link href="/chat" className="text-sm text-muted-foreground hover:text-gold transition-colors">Concierge IA</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-gold transition-colors">Tarifs</Link>
            {isAuthenticated ? (
              <Link href="/profile">
                <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10">
                  {user?.name || "Mon Profil"}
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-gold text-navy-dark hover:bg-gold-light font-semibold">
                  Connexion
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container relative text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 mb-8">
            <Sparkles size={14} className="text-gold" />
            <span className="text-xs text-gold font-medium tracking-wider uppercase">Conciergerie IA Premium</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6">
            <span className="text-foreground">Votre voyage</span>
            <br />
            <span className="text-gradient-gold">d'exception</span>
            <br />
            <span className="text-foreground">commence ici</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Baymora connecte les voyageurs exigeants aux meilleurs prestataires de luxe au monde. 
            Notre IA vous inspire, planifie et organise chaque détail.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" className="bg-gold text-navy-dark hover:bg-gold-light font-semibold text-base px-8 gap-2 w-full sm:w-auto">
                <MessageCircle size={18} />
                Parler au Concierge
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 text-base px-8 gap-2 w-full sm:w-auto">
                Explorer les destinations
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">3 messages gratuits — Sans engagement</p>
        </motion.div>
      </section>

      {/* Value Props */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: "Gain de temps", desc: "Notre IA analyse des milliers d'options en quelques secondes pour vous proposer uniquement le meilleur." },
              { icon: Globe, title: "Interconnexion", desc: "Nous connectons votre besoin aux meilleurs hôtels, restaurants et expériences du monde entier." },
              { icon: Shield, title: "Mémoire client", desc: "Vos préférences, allergies et habitudes sont mémorisées pour une personnalisation absolue." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card rounded-xl p-8 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon size={22} className="text-gold" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cards Feed */}
      {cards && cards.length > 0 && (
        <section className="py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                <span className="text-gradient-gold">Inspirations</span> du moment
              </h2>
              <p className="text-muted-foreground">Découvrez nos sélections exclusives, générées et vérifiées par notre IA.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/discover/${card.slug}`}>
                    <div className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:border-gold/30 transition-all duration-300">
                      {card.imageUrl ? (
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={card.imageUrl}
                            alt={card.imageAlt || card.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-gold/10 to-navy-light flex items-center justify-center">
                          <Star size={32} className="text-gold/30" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-gold font-semibold px-2 py-0.5 rounded-full bg-gold/10">
                            {card.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{card.city}, {card.country}</span>
                        </div>
                        <h3 className="font-serif font-semibold text-base mb-1 group-hover:text-gold transition-colors line-clamp-2">
                          {card.title}
                        </h3>
                        {card.subtitle && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{card.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/discover">
                <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 gap-2">
                  Voir toutes les destinations
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <div className="glass-card gold-glow rounded-2xl p-10 md:p-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Prêt à vivre l'<span className="text-gradient-gold">extraordinaire</span> ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Rejoignez Baymora Premium pour un accès illimité à votre concierge IA personnel. 90€/mois, sans engagement.
            </p>
            <Link href="/pricing">
              <Button size="lg" className="bg-gold text-navy-dark hover:bg-gold-light font-semibold text-base px-10">
                Découvrir le Plan Premium
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="container max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; 2026 Baymora. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-gold transition-colors">Mentions légales</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-gold transition-colors">Confidentialité</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-gold transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
