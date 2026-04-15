/**
 * ParcourBar.tsx
 * Sticky floating bar above Maya's input. Three states:
 *   - phase=idle, no steps → hidden
 *   - phase=questions/searching, 0 steps → 32px slim "Votre parcours" hint
 *   - any phase with steps → 60px with "n étapes · ~Y€/pers" + photo dots
 *
 * Tap anywhere → openSheet(). Pulses when Maya is searching.
 */
import { ChevronUp } from "lucide-react";
import { useParcourStore } from "@/stores/parcourStore";

const PULSE_KEYFRAMES = `
@keyframes parcourBarPulse {
  0%, 100% { border-top-color: rgba(200,169,110,1); }
  50% { border-top-color: rgba(200,169,110,0.4); }
}
`;

export default function ParcourBar() {
  const {
    phase,
    steps,
    perPersonBudget,
    personCount,
    isMayaSearching,
    isSheetOpen,
    openSheet,
  } = useParcourStore();

  if (phase === "idle" && steps.length === 0) return null;
  if (isSheetOpen) return null; // hide bar while sheet is open

  const checkedSteps = steps.filter((s) => s.checked);
  const hasSteps = checkedSteps.length > 0;
  const slim = !hasSteps;

  const photos = checkedSteps.slice(0, 5);

  return (
    <>
      <style>{PULSE_KEYFRAMES}</style>
      <button
        type="button"
        onClick={openSheet}
        className="fixed left-0 right-0 flex items-center w-full"
        style={{
          bottom: 76, // above the Maya input field (~76px tall on mobile)
          zIndex: 30,
          height: slim ? 32 : 60,
          background: "rgba(13,17,23,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #C8A96E",
          borderRadius: "16px 16px 0 0",
          paddingLeft: 16,
          paddingRight: 16,
          color: "#F0EDE6",
          textAlign: "left",
          animation: isMayaSearching ? "parcourBarPulse 1.5s ease-in-out infinite" : undefined,
          transition: "height 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {slim ? (
          <span
            className="text-[11px] tracking-wider w-full text-center"
            style={{ color: "#C8A96E", opacity: 0.6 }}
          >
            Votre parcours
          </span>
        ) : (
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex flex-col min-w-0">
              <p className="text-[11px]" style={{ color: "#C8A96E" }}>
                Votre parcours
              </p>
              <p className="text-xs font-medium truncate" style={{ color: "#F0EDE6" }}>
                {checkedSteps.length} étape{checkedSteps.length > 1 ? "s" : ""} · ~{perPersonBudget}
                €/pers
                {personCount > 1 && (
                  <span className="opacity-50"> ({personCount} pers)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex -space-x-2">
                {photos.map((s, i) => (
                  <div
                    key={s.id}
                    className="w-8 h-8 rounded-full overflow-hidden border-2"
                    style={{
                      borderColor: "#0d1117",
                      background: "rgba(255,255,255,0.05)",
                      zIndex: photos.length - i,
                    }}
                  >
                    {s.photo ? (
                      <img
                        src={s.photo}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-white/40">
                        {s.category[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {checkedSteps.length > photos.length && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold border-2"
                    style={{
                      borderColor: "#0d1117",
                      background: "rgba(200,169,110,0.2)",
                      color: "#C8A96E",
                    }}
                  >
                    +{checkedSteps.length - photos.length}
                  </div>
                )}
              </div>
              <ChevronUp size={18} color="#C8A96E" />
            </div>
          </div>
        )}
      </button>
    </>
  );
}
