import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface TripStep {
  id: number;
  time?: string;
  title: string;
  address?: string;
  phone?: string;
  type: "hotel" | "restaurant" | "activity" | "transport" | "business";
  completed: boolean;
  isFixed?: boolean; // Mode business
  dayNumber: number;
}

interface TripTodoListProps {
  tripPlanId: number;
  currentDay: number;
  totalDays: number;
  steps: TripStep[];
  onStepToggle?: (stepId: number, completed: boolean) => void;
}

const TYPE_EMOJI: Record<string, string> = {
  hotel: "🏨",
  restaurant: "🍽️",
  activity: "🎭",
  transport: "🚗",
  business: "🔒",
};

export function TripTodoList({ tripPlanId, currentDay, totalDays, steps, onStepToggle }: TripTodoListProps) {
  const [expanded, setExpanded] = useState(false);
  const [localSteps, setLocalSteps] = useState<TripStep[]>(steps);

  const updateStepMutation = trpc.trips.updateStep?.useMutation?.({
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const todaySteps = localSteps.filter((s) => s.dayNumber === currentDay);
  const tomorrowSteps = localSteps.filter((s) => s.dayNumber === currentDay + 1);
  const completedToday = todaySteps.filter((s) => s.completed).length;

  const handleToggle = (step: TripStep) => {
    if (step.isFixed) return;
    const newCompleted = !step.completed;
    setLocalSteps((prev) =>
      prev.map((s) => (s.id === step.id ? { ...s, completed: newCompleted } : s))
    );
    onStepToggle?.(step.id, newCompleted);
    updateStepMutation?.mutate?.({ id: step.id, confirmed: newCompleted });
  };

  const handleMaps = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-[250px] z-30">
      {/* Barre repliée */}
      <motion.div
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(13, 17, 23, 0.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(200,169,110,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-[#C8A96E]" />
          <span className="text-white text-sm font-medium">
            AUJOURD'HUI · Jour {currentDay}/{totalDays}
          </span>
          <span className="text-gray-400 text-xs">
            {todaySteps.length} étapes · {completedToday}/{todaySteps.length} ✅
          </span>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-gray-400 text-sm"
        >
          ▲
        </motion.span>
      </motion.div>

      {/* Liste dépliée */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="overflow-hidden"
            style={{
              background: "rgba(13, 17, 23, 0.97)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="max-h-80 overflow-y-auto pb-20">
              {/* Aujourd'hui */}
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-[#C8A96E] text-xs font-semibold uppercase tracking-wider">
                  Aujourd'hui · {todaySteps.length} étapes
                </p>
              </div>
              {todaySteps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  onToggle={() => handleToggle(step)}
                  onMaps={() => step.address && handleMaps(step.address)}
                  onCall={() => step.phone && handleCall(step.phone)}
                />
              ))}

              {/* Demain */}
              {tomorrowSteps.length > 0 && (
                <>
                  <div className="px-4 py-2 border-t border-b border-white/10 mt-2">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Demain · {tomorrowSteps.length} étapes
                    </p>
                  </div>
                  {tomorrowSteps.map((step) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      onToggle={() => handleToggle(step)}
                      onMaps={() => step.address && handleMaps(step.address)}
                      onCall={() => step.phone && handleCall(step.phone)}
                      dimmed
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StepRowProps {
  step: TripStep;
  onToggle: () => void;
  onMaps: () => void;
  onCall: () => void;
  dimmed?: boolean;
}

function StepRow({ step, onToggle, onMaps, onCall, dimmed }: StepRowProps) {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
      style={{
        opacity: dimmed ? 0.5 : 1,
        background: step.isFixed ? "rgba(139,92,246,0.05)" : "transparent",
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Checkbox ou cadenas */}
      {step.isFixed ? (
        <span className="text-purple-400 text-sm flex-shrink-0">🔒</span>
      ) : (
        <button
          onClick={onToggle}
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            borderColor: step.completed ? "#22C55E" : "rgba(255,255,255,0.3)",
            background: step.completed ? "#22C55E" : "transparent",
          }}
        >
          {step.completed && <span className="text-white text-[10px]">✓</span>}
        </button>
      )}

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {step.time && (
            <span className="text-gray-500 text-xs font-mono flex-shrink-0">{step.time}</span>
          )}
          <span className="text-xs">{TYPE_EMOJI[step.type] || "📍"}</span>
          <span
            className="text-sm font-medium truncate"
            style={{
              color: step.completed ? "#6B7280" : "#F0EDE6",
              textDecoration: step.completed ? "line-through" : "none",
            }}
          >
            {step.title}
          </span>
          {step.isFixed && (
            <span className="text-purple-400 text-[10px] flex-shrink-0">[FIXE]</span>
          )}
        </div>
        {step.address && (
          <p className="text-gray-600 text-xs truncate mt-0.5">{step.address}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {step.address && (
          <button
            onClick={onMaps}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="text-sm">📍</span>
          </button>
        )}
        {step.phone && (
          <button
            onClick={onCall}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="text-sm">📞</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
