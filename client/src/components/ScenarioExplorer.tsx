import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface ScenarioPlace {
  name: string;
  type: "hotel" | "restaurant" | "activity" | "transport";
  address?: string;
  lat?: number;
  lng?: number;
  price?: number;
  rating?: number;
  imageUrl?: string;
  phone?: string;
}

export interface ScenarioDay {
  day: number;
  label: string;
  steps: ScenarioPlace[];
}

export interface Scenario {
  id: string;
  name: string;
  emoji: string;
  budget: number;
  budgetBreakdown?: {
    hebergement?: number;
    restaurants?: number;
    activites?: number;
    transport?: number;
  };
  days: ScenarioDay[];
  destination?: string;
  duration?: string;
}

interface ScenarioExplorerProps {
  scenario: Scenario;
  isOpen: boolean;
  onClose: () => void;
  onSelectOther?: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  hotel: "#F59E0B",
  restaurant: "#3B82F6",
  activity: "#22C55E",
  transport: "#8B5CF6",
};

const TYPE_EMOJI: Record<string, string> = {
  hotel: "🔶",
  restaurant: "🔵",
  activity: "🟢",
  transport: "🟣",
};

export function ScenarioExplorer({ scenario, isOpen, onClose, onSelectOther }: ScenarioExplorerProps) {
  const [openDay, setOpenDay] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [, navigate] = useLocation();

  const createTripMutation = trpc.trips.createPlan?.useMutation?.({
    onSuccess: (data: { id?: string | number }) => {
      setSaving(false);
      toast.success("Scénario sauvegardé dans vos parcours !");
      onClose();
      navigate("/parcours");
    },
    onError: () => {
      setSaving(false);
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  const handleChoose = () => {
    setSaving(true);
    createTripMutation?.mutate?.({
      title: `${scenario.emoji} ${scenario.name}`,
      tripType: "leisure" as const,
      budgetLevel: scenario.budget > 3000 ? "ultra_premium" as const : scenario.budget > 1500 ? "premium" as const : "moderate" as const,
      destinationCity: scenario.destination || scenario.name,
      destinationCountry: "France",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      travelers: 1,
    });
  };

  const handleDraft = () => {
    setSaving(true);
    createTripMutation?.mutate?.({
      title: `[Brouillon] ${scenario.emoji} ${scenario.name}`,
      tripType: "leisure" as const,
      budgetLevel: scenario.budget > 3000 ? "ultra_premium" as const : scenario.budget > 1500 ? "premium" as const : "moderate" as const,
      destinationCity: scenario.destination || scenario.name,
      destinationCountry: "France",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      travelers: 1,
    });
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`fixed z-50 bg-[#0D1117] border-[#C8A96E]/20 overflow-y-auto ${
              isMobile
                ? "inset-x-0 bottom-0 top-16 rounded-t-2xl border-t"
                : "right-0 top-0 bottom-0 w-1/2 border-l"
            }`}
          >
            {/* Drag handle (mobile) */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8A96E]/20 sticky top-0 bg-[#0D1117] z-10">
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {scenario.emoji} {scenario.name}
                </h2>
                <p className="text-[#C8A96E] text-sm font-semibold">
                  Budget total : {scenario.budget.toLocaleString("fr-FR")}€
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Légende carte */}
              <div className="flex gap-4 flex-wrap text-xs text-gray-400">
                {Object.entries(TYPE_EMOJI).map(([type, emoji]) => (
                  <span key={type}>{emoji} {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                ))}
              </div>

              {/* Programme jour par jour */}
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Programme</h3>
                <div className="space-y-2">
                  {scenario.days.map((day) => (
                    <div key={day.day} className="border border-white/10 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                        onClick={() => setOpenDay(openDay === day.day ? null : day.day)}
                      >
                        <span className="text-white font-medium text-sm">Jour {day.day} — {day.label}</span>
                        <span className="text-gray-400 text-xs">{openDay === day.day ? "▲" : "▼"}</span>
                      </button>
                      <AnimatePresence>
                        {openDay === day.day && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 space-y-2">
                              {day.steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                                  <span className="text-lg mt-0.5">{TYPE_EMOJI[step.type] || "📍"}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{step.name}</p>
                                    {step.address && <p className="text-gray-500 text-xs truncate">{step.address}</p>}
                                    <div className="flex gap-3 mt-1">
                                      {step.price && <span className="text-[#C8A96E] text-xs">{step.price}€</span>}
                                      {step.rating && <span className="text-yellow-400 text-xs">★ {step.rating}</span>}
                                    </div>
                                  </div>
                                  {step.address && (
                                    <a
                                      href={`https://maps.google.com/?q=${encodeURIComponent(step.address)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-400 hover:text-[#C8A96E] text-xs"
                                    >
                                      📍
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget détaillé */}
              {scenario.budgetBreakdown && (
                <div className="bg-[#1A1A2E] rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Budget détaillé</h3>
                  <div className="space-y-2">
                    {Object.entries(scenario.budgetBreakdown).map(([key, val]) => val ? (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{key}</span>
                        <span className="text-white">{(val as number).toLocaleString("fr-FR")}€</span>
                      </div>
                    ) : null)}
                    <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-2 mt-2">
                      <span className="text-[#C8A96E]">Total</span>
                      <span className="text-[#C8A96E]">{scenario.budget.toLocaleString("fr-FR")}€</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pb-6">
                <button
                  onClick={handleChoose}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-[#C8A96E] text-black font-semibold hover:bg-[#D4B87A] transition-colors disabled:opacity-50"
                >
                  {saving ? "Sauvegarde..." : "✅ Choisir ce scénario"}
                </button>
                <button
                  onClick={handleDraft}
                  disabled={saving}
                  className="w-full py-3 rounded-xl border border-[#C8A96E]/50 text-[#C8A96E] font-semibold hover:bg-[#C8A96E]/10 transition-colors disabled:opacity-50"
                >
                  📌 Sauvegarder en brouillon
                </button>
                {onSelectOther && (
                  <button
                    onClick={() => { onClose(); onSelectOther(); }}
                    className="w-full py-3 rounded-xl border border-white/20 text-gray-400 font-semibold hover:bg-white/5 transition-colors"
                  >
                    🔄 Voir un autre scénario
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
