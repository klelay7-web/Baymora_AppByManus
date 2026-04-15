/**
 * ParcourStep.tsx
 * One step inside the ParcourSheet timeline.
 * Photo + name + timeSlot + travel info + price + checkbox.
 * Tap on the checkbox toggles inclusion via useParcourStore.
 */
import { Check } from "lucide-react";
import { useParcourStore, type ParcourStep as ParcourStepData } from "@/stores/parcourStore";

interface ParcourStepProps {
  step: ParcourStepData;
}

export default function ParcourStep({ step }: ParcourStepProps) {
  const { toggleStep } = useParcourStore();

  return (
    <div
      className="flex items-center gap-3 w-full"
      style={{
        minHeight: 72,
        padding: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
      }}
    >
      {/* Photo */}
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: 48, height: 48, background: "rgba(255,255,255,0.05)" }}
      >
        {step.photo ? (
          <img src={step.photo} alt={step.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-white/40">
            {step.category[0]?.toUpperCase() || "·"}
          </div>
        )}
      </div>

      {/* Center : name + timeSlot + travel */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ fontWeight: 600, fontSize: "0.95rem", color: "#F0EDE6" }}
        >
          {step.name}
        </p>
        {step.timeSlot && (
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)" }}>
            {step.timeSlot}
          </p>
        )}
        {step.travelFromPrevious && (
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
            {step.travelFromPrevious}
          </p>
        )}
      </div>

      {/* Right : price + checkbox */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {step.priceEstimate > 0 && (
          <span
            style={{ fontSize: "0.85rem", color: "#C8A96E", fontWeight: 600 }}
          >
            {step.priceEstimate}€
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleStep(step.id);
          }}
          aria-label={step.checked ? "Désélectionner" : "Sélectionner"}
          className="rounded-full flex items-center justify-center transition-colors"
          style={{
            width: 24,
            height: 24,
            minWidth: 24,
            background: step.checked ? "#C8A96E" : "transparent",
            border: step.checked
              ? "2px solid #C8A96E"
              : "2px solid rgba(200,169,110,0.4)",
          }}
        >
          {step.checked && <Check size={14} color="#070B14" strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}
