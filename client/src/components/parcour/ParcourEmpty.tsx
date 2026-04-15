/**
 * ParcourEmpty.tsx
 * Empty state shown inside ParcourSheet before any step has been added.
 * Three sub-states driven by the store's phase.
 */
import { MessageCircle, Sparkles, CheckCircle } from "lucide-react";
import type { ParcourPhase } from "@/stores/parcourStore";

interface ParcourEmptyProps {
  phase: ParcourPhase;
}

export default function ParcourEmpty({ phase }: ParcourEmptyProps) {
  let icon: React.ReactNode;
  let text = "";

  if (phase === "questions" || phase === "idle") {
    icon = <MessageCircle size={36} color="#C8A96E" style={{ opacity: 0.6 }} />;
    text = "Discutez avec Maya pour construire votre parcours";
  } else if (phase === "searching") {
    icon = (
      <Sparkles
        size={36}
        color="#C8A96E"
        className="animate-pulse"
        style={{ opacity: 0.8 }}
      />
    );
    text = "Maya explore les meilleures adresses pour vous…";
  } else {
    icon = <CheckCircle size={36} color="#C8A96E" style={{ opacity: 0.6 }} />;
    text = "Parcourez les suggestions, cochez ce qui vous plaît";
  }

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6"
      style={{ paddingTop: 56, paddingBottom: 56, gap: 18 }}
    >
      {icon}
      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: "0.95rem",
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>

      {(phase === "questions" || phase === "idle") && (
        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          {["Destination", "Dates", "Ambiance", "Budget"].map((label) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  border: "1.5px solid rgba(255,255,255,0.3)",
                }}
              />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
