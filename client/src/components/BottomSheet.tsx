import React, { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  snapPoints?: ("full" | "half" | "peek")[];
  defaultSnap?: "full" | "half" | "peek";
  className?: string;
  hideHandle?: boolean;
  /** Sur desktop, afficher en side panel (drawer droite) au lieu de modal centré */
  desktopMode?: "modal" | "side-panel" | "auto";
}

// ─── Snap heights ─────────────────────────────────────────────────────────────
const SNAP_HEIGHTS = {
  full: "95vh",
  half: "55vh",
  peek: "35vh",
};

/**
 * BottomSheet universel Baymora
 * - Mobile : bottom sheet native iOS avec drag handle + snap points
 * - Desktop : side panel (drawer droite) ou modal centré selon desktopMode
 * - Navigation en pilules intégrée via PillNav
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  snapPoints = ["full", "half"],
  defaultSnap = "half",
  className = "",
  hideHandle = false,
  desktopMode = "auto",
}: BottomSheetProps) {
  const [snap, setSnap] = useState<"full" | "half" | "peek">(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startY = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset snap on open
  useEffect(() => {
    if (isOpen) {
      setSnap(defaultSnap);
      setDragOffset(0);
    }
  }, [isOpen, defaultSnap]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Keyboard ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Drag handlers
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    setDragOffset(0);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const delta = clientY - startY.current;
    setDragOffset(Math.max(0, delta)); // Only drag down
  }, [isDragging]);

  const handleDragEnd = useCallback((clientY: number) => {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = clientY - startY.current;
    if (delta > 120) {
      // Drag down significantly → close or snap down
      const currentIdx = snapPoints.indexOf(snap);
      if (currentIdx < snapPoints.length - 1) {
        setSnap(snapPoints[currentIdx + 1]);
      } else {
        onClose();
      }
    } else if (delta < -80) {
      // Drag up → snap up
      const currentIdx = snapPoints.indexOf(snap);
      if (currentIdx > 0) {
        setSnap(snapPoints[currentIdx - 1]);
      }
    }
    setDragOffset(0);
  }, [isDragging, snap, snapPoints, onClose]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY);
  const onTouchEnd = (e: React.TouchEvent) => handleDragEnd(e.changedTouches[0].clientY);

  // Mouse events (desktop drag)
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleDragStart(e.clientY); };
  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => handleDragMove(e.clientY);
    const up = (e: MouseEvent) => handleDragEnd(e.clientY);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!isOpen) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const effectiveDesktopMode = desktopMode === "auto" ? (isMobile ? "modal" : "side-panel") : desktopMode;

  // ─── MOBILE: Bottom Sheet ────────────────────────────────────────────────────
  if (isMobile || effectiveDesktopMode === "modal") {
    const height = SNAP_HEIGHTS[snap];
    const transform = dragOffset > 0 ? `translateY(${dragOffset}px)` : "translateY(0)";

    return (
      <>
        {/* Overlay */}
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          style={{ animation: "fadeIn 0.2s ease" }}
        />
        {/* Sheet */}
        <div
          ref={sheetRef}
          className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f] rounded-t-3xl shadow-2xl flex flex-col ${className}`}
          style={{
            height,
            transform,
            transition: isDragging ? "none" : "height 0.35s cubic-bezier(0.32, 0.72, 0, 1), transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            willChange: "transform, height",
          }}
        >
          {/* Drag Handle */}
          {!hideHandle && (
            <div
              className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none touch-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
            >
              <div className="w-10 h-1 rounded-full bg-white/20" />
              {/* Snap pills */}
              {snapPoints.length > 1 && (
                <div className="flex gap-1.5 mt-2">
                  {snapPoints.map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setSnap(sp)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${sp === snap ? "bg-[#c9a96e] scale-125" : "bg-white/20"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Header */}
          {(title || subtitle) && (
            <div className="flex-shrink-0 flex items-start justify-between px-5 pb-3 border-b border-white/8">
              <div>
                {title && <h2 className="text-white font-semibold text-lg leading-tight">{title}</h2>}
                {subtitle && <p className="text-white/50 text-sm mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all ml-3 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </>
    );
  }

  // ─── DESKTOP: Side Panel ─────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease" }}
      />
      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-xl bg-[#0a0a0f] shadow-2xl flex flex-col border-l border-white/8 ${className}`}
        style={{ animation: "slideInRight 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between px-6 py-5 border-b border-white/8">
          <div>
            {title && <h2 className="text-white font-semibold text-xl leading-tight">{title}</h2>}
            {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all ml-4 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

// ─── PillNav ─────────────────────────────────────────────────────────────────
interface PillNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface PillNavProps {
  items: PillNavItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "gold" | "white" | "ghost";
}

export function PillNav({ items, active, onChange, className = "", size = "md", variant = "gold" }: PillNavProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const activeClasses = {
    gold: "bg-[#c9a96e] text-[#0a0a0f] font-semibold shadow-lg shadow-[#c9a96e]/20",
    white: "bg-white text-[#0a0a0f] font-semibold",
    ghost: "bg-white/15 text-white font-semibold",
  };

  const inactiveClasses = "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white/80";

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex items-center rounded-full transition-all duration-200 whitespace-nowrap ${sizeClasses[size]} ${active === item.id ? activeClasses[variant] : inactiveClasses}`}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          <span>{item.label}</span>
          {item.count !== undefined && (
            <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${active === item.id ? "bg-black/20" : "bg-white/10"}`}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── PillFilter (filtres horizontaux scrollables) ─────────────────────────────
interface PillFilterProps {
  items: { id: string; label: string; icon?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multi?: boolean;
  className?: string;
}

export function PillFilter({ items, selected, onChange, multi = false, className = "" }: PillFilterProps) {
  const toggle = (id: string) => {
    if (multi) {
      if (selected.includes(id)) {
        onChange(selected.filter(s => s !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange(selected.includes(id) ? [] : [id]);
    }
  };

  return (
    <div className={`flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 ${className}`}>
      {items.map((item) => {
        const isActive = selected.includes(item.id);
        return (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
              isActive
                ? "bg-[#c9a96e] text-[#0a0a0f] font-semibold shadow-md shadow-[#c9a96e]/20"
                : "bg-white/8 text-white/70 hover:bg-white/12 hover:text-white border border-white/10"
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── CSS Animations (injected once) ──────────────────────────────────────────
const ANIM_STYLE = `
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
@keyframes slideInUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
`;

let animInjected = false;
if (typeof document !== "undefined" && !animInjected) {
  const style = document.createElement("style");
  style.textContent = ANIM_STYLE;
  document.head.appendChild(style);
  animInjected = true;
}
