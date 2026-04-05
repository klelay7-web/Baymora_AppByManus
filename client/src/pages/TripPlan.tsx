import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { InteractiveMap, type MapDay, type MapEstablishment } from "@/components/InteractiveMap";
import { useParams, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Car, Footprints, Bike, Train, Plane, Navigation,
  Utensils, Hotel, Camera, ShoppingBag, Coffee, Briefcase, Heart,
  ChevronLeft, ChevronRight, Check, Star, DollarSign, ArrowLeft
} from "lucide-react";
import { getLoginUrl } from "@/const";

const transportIcons: Record<string, any> = {
  walk: Footprints, car: Car, taxi: Car, uber: Car, chauffeur: Car,
  bus: Train, metro: Train, train: Train, flight: Plane, bike: Bike,
  boat: Navigation, scooter: Bike,
};

const stepTypeIcons: Record<string, any> = {
  transport_departure: Plane, flight: Plane, checkin: Hotel, meal: Utensils,
  activity: Camera, sightseeing: Camera, shopping: ShoppingBag,
  relaxation: Coffee, meeting: Briefcase, transfer: Car, checkout: Hotel,
  transport_return: Plane, free_time: Heart, walk: Footprints,
};

const budgetColors: Record<string, string> = {
  economy: "text-emerald-400", moderate: "text-blue-400",
  premium: "text-amber-400", ultra_premium: "text-amber-300",
};

export default function TripPlan() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeDay, setActiveDay] = useState(0);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const tripId = params.id ? parseInt(params.id) : 0;
  const { data: trip, isLoading } = trpc.trips.getPlan.useQuery(
    { id: tripId },
    { enabled: !!tripId && isAuthenticated }
  );

  const currentDay = trip?.days?.[activeDay];
  const steps = currentDay?.steps || [];

  // Convert trip data to InteractiveMap types
  const tripMapDays: MapDay[] = useMemo(() => {
    if (!trip?.days) return [];
    return trip.days.map((d: any) => ({
      day: d.dayNumber || 1,
      title: d.title || `Jour ${d.dayNumber}`,
      steps: (d.steps || []).map((s: any) => ({
        time: s.startTime || "",
        establishment: s.title || s.locationName || "",
        type: s.stepType || "activity",
        description: s.description || "",
        city: s.locationName || "",
        coordinates: s.lat && s.lng ? { lat: s.lat, lng: s.lng } : undefined,
        transportMode: s.transportMode,
        transportDuration: s.transportDurationMinutes ? `${s.transportDurationMinutes} min` : undefined,
      })),
    }));
  }, [trip?.days]);

  const tripMapEstablishments: MapEstablishment[] = useMemo(() => {
    if (!trip?.days) return [];
    const ests: MapEstablishment[] = [];
    trip.days.forEach((d: any) => {
      (d.steps || []).forEach((s: any) => {
        if (s.lat && s.lng) {
          ests.push({
            name: s.title || s.locationName || "",
            type: s.stepType || "activity",
            city: s.locationName || "",
            description: s.description || "",
            priceRange: s.estimatedCost ? `${s.estimatedCost}\u20ac` : undefined,
            coordinates: { lat: s.lat, lng: s.lng },
          });
        }
      });
    });
    return ests;
  }, [trip?.days]);

  // Map drawing is now handled by InteractiveMap component

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <Plane className="w-16 h-16 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-playfair text-white mb-2">Connectez-vous pour voir vos voyages</h2>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-gold text-background hover:bg-gold/90 mt-4">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <Plane className="w-12 h-12 text-gold mx-auto mb-3 animate-bounce" />
          <p className="text-white/60">Chargement de votre parcours...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Voyage non trouvé</p>
          <Button onClick={() => navigate("/chat")} variant="outline" className="border-gold/30 text-gold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gold/10 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} className="text-white/60 hover:text-gold">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-none">{trip.title}</h1>
              <p className="text-xs text-white/40">
                {trip.destinationCity}, {trip.destinationCountry} · {trip.startDate} → {trip.endDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${budgetColors[trip.budgetLevel]} bg-transparent border border-current text-xs`}>
              {trip.budgetLevel}
            </Badge>
            <Badge variant="outline" className="border-gold/30 text-gold text-xs">
              {trip.tripType}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content: Split View */}
      <div className="flex flex-col md:flex-row" style={{ height: "calc(100vh - 56px - 80px)" }}>
        {/* Left Panel: Day Timeline */}
        <div className="w-full md:w-[400px] lg:w-[440px] border-r border-gold/10 flex flex-col order-2 md:order-1">
          {/* Day Tabs */}
          <div className="border-b border-gold/10 p-2 flex-shrink-0">
            <ScrollArea className="w-full" style={{ maxHeight: "48px" }}>
              <div className="flex gap-1">
                {trip.days?.map((day, idx) => (
                  <button
                    key={day.id}
                    onClick={() => { setActiveDay(idx); setSelectedStep(null); }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeDay === idx
                        ? "bg-gold text-background"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    J{day.dayNumber}
                    {day.date && <span className="ml-1 opacity-70">{day.date.slice(5)}</span>}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Day Info */}
          {currentDay && (
            <div className="p-3 border-b border-gold/10 flex-shrink-0">
              <h3 className="text-sm font-semibold text-white">{currentDay.title || `Jour ${currentDay.dayNumber}`}</h3>
              {currentDay.summary && <p className="text-xs text-white/50 mt-1">{currentDay.summary}</p>}
            </div>
          )}

          {/* Steps Timeline */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {steps.map((step, idx) => {
                const StepIcon = stepTypeIcons[step.stepType] || MapPin;
                const TransportIcon = step.transportMode ? transportIcons[step.transportMode] || Car : null;
                const isSelected = selectedStep === idx;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {/* Transport between steps */}
                    {idx > 0 && step.transportMode && (
                      <div className="flex items-center gap-2 py-1 pl-6 text-white/30">
                        <div className="w-px h-4 bg-gold/20" />
                        {TransportIcon && <TransportIcon className="w-3 h-3" />}
                        <span className="text-[10px]">
                          {step.transportDurationMinutes && `${step.transportDurationMinutes} min`}
                          {step.transportDistanceKm && ` · ${step.transportDistanceKm} km`}
                        </span>
                      </div>
                    )}

                    {/* Step Card */}
                    <button
                      onClick={() => {
                        setSelectedStep(idx);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isSelected
                          ? "bg-gold/10 border border-gold/30"
                          : "bg-white/[0.02] hover:bg-white/[0.05] border border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.confirmed ? "bg-gold/20 text-gold" : "bg-white/10 text-white/60"
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white truncate">{step.title}</h4>
                            {step.startTime && (
                              <span className="text-[10px] text-gold/80 flex-shrink-0 ml-2">{step.startTime}</span>
                            )}
                          </div>
                          {step.locationName && (
                            <p className="text-xs text-white/40 mt-0.5 truncate">{step.locationName}</p>
                          )}
                          {step.description && (
                            <p className="text-xs text-white/50 mt-1 line-clamp-2">{step.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            {step.durationMinutes && (
                              <span className="text-[10px] text-white/30 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {step.durationMinutes} min
                              </span>
                            )}
                            {step.estimatedCost && (
                              <span className="text-[10px] text-gold/60 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> {step.estimatedCost}€
                              </span>
                            )}
                            {step.confirmed && (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Confirmé
                              </span>
                            )}
                          </div>
                          {step.tips && (
                            <p className="text-[10px] text-amber-400/60 mt-1 italic">💡 {step.tips}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}

              {steps.length === 0 && (
                <div className="text-center py-12 text-white/30">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Aucune étape pour ce jour</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Day Summary Footer */}
          {steps.length > 0 && (
            <div className="border-t border-gold/10 p-3 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-white/40">
                {steps.length} étapes · {steps.filter(s => s.confirmed).length} confirmées
              </div>
              <div className="text-xs text-gold font-medium">
                {steps.reduce((sum, s) => sum + parseFloat(String(s.estimatedCost || 0)), 0).toFixed(0)}€ estimé
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Interactive Map */}
        <div className="flex-1 relative order-1 md:order-2 h-[40vh] md:h-full">
          <InteractiveMap
            establishments={tripMapEstablishments}
            days={tripMapDays}
            showTransportOptions={true}
            showDayNavigation={(trip.days?.length || 0) > 1}
            className="w-full h-full"
          />

          {/* Trip Overview Card */}
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-gold/20 max-w-[200px] z-10">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-4 h-4 text-gold" />
              <span className="text-xs font-medium text-white">{trip.destinationCity}</span>
            </div>
            <div className="space-y-1 text-[10px] text-white/50">
              <div>📅 {trip.days?.length || 0} jours</div>
              <div>👥 {trip.travelers} voyageur{(trip.travelers || 1) > 1 ? 's' : ''}</div>
              {trip.estimatedTotal && <div className="text-gold font-medium">💰 {trip.estimatedTotal}€ total</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
