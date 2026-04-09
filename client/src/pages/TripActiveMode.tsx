import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { TripTodoList, TripStep } from "@/components/TripTodoList";
import { MapView } from "@/components/Map";
import { toast } from "sonner";

interface TripActiveModeProps {
  tripPlanId: number;
}

export default function TripActiveMode({ tripPlanId }: TripActiveModeProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"plan" | "map" | "contacts">("plan");

  const { data: plan } = trpc.trips.getPlan.useQuery({ id: tripPlanId });

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#070B14" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#C8A96E] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Calculer le jour actuel
  const startDate = plan.startDate ? new Date(plan.startDate) : new Date();
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
  const currentDay = Math.max(1, Math.min(diffDays + 1, plan.days?.length || 1));
  const totalDays = plan.days?.length || 1;

  // Extraire toutes les étapes
  const allSteps: TripStep[] = (plan.days || []).flatMap((day: any) =>
    (day.steps || []).map((step: any) => ({
      id: step.id,
      time: step.startTime,
      title: step.title || step.name,
      address: step.address,
      phone: step.phone,
      type: step.stepType || "activity",
      completed: step.completed || false,
      isFixed: step.isFixed || false,
      dayNumber: day.dayNumber,
    }))
  );

  // Points de la carte pour le jour actuel
  const todaySteps = allSteps.filter((s) => s.dayNumber === currentDay);

  // Contacts d'urgence
  const contacts = [
    ...((plan as any).hotelPhone ? [{ label: "Hôtel", phone: (plan as any).hotelPhone, emoji: "🏨" }] : []),
    ...todaySteps
      .filter((s) => s.phone && s.type === "restaurant")
      .map((s) => ({ label: s.title, phone: s.phone!, emoji: "🍽️" })),
    { label: "SAMU", phone: "15", emoji: "🚑" },
    { label: "Police", phone: "17", emoji: "👮" },
    { label: "Pompiers", phone: "18", emoji: "🚒" },
    { label: "Urgences EU", phone: "112", emoji: "🆘" },
  ];

  const handleSOS = () => {
    navigate(`/maya?context=sos_${plan.destinationCity || "voyage"}`);
  };

  const emoji = plan.tripType === "romantic" ? "💑" : plan.tripType === "business" ? "💼" : "✈️";

  return (
    <div className="flex flex-col h-screen" style={{ background: "#070B14" }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: "#0D1117", borderBottom: "1px solid rgba(200,169,110,0.15)" }}
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {emoji} {plan.destinationCity || "Voyage"} — Jour {currentDay}/{totalDays}
          </h1>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentDay / totalDays) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #C8A96E, #E8D5A8)" }}
            />
          </div>
        </div>
        <button
          onClick={handleSOS}
          className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          ⚡ SOS
        </button>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-white/10">
        {[
          { key: "plan", label: "📋 Plan" },
          { key: "map", label: "🗺️ Carte" },
          { key: "contacts", label: "📞 Contacts" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className="flex-1 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: activeTab === tab.key ? "#C8A96E" : "#6B7280",
              borderBottom: activeTab === tab.key ? "2px solid #C8A96E" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto pb-40">
        {activeTab === "plan" && (
          <div className="p-4 space-y-3">
            <p className="text-gray-400 text-xs">
              {todaySteps.filter((s) => s.completed).length}/{todaySteps.length} étapes complétées aujourd'hui
            </p>
            {todaySteps.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p className="text-4xl mb-3">🌅</p>
                <p className="text-sm">Aucune étape planifiée pour aujourd'hui</p>
              </div>
            ) : (
              todaySteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: step.completed ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${step.completed ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <span className="text-lg">{step.completed ? "✅" : "⬜"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{step.title}</p>
                    {step.time && <p className="text-gray-500 text-xs">{step.time}</p>}
                  </div>
                  {step.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(step.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#C8A96E] text-sm"
                    >
                      📍
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div className="h-[60vh]">
            <MapView
              onMapReady={(map) => {
                const bounds = new google.maps.LatLngBounds();
                todaySteps.forEach((step, i) => {
                  if (step.address) {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: step.address }, (results, status) => {
                      if (status === "OK" && results?.[0]) {
                        const pos = results[0].geometry.location;
                        new google.maps.Marker({
                          position: pos,
                          map,
                          label: { text: String(i + 1), color: "#070B14", fontWeight: "bold" },
                          icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 14,
                            fillColor: "#C8A96E",
                            fillOpacity: 1,
                            strokeColor: "#070B14",
                            strokeWeight: 2,
                          },
                          title: step.title,
                        });
                        bounds.extend(pos);
                        map.fitBounds(bounds);
                      }
                    });
                  }
                });
              }}
            />
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="p-4 space-y-2">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Contacts du voyage</p>
            {contacts.map((c, i) => (
              <a
                key={i}
                href={`tel:${c.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-xl">{c.emoji}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{c.label}</p>
                  <p className="text-[#C8A96E] text-xs">{c.phone}</p>
                </div>
                <span className="text-gray-400 text-sm">📞</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* TripTodoList en bas */}
      <TripTodoList
        tripPlanId={tripPlanId}
        currentDay={currentDay}
        totalDays={totalDays}
        steps={allSteps}
      />
    </div>
  );
}
