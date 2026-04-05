import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Discover from "./pages/Discover";
import CardDetail from "./pages/CardDetail";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import TripPlan from "./pages/TripPlan";
import EstablishmentDetail from "./pages/EstablishmentDetail";
import Destinations from "./pages/Destinations";
import Inspirations from "./pages/Inspirations";
import Services from "./pages/Services";
import About from "./pages/About";
import Navbar from "./components/Navbar";
import { lazy, Suspense } from "react";

// Lazy load dashboards
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DashboardClient = lazy(() => import("./pages/DashboardClient"));
const DashboardAmbassador = lazy(() => import("./pages/DashboardAmbassador"));
const AdminCommandCenter = lazy(() => import("./pages/AdminCommandCenter"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const AdminSeoFiches = lazy(() => import("./pages/AdminSeoFiches"));
const AdminContentSocial = lazy(() => import("./pages/AdminContentSocial"));
const AdminPartnersCommissions = lazy(() => import("./pages/AdminPartnersCommissions"));
const TeamDashboard = lazy(() => import("./pages/TeamDashboard"));
const Pilotage = lazy(() => import("./pages/Pilotage"));
const AdminEmailCenter = lazy(() => import("./pages/AdminEmailCenter"));
const LenaWorkspace = lazy(() => import("./pages/LenaWorkspace"));

function LazyPage({ Component }: { Component: React.LazyExoticComponent<any> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-primary text-sm tracking-wider animate-pulse">Chargement...</div>
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/discover" component={Discover} />
      <Route path="/discover/:slug" component={CardDetail} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/trip/:id" component={TripPlan} />
      <Route path="/establishment/:slug" component={EstablishmentDetail} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/inspirations" component={Inspirations} />
      <Route path="/services" component={Services} />
      <Route path="/a-propos" component={About} />

      {/* Client Dashboards */}
      <Route path="/profile" component={Profile} />
      <Route path="/mon-espace">{() => <LazyPage Component={DashboardClient} />}</Route>
      <Route path="/ambassadeur">{() => <LazyPage Component={DashboardAmbassador} />}</Route>

      {/* Team Dashboard */}
      <Route path="/team/fiches">{() => <LazyPage Component={TeamDashboard} />}</Route>

      {/* Admin Dashboards */}
      <Route path="/admin">{() => <LazyPage Component={AdminDashboard} />}</Route>
      <Route path="/admin/command-center">{() => <LazyPage Component={CommandCenter} />}</Route>
      <Route path="/admin/seo-fiches">{() => <LazyPage Component={AdminSeoFiches} />}</Route>
      <Route path="/admin/content-social">{() => <LazyPage Component={AdminContentSocial} />}</Route>
      <Route path="/admin/partners-commissions">{() => <LazyPage Component={AdminPartnersCommissions} />}</Route>

      {/* Pilotage Owner */}
      <Route path="/pilotage">{() => <LazyPage Component={Pilotage} />}</Route>
      <Route path="/admin/emails">{() => <LazyPage Component={AdminEmailCenter} />}</Route>
      <Route path="/lena-workspace">{() => <LazyPage Component={LenaWorkspace} />}</Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
