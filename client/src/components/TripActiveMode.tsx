import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  MapPin, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Phone, MessageCircle, AlertTriangle, Lock, Navigation,
  X, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface TripStep {
  id: string;
  time?: string;
  title: string;
  address?: string;
  type: "hotel" | "restaurant" | "activity" | "transport" | "meeting";
  isBusiness?: boolean; // RDV pro = cadenas, inviolable
  done?: boolean;
  notes?: string;
}

interface TripActiveModeProps {
  tripId: string;
  tripName: string;
  steps: TripStep[];
  onClose?: () => void;
  onStepToggle?: (stepId: string, done: boolean) => void;
}

const TYPE_EMOJI: Record<TripStep["type"], string> = {
  hotel: "🏨",
  restaurant: "🍽️",
  activity: "✨",
  transport: "🚗",
  meeting: "💼",
};

export default function TripActiveMode({
  tripId,
  tripName,
  steps,
  onClose,
  onStepToggle,
}: TripActiveModeProps) {
  const [, navigate] = useLocation();
  const [todoOpen, setTodoOpen] = useState(true);
  const [localSteps, setLocalSteps] = useState<TripStep[]>(steps);

  const done = localSteps.filter((s) => s.done).length;
  const total = localSteps.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleToggle = (stepId: string) => {
    const step = localSteps.find((s) => s.id === stepId);
    if (!step) return;
    if (step.isBusiness) {
      toast("🔒 RDV professionnel — non modifiable");
      return;
    }
    const newDone = !step.done;
    setLocalSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, done: newDone } : s))
    );
    onStepToggle?.(stepId, newDone);
  };

  const handleSosMaya = () => {
    navigate(`/maya?q=SOS+je+suis+en+voyage+${encodeURIComponent(tripName)}+j'ai+besoin+d'aide`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#070B14" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(200,169,110,0.12)" }}
      >
        <div className="flex items-center gap-2">
          <Navigation size={18} color="#C8A96E" />
          <div>
            <h1
              className="text-sm font-bold"
              style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}
            >
              {tripName}
            </h1>
            <p className="text-xs" style={{ color: "#8B8D94" }}>
              Mode parcours actif
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* SOS Maya */}
          <button
            onClick={handleSosMaya}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(200,169,110,0.12)",
              border: "1px solid rgba(200,169,110,0.25)",
              color: "#C8A96E",
            }}
          >
            <Sparkles size={12} />
            SOS Maya
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <X size={16} color="#8B8D94" />
            </button>
          )}
        </div>
      </div>

      {/* Carte placeholder */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ background: "#0D1117" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin size={40} color="#C8A96E" className="mx-auto mb-3 opacity-40" />
            <p className="text-sm" style={{ color: "#8B8D94" }}>
              Carte du parcours
            </p>
            <p className="text-xs mt-1" style={{ color: "#4B4D54" }}>
              Intégration Google Maps disponible
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div
          className="absolute top-3 left-3 right-3 rounded-2xl p-3"
          style={{ background: "rgba(7,11,20,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(200,169,110,0.1)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "#F0EDE6" }}>
              Progression
            </span>
            <span className="text-xs font-bold" style={{ color: "#C8A96E" }}>
              {done}/{total} étapes
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(200,169,110,0.12)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #C8A96E, #E8D5A8)",
              }}
            />
          </div>
        </div>
      </div>

      {/* TodoList rétractable */}
      <div
        className="flex-shrink-0"
        style={{
          background: "#0D1117",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          maxHeight: todoOpen ? "55vh" : "52px",
          transition: "max-height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          overflow: "hidden",
        }}
      >
        {/* Toggle handle */}
        <button
          onClick={() => setTodoOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} color="#C8A96E" />
            <span className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>
              Programme du jour
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E" }}
            >
              {pct}%
            </span>
          </div>
          {todoOpen ? (
            <ChevronDown size={16} color="#8B8D94" />
          ) : (
            <ChevronUp size={16} color="#8B8D94" />
          )}
        </button>

        {/* Liste des étapes */}
        <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: "calc(55vh - 52px)" }}>
          <div className="space-y-2">
            {localSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
                style={{
                  background: step.done
                    ? "rgba(200,169,110,0.04)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${step.done ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.06)"}`,
                  opacity: step.done ? 0.6 : 1,
                }}
                onClick={() => handleToggle(step.id)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.isBusiness ? (
                    <Lock size={16} color="#C8A96E" />
                  ) : step.done ? (
                    <CheckCircle2 size={16} color="#C8A96E" />
                  ) : (
                    <Circle size={16} color="#8B8D94" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{TYPE_EMOJI[step.type]}</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: step.done ? "#8B8D94" : "#F0EDE6",
                        textDecoration: step.done ? "line-through" : "none",
                      }}
                    >
                      {step.title}
                    </span>
                    {step.isBusiness && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(200,169,110,0.12)", color: "#C8A96E" }}
                      >
                        Pro
                      </span>
                    )}
                  </div>
                  {step.time && (
                    <p className="text-xs mt-0.5" style={{ color: "#8B8D94" }}>
                      {step.time}
                    </p>
                  )}
                  {step.address && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#4B4D54" }}>
                      <MapPin size={10} />
                      {step.address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contacts urgence */}
          <div
            className="mt-4 p-3 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
          >
            <AlertTriangle size={16} color="#ef4444" />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                Urgence
              </p>
              <p className="text-xs" style={{ color: "#8B8D94" }}>
                15 (SAMU) · 17 (Police) · 18 (Pompiers) · 112 (Europe)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
