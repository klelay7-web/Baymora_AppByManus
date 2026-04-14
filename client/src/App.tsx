import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import { useAuth } from "./_core/hooks/useAuth";

// Pages principales
import Landing from "./pages/Landing";
import Maison from "./pages/Maison";
import Maya from "./pages/Maya";
import Offres from "./pages/Offres";
import Parcours from "./pages/Parcours";
import Profil from "./pages/Profil";
import Premium from "./pages/Premium";
import Auth from "./pages/Auth";
import EstablishmentDetail from "./pages/EstablishmentDetail";
import MaPosition from "./pages/MaPosition";

// Maya Demo
import MayaDemo from "./pages/MayaDemo";
// Onboarding
import { OnboardingWelcome } from "./components/OnboardingWelcome";
// Pages légales
import MentionsLegales from "./pages/MentionsLegales";
import Confidentialite from "./pages/Confidentialite";
import CGU from "./pages/CGU";
import Contact from "./pages/Contact";
import PartenaireEvenement from "./pages/PartenaireEvenement";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070B14" }}>
        <div className="text-[#C8A96E] text-sm tracking-widest animate-pulse">MAISON BAYMORA</div>
      </div>
    );
  }
  if (!user) return <Redirect to="/auth" />;
  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070B14" }}>
        <div className="text-[#C8A96E] text-sm tracking-widest animate-pulse">MAISON BAYMORA</div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Landing — visiteurs non connectes uniquement, redirect /maison si connecté */}
      <Route path="/">
        {() => user ? <Redirect to="/maison" /> : <Landing />}
      </Route>

      {/* Auth */}
      <Route path="/auth">
        {() => user ? <Redirect to="/maison" /> : <Auth />}
      </Route>

      {/* Pages connectees */}
      <Route path="/maison">
        {() => <ProtectedRoute component={Maison} />}
      </Route>
      {/* Maya — accessible aux invités (3 conversations gratuites via localStorage) */}
      <Route path="/maya" component={Maya} />
      <Route path="/offres">
        {() => <ProtectedRoute component={Offres} />}
      </Route>
      <Route path="/parcours">
        {() => <ProtectedRoute component={Parcours} />}
      </Route>
      <Route path="/profil">
        {() => <ProtectedRoute component={Profil} />}
      </Route>
      <Route path="/premium">
        {() => <Premium />}
      </Route>
      <Route path="/ma-position">
        {() => <ProtectedRoute component={MaPosition} />}
      </Route>

      {/* Fiche établissement — tRPC backed, via slug */}
      <Route path="/lieu/:slug" component={EstablishmentDetail} />
      {/* Legacy alias /adresse/:slug */}
      <Route path="/adresse/:slug" component={EstablishmentDetail} />

      {/* Maya Demo — accessible sans connexion */}
      <Route path="/maya-demo" component={MayaDemo} />
      {/* Pages légales — accessibles sans connexion */}
      <Route path="/mentions-legales" component={MentionsLegales} />
      <Route path="/confidentialite" component={Confidentialite} />
      <Route path="/cgu" component={CGU} />
      <Route path="/contact" component={Contact} />
      {/* Formulaire partenaire événement — accessible sans connexion */}
      <Route path="/partenaires/evenement" component={PartenaireEvenement} />

      {/* 404 */}
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
          <OnboardingWelcome />
          <AppLayout>
            <Router />
          </AppLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
