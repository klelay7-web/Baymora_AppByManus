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
import Navbar from "./components/Navbar";
import { lazy, Suspense } from "react";

// Lazy load admin dashboard (only for admins)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/discover" component={Discover} />
      <Route path="/discover/:slug" component={CardDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/trip/:id" component={TripPlan} />
      <Route path="/establishment/:id" component={EstablishmentDetail} />
      <Route path="/admin">
        {() => (
          <Suspense
            fallback={
              <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
                <div className="text-[#c8a94a] text-sm tracking-wider">Chargement...</div>
              </div>
            }
          >
            <AdminDashboard />
          </Suspense>
        )}
      </Route>
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
