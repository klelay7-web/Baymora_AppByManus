import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Search, Filter, MapPin } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "Tout" },
  { value: "restaurant", label: "Restaurants" },
  { value: "hotel", label: "Hôtels" },
  { value: "activity", label: "Activités" },
  { value: "bar", label: "Bars" },
  { value: "spa", label: "Spas" },
  { value: "experience", label: "Expériences" },
  { value: "conciergerie", label: "Conciergerie" },
  { value: "social_club", label: "Social Clubs" },
  { value: "mariage", label: "Mariages & VIP" },
  { value: "yacht", label: "Yachts" },
];

export default function Discover() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: cards, isLoading } = trpc.seo.getPublishedCards.useQuery({ limit: 50, offset: 0 });

  const filteredCards = cards?.filter((card) => {
    const matchesCategory = selectedCategory === "all" || card.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-gold/10 px-4 py-3 sticky top-0 z-20">
        <div className="container flex items-center gap-3">
          <Link href="/">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-gold transition-colors" />
          </Link>
          <h1 className="font-serif text-lg font-semibold flex-1">Explorer</h1>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une destination, un restaurant..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/30 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`text-xs px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? "bg-gold text-navy-dark font-semibold"
                  : "border border-border text-muted-foreground hover:border-gold/30 hover:text-gold"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-secondary" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-secondary rounded w-1/3" />
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20">
            <MapPin size={40} className="text-gold/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold mb-2">Aucune destination trouvée</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Essayez une autre recherche." : "Les fiches sont en cours de génération par notre IA."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
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
                      {card.rating && (
                        <div className="flex items-center gap-1 mt-3">
                          <Star size={12} className="text-gold fill-gold" />
                          <span className="text-xs text-gold font-medium">{card.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
