/**
 * ParcourSheet.tsx
 * Bottom sheet with the live parcours summary :
 *   - drag handle (touch drag down → close)
 *   - Google Maps embed showing all checked steps
 *   - timeline of steps (ParcourStep)
 *   - sticky bottom bar : budget total + "Sauvegarder" CTA
 *
 * Uses CSS transforms only — animations stay on the compositor at 60fps.
 */
import { useEffect, useRef, useState } from "react";
import { useParcourStore } from "@/stores/parcourStore";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ParcourStep from "./ParcourStep";
import ParcourEmpty from "./ParcourEmpty";

const DRAG_THRESHOLD = 100;

export default function ParcourSheet() {
  const {
    isSheetOpen,
    closeSheet,
    steps,
    phase,
    totalBudget,
    perPersonBudget,
    personCount,
    clearParcour,
  } = useParcourStore();

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number | null>(null);

  // Reset drag offset whenever the sheet open state changes
  useEffect(() => {
    if (!isSheetOpen) setDragOffset(0);
  }, [isSheetOpen]);

  const checkedSteps = steps.filter((s) => s.checked);

  // Build map iframe URL for all checked steps
  const mapsKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY as string | undefined;
  const mapStepsWithCoords = checkedSteps.filter((s) => s.lat != null && s.lng != null);
  let mapSrc: string | null = null;
  if (mapsKey && mapStepsWithCoords.length > 0) {
    if (mapStepsWithCoords.length === 1) {
      const s = mapStepsWithCoords[0];
      mapSrc = `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${s.lat},${s.lng}&zoom=14`;
    } else {
      // Use directions mode for multiple stops
      const origin = mapStepsWithCoords[0];
      const destination = mapStepsWithCoords[mapStepsWithCoords.length - 1];
      const waypoints = mapStepsWithCoords
        .slice(1, -1)
        .map((s) => `${s.lat},${s.lng}`)
        .join("|");
      mapSrc =
        `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}` +
        `&origin=${origin.lat},${origin.lng}` +
        `&destination=${destination.lat},${destination.lng}` +
        (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : "") +
        `&mode=walking`;
    }
  }

  // ─── Touch drag handlers ─────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current == null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  };
  const handleTouchEnd = () => {
    if (dragOffset > DRAG_THRESHOLD) {
      closeSheet();
    } else {
      setDragOffset(0);
    }
    dragStartY.current = null;
  };

  // ─── Save mutation ───────────────────────────────────────────────
  const saveMutation = trpc.parcours.save.useMutation({
    onSuccess: () => {
      toast.success("Parcours sauvegardé");
      closeSheet();
      clearParcour();
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  const handleSave = () => {
    if (checkedSteps.length === 0) {
      toast("Cochez au moins une étape pour sauvegarder");
      return;
    }
    const title = `Parcours ${new Date().toLocaleDateString("fr-FR")}`;
    saveMutation.mutate({
      title,
      steps: checkedSteps as any,
      totalBudget,
      personCount,
      heroPhoto: checkedSteps[0]?.photo || undefined,
    });
  };

  // ─── Backdrop ────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeSheet}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 39,
          background: "rgba(0,0,0,0.6)",
          opacity: isSheetOpen ? 1 : 0,
          pointerEvents: isSheetOpen ? "auto" : "none",
          transition: "opacity 300ms ease",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="flex flex-col"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          height: "85vh",
          background: "rgba(7,11,20,0.98)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(200,169,110,0.3)",
          borderRadius: "20px 20px 0 0",
          transform: isSheetOpen
            ? `translateY(${dragOffset}px)`
            : "translateY(100%)",
          transition: dragStartY.current
            ? "none"
            : "transform 400ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex justify-center items-center flex-shrink-0"
          style={{ paddingTop: 12, paddingBottom: 14, cursor: "grab" }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.3)",
            }}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Title */}
          <h2
            className="mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#F0EDE6",
              fontSize: "1.25rem",
            }}
          >
            Votre parcours
          </h2>

          {/* Map */}
          {mapSrc && (
            <div
              className="overflow-hidden mb-4"
              style={{
                height: 200,
                borderRadius: 12,
                border: "1px solid rgba(200,169,110,0.2)",
              }}
            >
              <iframe
                title="Parcours sur la carte"
                src={mapSrc}
                style={{ width: "100%", height: "100%", border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}

          {/* Steps timeline OR empty state */}
          {steps.length === 0 ? (
            <ParcourEmpty phase={phase} />
          ) : (
            <div className="flex flex-col gap-2">
              {steps.map((s) => (
                <ParcourStep key={s.id} step={s} />
              ))}
            </div>
          )}
        </div>

        {/* Sticky bottom : budget + save CTA */}
        {checkedSteps.length > 0 && (
          <div
            className="flex-shrink-0 px-4 pt-3 pb-5"
            style={{
              borderTop: "1px solid rgba(200,169,110,0.15)",
              background: "rgba(7,11,20,0.98)",
            }}
          >
            <p
              className="text-sm mb-3"
              style={{ color: "rgba(255,255,255,0.85)", textAlign: "center" }}
            >
              ~<span style={{ color: "#C8A96E", fontWeight: 600 }}>{totalBudget}€</span>{" "}
              pour {personCount} pers (soit{" "}
              <span style={{ color: "#C8A96E", fontWeight: 600 }}>~{perPersonBudget}€/pers</span>)
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full rounded-xl text-sm font-semibold transition-opacity"
              style={{
                minHeight: 48,
                background: "linear-gradient(135deg, #C8A96E, #E8D5A8)",
                color: "#070B14",
                opacity: saveMutation.isPending ? 0.6 : 1,
              }}
            >
              {saveMutation.isPending ? "Sauvegarde…" : "Sauvegarder ce parcours"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
