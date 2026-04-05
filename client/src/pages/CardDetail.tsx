import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Clock, Phone, Globe, ExternalLink, MessageCircle } from "lucide-react";
import { Streamdown } from "streamdown";

export default function CardDetail() {
  const [, params] = useRoute("/discover/:slug");
  const slug = params?.slug || "";

  const { data: card, isLoading } = trpc.seo.getCardBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="glass-card border-b border-gold/10 px-4 py-3 sticky top-0 z-20">
          <div className="container flex items-center gap-3">
            <Link href="/discover">
              <ArrowLeft size={20} className="text-muted-foreground" />
            </Link>
            <div className="h-5 bg-secondary rounded w-40 animate-pulse" />
          </div>
        </header>
        <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="aspect-video bg-secondary rounded-xl" />
          <div className="h-8 bg-secondary rounded w-3/4" />
          <div className="h-4 bg-secondary rounded w-1/2" />
          <div className="space-y-3">
            <div className="h-3 bg-secondary rounded" />
            <div className="h-3 bg-secondary rounded" />
            <div className="h-3 bg-secondary rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold mb-2">Fiche non trouvée</h2>
          <Link href="/discover">
            <Button variant="outline" className="border-gold/30 text-gold mt-4">Retour</Button>
          </Link>
        </div>
      </div>
    );
  }

  const highlights = card.highlights ? JSON.parse(card.highlights) : [];
  const practicalInfo = card.practicalInfo ? JSON.parse(card.practicalInfo) : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-gold/10 px-4 py-3 sticky top-0 z-20">
        <div className="container flex items-center gap-3">
          <Link href="/discover">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-gold transition-colors" />
          </Link>
          <h1 className="font-serif text-sm font-semibold truncate flex-1">{card.title}</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container max-w-3xl mx-auto px-4 py-6"
      >
        {/* Hero Image */}
        {card.imageUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden mb-6">
            <img src={card.imageUrl} alt={card.imageAlt || card.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-gradient-to-br from-gold/10 to-navy-light flex items-center justify-center mb-6">
            <Star size={48} className="text-gold/20" />
          </div>
        )}

        {/* Category & Location */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs uppercase tracking-wider text-gold font-semibold px-3 py-1 rounded-full bg-gold/10">
            {card.category}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin size={14} />
            <span className="text-xs">{card.city}, {card.country}</span>
          </div>
          {card.rating && (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-gold fill-gold" />
              <span className="text-xs text-gold font-medium">{card.rating}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">{card.title}</h2>
        {card.subtitle && (
          <p className="text-muted-foreground mb-6">{card.subtitle}</p>
        )}

        {/* Description */}
        <div className="prose prose-invert prose-sm max-w-none mb-8">
          <Streamdown>{card.description}</Streamdown>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="font-serif text-lg font-semibold mb-4 text-gold">Points forts</h3>
            <ul className="space-y-2">
              {highlights.map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Star size={14} className="text-gold shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Practical Info */}
        {practicalInfo && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="font-serif text-lg font-semibold mb-4 text-gold">Informations pratiques</h3>
            <div className="space-y-3">
              {practicalInfo.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span>{practicalInfo.address}</span>
                </div>
              )}
              {practicalInfo.phone && (
                <div className="flex items-start gap-3 text-sm">
                  <Phone size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span>{practicalInfo.phone}</span>
                </div>
              )}
              {practicalInfo.hours && (
                <div className="flex items-start gap-3 text-sm">
                  <Clock size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span>{practicalInfo.hours}</span>
                </div>
              )}
              {practicalInfo.website && (
                <div className="flex items-start gap-3 text-sm">
                  <Globe size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <a href={practicalInfo.website} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline flex items-center gap-1">
                    Site web <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="glass-card gold-glow rounded-xl p-6 text-center">
          <h3 className="font-serif text-lg font-semibold mb-2">Intéressé par cette destination ?</h3>
          <p className="text-sm text-muted-foreground mb-4">Notre concierge IA peut organiser votre séjour sur-mesure.</p>
          <Link href="/chat">
            <Button className="bg-gold text-navy-dark hover:bg-gold-light font-semibold gap-2">
              <MessageCircle size={16} />
              Parler au Concierge
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
