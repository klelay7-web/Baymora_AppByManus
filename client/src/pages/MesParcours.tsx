import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Route, Plus, MapPin, Heart, Clock, ChevronRight, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function MesParcours() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#c8a94a]/10 border border-[#c8a94a]/20 flex items-center justify-center mb-6">
          <Route size={28} className="text-[#c8a94a]" />
        </div>
        <h2 className="font-['Playfair_Display'] text-xl text-white/90 mb-2">
          Vos Parcours
        </h2>
        <p className="text-white/40 text-sm max-w-xs mb-6 leading-relaxed">
          Connectez-vous pour créer et retrouver vos parcours de voyage personnalisés.
        </p>
        <a href={getLoginUrl()}>
          <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-8 py-5 text-sm tracking-wider uppercase font-medium">
            Se connecter
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6">
        <h1 className="font-['Playfair_Display'] text-xl md:text-2xl text-white/90">
          Mes Parcours
        </h1>
        <p className="text-white/40 text-xs mt-1">
          Vos itinéraires et voyages personnalisés
        </p>
      </div>

      {/* Quick actions */}
      <div className="px-4 md:px-6 flex gap-3 overflow-x-auto scrollbar-hide pb-4">
        <Link href="/chat">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#c8a94a]/10 border border-[#c8a94a]/20 whitespace-nowrap">
            <Sparkles size={14} className="text-[#c8a94a]" />
            <span className="text-[#c8a94a] text-xs font-medium tracking-wide">
              Créer avec ARIA
            </span>
          </div>
        </Link>
        <Link href="/discover">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] whitespace-nowrap">
            <MapPin size={14} className="text-white/50" />
            <span className="text-white/50 text-xs font-medium tracking-wide">
              Explorer
            </span>
          </div>
        </Link>
      </div>

      {/* Parcours list */}
      <ParcoursContent />
    </div>
  );
}

function ParcoursContent() {
  // Load user's trip plans
  const { data: trips, isLoading } = trpc.trips.getMyPlans.useQuery(undefined, {
    retry: false,
  });

  // Load saved parcours/destinations
  const { data: savedParcours } = trpc.lena.savedParcours.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="px-4 md:px-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-white/[0.02] border border-white/[0.04] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const hasTrips = trips && trips.length > 0;
  const hasSaved = savedParcours && savedParcours.length > 0;

  if (!hasTrips && !hasSaved) {
    return (
      <div className="px-4 md:px-6 pt-8">
        <div className="text-center py-12 border border-dashed border-white/[0.08]">
          <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Route size={24} className="text-white/20" />
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">
            Aucun parcours
          </h3>
          <p className="text-white/30 text-xs max-w-xs mx-auto mb-5 leading-relaxed">
            Demandez à ARIA de créer votre premier parcours de voyage personnalisé.
          </p>
          <Link href="/chat">
            <Button className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none px-6 py-4 text-xs tracking-wider uppercase font-medium">
              <Sparkles size={14} className="mr-2" />
              Parler à ARIA
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 space-y-6">
      {/* Active trips */}
      {hasTrips && (
        <section>
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/60 font-medium mb-3">
            Mes Voyages
          </h3>
          <div className="space-y-2">
            {trips.map((trip: any) => (
              <Link key={trip.id} href={`/trip/${trip.id}`}>
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] hover:border-[#c8a94a]/20 transition-colors group">
                  {trip.coverImageUrl ? (
                    <img
                      src={trip.coverImageUrl}
                      alt=""
                      className="w-14 h-14 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#c8a94a]/5 border border-[#c8a94a]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-[#c8a94a]/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-white/80 font-medium truncate group-hover:text-[#c8a94a] transition-colors">
                      {trip.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      {trip.destination && (
                        <span className="text-[11px] text-white/30 flex items-center gap-1">
                          <MapPin size={10} />
                          {trip.destination}
                        </span>
                      )}
                      {trip.duration && (
                        <span className="text-[11px] text-white/30 flex items-center gap-1">
                          <Clock size={10} />
                          {trip.duration}j
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/15 group-hover:text-[#c8a94a]/40 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Saved parcours */}
      {hasSaved && (
        <section>
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#c8a94a]/60 font-medium mb-3">
            Parcours Sauvegardés
          </h3>
          <div className="space-y-2">
            {savedParcours.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Heart size={18} className="text-[#c8a94a]/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-white/80 font-medium truncate">
                    {p.title}
                  </h4>
                  <p className="text-[11px] text-white/30 mt-0.5 truncate">
                    {p.destination || "Parcours sauvegardé"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
