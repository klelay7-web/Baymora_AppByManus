import "./global.css";

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// ─── Eager load : pages critiques (landing + auth) ──────────────────────────
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// ─── Lazy load : toutes les autres pages ────────────────────────────────────
const Chat = lazy(() => import("./pages/Chat"));
const GoogleAuthSuccess = lazy(() => import("./pages/GoogleAuthSuccess"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDashboardContent = lazy(() => import("./pages/AdminDashboardContent"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const PartnerApply = lazy(() => import("./pages/PartnerApply"));
const PartnerFiche = lazy(() => import("./pages/PartnerFiche"));
const ClubPage = lazy(() => import("./pages/ClubPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const BoutiquePage = lazy(() => import("./pages/BoutiquePage"));
const TripsPage = lazy(() => import("./pages/TripsPage"));
const ConciergePage = lazy(() => import("./pages/ConciergePage"));
const PrestataireDashboard = lazy(() => import("./pages/PrestataireDashboard"));
const SalonPrive = lazy(() => import("./pages/SalonPrive"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
        <p className="text-white/40 text-sm">Chargement...</p>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/partner" element={<PartnerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboardContent />} />
            <Route path="/devenir-partenaire" element={<PartnerApply />} />
            <Route path="/partenaires/:slug" element={<PartnerFiche />} />
            <Route path="/club" element={<ClubPage />} />
            <Route path="/boutique" element={<BoutiquePage />} />
            <Route path="/join/:code" element={<JoinPage />} />
            <Route path="/voyages" element={<TripsPage />} />
            <Route path="/conciergerie" element={<ConciergePage />} />
            <Route path="/prestataire" element={<PrestataireDashboard />} />
            <Route path="/salon" element={<SalonPrive />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
