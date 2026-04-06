import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { Star, Search, MapPin, Sparkles, SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "Tout" },
  { value: "restaurant", label: "Restaurants" },
  { value: "hotel", label: "Hôtels" },
  { value: "activity", label: "Activités" },
  { value: "bar", label: "Bars" },
  { value: "spa", label: "Spas" },
  { value: "experience", label: "Expériences" },
];

export default function Discover() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: cards, isLoading } = trpc.seo.getPublishedCards.useQuery(
    { limit: 50, offset: 0 },
  );

  const filteredCards =
    cards?.filter((card: any) => {
      const matchesCategory =
        selectedCategory === "all" || card.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.country.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) || [];

  return (
    <div className="min-h-[80vh]">
      {/* ─── Search Bar ─── */}
      <div className="px-4 md:px-6 pt-4 md:pt-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une destination, un lieu..."
            className="w-full bg-white/[0.03] border border-white/[0.08] pl-10 pr-10 py-3 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#c8a94a]/30 transition-colors"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#c8a94a]/60 transition-colors">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* ─── Category Filters ─── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-6 py-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`whitespace-nowrap px-4 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-200 flex-shrink-0 ${
              selectedCategory === cat.value
                ? "bg-[#c8a94a] text-[#080c14]"
                : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── Results ─── */}
      <div className="px-4 md:px-6 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-white/[0.03] border border-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <MapPin size={22} className="text-white/15" />
            </div>
            <h3 className="text-sm text-white/50 mb-1">
              {searchQuery ? "Aucun résultat" : "Aucune fiche disponible"}
            </h3>
            <p className="text-[11px] text-white/25 max-w-xs mx-auto">
              {searchQuery
                ? "Essayez une autre recherche."
                : "Les fiches sont en cours de création par notre IA."}
            </p>
            <Link href="/chat">
              <button className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#c8a94a]/70 hover:text-[#c8a94a] transition-colors">
                <Sparkles size={12} />
                Demander à ARIA
              </button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-white/25 mb-3">
              {filteredCards.length} résultat{filteredCards.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredCards.map((card: any) => (
                <Link key={card.id} href={`/discover/${card.slug}`}>
                  <div className="group">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.imageAlt || card.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#c8a94a]/5 to-white/[0.02] flex items-center justify-center">
                          <Star size={24} className="text-[#c8a94a]/15" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {/* Category tag */}
                      <div className="absolute top-2 left-2">
                        <span className="text-[8px] tracking-[0.12em] uppercase bg-[#c8a94a]/80 text-[#080c14] px-1.5 py-0.5 font-semibold">
                          {card.category}
                        </span>
                      </div>
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-xs font-medium text-white leading-tight line-clamp-2 group-hover:text-[#c8a94a] transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                          <MapPin size={9} />
                          {card.city}, {card.country}
                        </p>
                        {card.rating && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Star
                              size={10}
                              className="text-[#c8a94a] fill-[#c8a94a]"
                            />
                            <span className="text-[10px] text-[#c8a94a] font-medium">
                              {card.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
