import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDashboardContent from "./pages/AdminDashboardContent";
import Dashboard from "./pages/Dashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerApply from "./pages/PartnerApply";
import PartnerFiche from "./pages/PartnerFiche";
import ClubPage from "./pages/ClubPage";
import JoinPage from "./pages/JoinPage";
import BoutiquePage from "./pages/BoutiquePage";
import TripsPage from "./pages/TripsPage";
import ConciergePage from "./pages/ConciergePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
