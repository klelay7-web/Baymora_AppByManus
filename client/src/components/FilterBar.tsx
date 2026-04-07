import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";

export interface FilterState {
  search: string;
  categories: string[];
  priceRange: [number, number];
  destinations: string[];
  sortBy: "relevance" | "price_asc" | "price_desc" | "discount" | "newest" | "popular";
  tags: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  categories: [],
  priceRange: [0, 5000],
  destinations: [],
  sortBy: "relevance",
  tags: [],
};

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories?: string[];
  destinations?: string[];
  tags?: string[];
  showSearch?: boolean;
  showPriceRange?: boolean;
  showDestinations?: boolean;
  compact?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "discount", label: "Meilleure réduction" },
  { value: "newest", label: "Nouveautés" },
  { value: "popular", label: "Populaires" },
] as const;

const PRICE_PRESETS = [
  { label: "Tous", min: 0, max: 5000 },
  { label: "< 200€", min: 0, max: 200 },
  { label: "200–500€", min: 200, max: 500 },
  { label: "500–1500€", min: 500, max: 1500 },
  { label: "> 1500€", min: 1500, max: 5000 },
];

export function FilterBar({
  filters,
  onChange,
  categories = [],
  destinations = [],
  tags = [],
  showSearch = true,
  showPriceRange = true,
  showDestinations = false,
  compact = false,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const update = useCallback((patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  }, [filters, onChange]);

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    update({ categories: next });
  };

  const toggleDestination = (dest: string) => {
    const next = filters.destinations.includes(dest)
      ? filters.destinations.filter(d => d !== dest)
      : [...filters.destinations, dest];
    update({ destinations: next });
  };

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    update({ tags: next });
  };

  const setPricePreset = (min: number, max: number) => {
    update({ priceRange: [min, max] });
  };

  const clearAll = () => onChange(DEFAULT_FILTERS);

  const activeCount =
    filters.categories.length +
    filters.destinations.length +
    filters.tags.length +
    (filters.search ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0) +
    (filters.sortBy !== "relevance" ? 1 : 0);

  const currentSort = SORT_OPTIONS.find(o => o.value === filters.sortBy);

  return (
    <div className="space-y-3">
      {/* Top bar — search + sort + expand */}
      <div className="flex items-center gap-2">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={e => update({ search: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c8a94a]/40 transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => update({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2.5 text-white/70 text-sm transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">{currentSort?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-[#0d1420] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { update({ sortBy: opt.value }); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filters.sortBy === opt.value
                        ? "text-[#c8a94a] bg-[#c8a94a]/10"
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm transition-colors border ${
            activeCount > 0
              ? "bg-[#c8a94a]/15 border-[#c8a94a]/30 text-[#c8a94a]"
              : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeCount > 0 && (
            <span className="bg-[#c8a94a] text-[#080c14] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-white/40 hover:text-white/70 text-xs transition-colors whitespace-nowrap"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Category pills — always visible */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => update({ categories: [] })}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filters.categories.length === 0
                ? "bg-[#c8a94a] text-[#080c14] border-[#c8a94a]"
                : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
            }`}
          >
            Tout
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filters.categories.includes(cat)
                  ? "bg-[#c8a94a]/20 text-[#c8a94a] border-[#c8a94a]/40"
                  : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Expanded filters panel */}
      {expanded && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-4">
          {/* Price range presets */}
          {showPriceRange && (
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2.5">Budget</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map(preset => {
                  const isActive = filters.priceRange[0] === preset.min && filters.priceRange[1] === preset.max;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setPricePreset(preset.min, preset.max)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isActive
                          ? "bg-[#c8a94a]/20 text-[#c8a94a] border-[#c8a94a]/40"
                          : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Destinations */}
          {showDestinations && destinations.length > 0 && (
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2.5">Destinations</p>
              <div className="flex flex-wrap gap-2">
                {destinations.map(dest => (
                  <button
                    key={dest}
                    onClick={() => toggleDestination(dest)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      filters.destinations.includes(dest)
                        ? "bg-[#c8a94a]/20 text-[#c8a94a] border-[#c8a94a]/40"
                        : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2.5">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      filters.tags.includes(tag)
                        ? "bg-[#c8a94a]/20 text-[#c8a94a] border-[#c8a94a]/40"
                        : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      {typeof filteredCount === "number" && typeof totalCount === "number" && (
        <p className="text-white/30 text-xs">
          {filteredCount === totalCount
            ? `${totalCount} résultat${totalCount > 1 ? "s" : ""}`
            : `${filteredCount} résultat${filteredCount > 1 ? "s" : ""} sur ${totalCount}`}
        </p>
      )}
    </div>
  );
}
