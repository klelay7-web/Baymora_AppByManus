import { MapView } from "@/components/Map";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car, Footprints, Bike, Train, Plane, Navigation, Bus,
  MapPin, ChevronLeft, ChevronRight, Locate, Layers, Route
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────
export interface MapEstablishment {
  name: string;
  type: string;
  city: string;
  country?: string;
  description: string;
  priceRange?: string;
  coordinates?: { lat: number; lng: number };
  rating?: number;
  imageUrl?: string;
}

export interface MapStep {
  time: string;
  establishment: string;
  type: string;
  description: string;
  city: string;
  coordinates?: { lat: number; lng: number };
  transportMode?: string;
  transportDuration?: string;
}

export interface MapDay {
  day: number;
  title: string;
  steps: MapStep[];
}

export interface TransportOption {
  mode: string;
  label: string;
  duration: string;
  cost?: string;
  icon: string;
}

// ─── Transport Icons ────────────────────────────────────────────
const transportIconMap: Record<string, any> = {
  walk: Footprints, car: Car, taxi: Car, uber: Car, chauffeur: Car,
  bus: Bus, metro: Train, train: Train, flight: Plane, bike: Bike,
  boat: Navigation, scooter: Bike, foot: Footprints,
};

const typeEmojis: Record<string, string> = {
  restaurant: "🍽️", hotel: "🏨", activity: "🎭", transport: "✈️",
  bar: "🍸", spa: "💆", museum: "🏛️", beach: "🏖️", shopping: "🛍️",
  nightclub: "🎵", park: "🌳", cafe: "☕",
};

// ─── Dark Map Styles ────────────────────────────────────────────
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5a6270" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1628" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#151b28" }] },
];

// ─── InteractiveMap Component ───────────────────────────────────
interface InteractiveMapProps {
  establishments: MapEstablishment[];
  days?: MapDay[];
  selectedEstablishment?: MapEstablishment | null;
  onEstablishmentClick?: (est: MapEstablishment) => void;
  showTransportOptions?: boolean;
  showDayNavigation?: boolean;
  className?: string;
}

export function InteractiveMap({
  establishments,
  days,
  selectedEstablishment,
  onEstablishmentClick,
  showTransportOptions = false,
  showDayNavigation = false,
  className,
}: InteractiveMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedTransport, setSelectedTransport] = useState<string>("car");
  const [showLayers, setShowLayers] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);
  const [transitLayer, setTransitLayer] = useState<google.maps.TransitLayer | null>(null);

  // Compute center
  const mapCenter = useMemo(() => {
    const coords = establishments.filter(e => e.coordinates).map(e => e.coordinates!);
    if (selectedEstablishment?.coordinates) return selectedEstablishment.coordinates;
    if (coords.length > 0) {
      const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
      const avgLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 48.8566, lng: 2.3522 };
  }, [establishments, selectedEstablishment]);

  // Current day steps
  const currentDaySteps = useMemo(() => {
    if (!days || !days[activeDay]) return [];
    return days[activeDay].steps.filter(s => s.coordinates);
  }, [days, activeDay]);

  // Create custom pin element
  const createPin = useCallback((index: number, est: MapEstablishment, isSelected: boolean) => {
    const pin = document.createElement("div");
    pin.style.cssText = `
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      background: ${isSelected ? "#c8a94a" : "#1a1f2e"};
      color: ${isSelected ? "#080c14" : "#c8a94a"};
      border: 2px solid #c8a94a;
      font-size: 12px; font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      cursor: pointer; transition: transform 0.2s;
    `;
    pin.textContent = String(index + 1);
    pin.onmouseenter = () => { pin.style.transform = "scale(1.2)"; };
    pin.onmouseleave = () => { pin.style.transform = "scale(1)"; };
    return pin;
  }, []);

  // Draw markers and routes
  const drawMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    // Clear previous
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    if (infoWindowRef.current) infoWindowRef.current.close();

    const bounds = new google.maps.LatLngBounds();
    const path: google.maps.LatLngLiteral[] = [];

    // If we have day steps, use those; otherwise use establishments
    const items = currentDaySteps.length > 0
      ? currentDaySteps.map(s => ({
          name: s.establishment,
          type: s.type,
          city: s.city,
          description: s.description,
          coordinates: s.coordinates,
          time: s.time,
          transportMode: s.transportMode,
        }))
      : establishments.filter(e => e.coordinates);

    items.forEach((item, index) => {
      if (!item.coordinates) return;
      const pos = item.coordinates;
      path.push(pos);
      bounds.extend(pos);

      const est = establishments.find(e => e.name === item.name) || item as any;
      const isSelected = selectedEstablishment?.name === item.name;
      const pin = createPin(index, est, isSelected);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current!,
        position: pos,
        title: item.name,
        content: pin,
      });

      marker.addListener("click", () => {
        // Show InfoWindow
        if (infoWindowRef.current) infoWindowRef.current.close();
        const emoji = typeEmojis[item.type] || "📍";
        const time = (item as any).time ? `<p style="margin:2px 0;font-size:11px;color:#c8a94a;">${(item as any).time}</p>` : "";
        const transport = (item as any).transportMode
          ? `<p style="margin:2px 0;font-size:10px;color:#8b949e;">🚗 ${(item as any).transportMode}${(item as any).transportDuration ? ` · ${(item as any).transportDuration}` : ""}</p>`
          : "";

        infoWindowRef.current = new google.maps.InfoWindow({
          content: `
            <div style="padding:10px;max-width:240px;font-family:Inter,sans-serif;background:#0d1117;color:#fff;border-radius:8px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:18px;">${emoji}</span>
                <h3 style="margin:0;font-size:14px;font-weight:600;color:#fff;">${item.name}</h3>
              </div>
              ${time}
              <p style="margin:4px 0;font-size:12px;color:#c9d1d9;">${item.description || ""}</p>
              <p style="margin:2px 0;font-size:11px;color:#8b949e;">📍 ${item.city}</p>
              ${transport}
              ${(est as MapEstablishment).priceRange ? `<p style="margin:4px 0;font-size:11px;color:#c8a94a;">${(est as MapEstablishment).priceRange}</p>` : ""}
              <button onclick="window.dispatchEvent(new CustomEvent('baymora-est-click',{detail:'${item.name.replace(/'/g, "\\'")}'}))"
                style="margin-top:8px;width:100%;padding:6px;background:#c8a94a;color:#080c14;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">
                Voir la fiche
              </button>
            </div>
          `,
        });
        infoWindowRef.current.open(mapRef.current!, marker);

        if (onEstablishmentClick && est) {
          onEstablishmentClick(est as MapEstablishment);
        }
      });

      markersRef.current.push(marker);
    });

    // Draw polyline route between points
    if (path.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#c8a94a",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            fillColor: "#c8a94a",
            fillOpacity: 1,
            strokeColor: "#c8a94a",
          },
          offset: "50%",
          repeat: "80px",
        }],
      });
      polylineRef.current.setMap(mapRef.current);
    }

    // Fit bounds
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 60);
    } else if (selectedEstablishment?.coordinates) {
      mapRef.current.panTo(selectedEstablishment.coordinates);
      mapRef.current.setZoom(14);
    }
  }, [establishments, currentDaySteps, selectedEstablishment, createPin, onEstablishmentClick]);

  // Handle map ready
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.setOptions({ styles: darkMapStyles });
    infoWindowRef.current = new google.maps.InfoWindow();
    drawMap();
  }, [drawMap]);

  // Redraw when data changes
  useEffect(() => {
    if (mapRef.current) drawMap();
  }, [drawMap]);

  // Listen for establishment click from InfoWindow
  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail;
      const est = establishments.find(e => e.name === name);
      if (est && onEstablishmentClick) onEstablishmentClick(est);
    };
    window.addEventListener("baymora-est-click", handler);
    return () => window.removeEventListener("baymora-est-click", handler);
  }, [establishments, onEstablishmentClick]);

  // Toggle layers
  const toggleTraffic = useCallback(() => {
    if (!mapRef.current) return;
    if (trafficLayer) {
      trafficLayer.setMap(null);
      setTrafficLayer(null);
    } else {
      const layer = new google.maps.TrafficLayer();
      layer.setMap(mapRef.current);
      setTrafficLayer(layer);
    }
  }, [trafficLayer]);

  const toggleTransit = useCallback(() => {
    if (!mapRef.current) return;
    if (transitLayer) {
      transitLayer.setMap(null);
      setTransitLayer(null);
    } else {
      const layer = new google.maps.TransitLayer();
      layer.setMap(mapRef.current);
      setTransitLayer(layer);
    }
  }, [transitLayer]);

  // Center on selected
  const centerOnSelected = useCallback(() => {
    if (!mapRef.current) return;
    if (selectedEstablishment?.coordinates) {
      mapRef.current.panTo(selectedEstablishment.coordinates);
      mapRef.current.setZoom(15);
    } else {
      const coords = establishments.filter(e => e.coordinates).map(e => e.coordinates!);
      if (coords.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        coords.forEach(c => bounds.extend(c));
        mapRef.current.fitBounds(bounds, 60);
      }
    }
  }, [selectedEstablishment, establishments]);

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      {/* Map */}
      <MapView
        className="w-full h-full min-h-[300px]"
        initialCenter={mapCenter}
        initialZoom={establishments.length > 0 ? 11 : 5}
        onMapReady={handleMapReady}
      />

      {/* Day Navigation Overlay */}
      {showDayNavigation && days && days.length > 0 && (
        <div className="absolute top-3 left-3 right-3 z-10">
          <div className="bg-[#0d1117]/90 backdrop-blur-sm rounded-lg border border-[#c8a94a]/20 p-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveDay(Math.max(0, activeDay - 1))}
                disabled={activeDay === 0}
                className="shrink-0 p-1 text-white/40 hover:text-[#c8a94a] disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              {days.map((day, idx) => (
                <button
                  key={day.day}
                  onClick={() => setActiveDay(idx)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    activeDay === idx
                      ? "bg-[#c8a94a] text-[#080c14]"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  J{day.day}
                </button>
              ))}
              <button
                onClick={() => setActiveDay(Math.min(days.length - 1, activeDay + 1))}
                disabled={activeDay === days.length - 1}
                className="shrink-0 p-1 text-white/40 hover:text-[#c8a94a] disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {days[activeDay] && (
              <p className="text-[10px] text-[#c8a94a] mt-1 px-1 truncate">
                {days[activeDay].title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Transport Options Overlay */}
      {showTransportOptions && (
        <div className="absolute bottom-3 left-3 z-10">
          <div className="bg-[#0d1117]/90 backdrop-blur-sm rounded-lg border border-white/10 p-2">
            <p className="text-[9px] text-white/40 mb-1.5 px-1">Transport</p>
            <div className="flex gap-1">
              {[
                { mode: "car", icon: Car, label: "Voiture" },
                { mode: "uber", icon: Car, label: "Uber" },
                { mode: "walk", icon: Footprints, label: "À pied" },
                { mode: "metro", icon: Train, label: "Métro" },
                { mode: "bike", icon: Bike, label: "Vélo" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setSelectedTransport(mode)}
                  title={label}
                  className={`p-2 rounded-md transition-all ${
                    selectedTransport === mode
                      ? "bg-[#c8a94a] text-[#080c14]"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Controls Overlay */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={centerOnSelected}
          title="Recentrer"
          className="p-2 bg-[#0d1117]/90 backdrop-blur-sm rounded-lg border border-white/10 text-white/60 hover:text-[#c8a94a] transition-colors"
        >
          <Locate size={16} />
        </button>
        <button
          onClick={() => setShowLayers(!showLayers)}
          title="Couches"
          className="p-2 bg-[#0d1117]/90 backdrop-blur-sm rounded-lg border border-white/10 text-white/60 hover:text-[#c8a94a] transition-colors"
        >
          <Layers size={16} />
        </button>
        {showLayers && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d1117]/95 backdrop-blur-sm rounded-lg border border-white/10 p-2 space-y-1"
          >
            <button
              onClick={toggleTraffic}
              className={`w-full text-left text-[10px] px-2 py-1.5 rounded ${trafficLayer ? "text-[#c8a94a] bg-[#c8a94a]/10" : "text-white/60 hover:bg-white/5"}`}
            >
              🚗 Trafic
            </button>
            <button
              onClick={toggleTransit}
              className={`w-full text-left text-[10px] px-2 py-1.5 rounded ${transitLayer ? "text-[#c8a94a] bg-[#c8a94a]/10" : "text-white/60 hover:bg-white/5"}`}
            >
              🚇 Transports
            </button>
          </motion.div>
        )}
      </div>

      {/* Establishments Count Badge */}
      {establishments.length > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-[#0d1117]/90 backdrop-blur-sm border-[#c8a94a]/30 text-[#c8a94a] text-[10px]">
            <MapPin size={10} className="mr-1" />
            {establishments.filter(e => e.coordinates).length} lieu{establishments.filter(e => e.coordinates).length > 1 ? "x" : ""}
          </Badge>
        </div>
      )}
    </div>
  );
}
