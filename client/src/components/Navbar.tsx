import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Menu,
  MessageCircle,
  Sparkles,
  MapPin,
  Globe,
  Shield,
  Crown,
  Users,
  Compass,
  Star,
  Gem,
  Lock,
  Building2,
  Utensils,
  Heart,
  ChevronRight,
  UserCircle,
  LayoutDashboard,
  BrainCircuit,
} from "lucide-react";



/* ─── Navigation Data ─────────────────────────────── */

const servicesItems = [
  {
    title: "Assistant IA Premium",
    description: "Votre accès privé intelligent, disponible 24/7",
    href: "/chat",
    icon: Sparkles,
    highlight: true,
  },
  {
    title: "Parcours Sur-Mesure",
    description: "Itinéraires GPS jour par jour, carte interactive",
    href: "/services",
    icon: MapPin,
  },
  {
    title: "Bundles & Sélections",
    description: "Top 10, secrets d'initiés, listes curatées",
    href: "/inspirations",
    icon: Star,
  },
  {
    title: "Accès Off-Market",
    description: "Propriétés, yachts et expériences exclusives",
    href: "/inspirations#off-market",
    icon: Lock,
  },
  {
    title: "Mode Fantôme",
    description: "Réservations anonymes, discrétion absolue",
    href: "/services#fantome",
    icon: Shield,
  },
];

const destinationsItems = [
  {
    title: "Par Continent",
    description: "Europe, Asie, Amériques, Afrique, Océanie",
    href: "/destinations",
    icon: Globe,
  },
  {
    title: "Par Expérience",
    description: "Gastronomie, Bien-être, Aventure, Culture",
    href: "/destinations#experiences",
    icon: Compass,
  },
  {
    title: "Destinations Secrètes",
    description: "Adresses confidentielles réservées aux membres",
    href: "/destinations#secretes",
    icon: Gem,
  },
  {
    title: "Tendances du Moment",
    description: "Les destinations qui font parler en ce moment",
    href: "/destinations#tendances",
    icon: Heart,
  },
];

const membershipItems = [
  {
    title: "Nos Forfaits",
    description: "Explorer, Premium ou Élite — trouvez le vôtre",
    href: "/pricing",
    icon: Crown,
  },
  {
    title: "Programme Ambassadeur",
    description: "Parrainez et gagnez jusqu'à 22% de commissions",
    href: "/ambassadeur",
    icon: Users,
  },
  {
    title: "Crédits à la Carte",
    description: "Achetez des crédits sans engagement",
    href: "/pricing",
    icon: Sparkles,
  },
];

const aboutItems = [
  {
    title: "Notre Vision",
    description: "L'intelligence artificielle au service du luxe",
    href: "/a-propos",
    icon: Building2,
  },
  {
    title: "Comment ça Marche",
    description: "4 étapes pour une expérience inoubliable",
    href: "/services#how-it-works",
    icon: Compass,
  },
  {
    title: "Prestataires & Partenaires",
    description: "Rejoignez notre réseau de prestataires premium",
    href: "/a-propos#b2b",
    icon: Utensils,
  },
];

/* ─── Desktop Dropdown Item ───────────────────────── */

function NavDropdownItem({
  item,
}: {
  item: {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    highlight?: boolean;
  };
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-start gap-4 rounded-none p-3 transition-colors hover:bg-white/5 ${
        item.highlight ? "bg-[#c8a94a]/5 border-l-2 border-[#c8a94a]" : ""
      }`}
    >
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center ${
            item.highlight
              ? "bg-[#c8a94a]/20 text-[#c8a94a]"
              : "bg-white/5 text-white/40 group-hover:text-[#c8a94a]"
          } transition-colors`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p
            className={`text-sm font-medium leading-tight ${
              item.highlight ? "text-[#c8a94a]" : "text-white/90"
            }`}
          >
            {item.title}
          </p>
          <p className="text-xs text-white/40 mt-0.5 leading-snug font-light">
            {item.description}
          </p>
        </div>
    </Link>
  );
}

/* ─── Mobile Accordion Section ────────────────────── */

function MobileNavSection({
  title,
  items,
  onClose,
}: {
  title: string;
  items: typeof servicesItems;
  onClose: () => void;
}) {
  return (
    <AccordionItem value={title} className="border-b border-white/5">
      <AccordionTrigger className="py-4 text-sm tracking-[0.15em] uppercase text-white/70 hover:text-[#c8a94a] hover:no-underline [&[data-state=open]]:text-[#c8a94a] font-light">
        {title}
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1 pb-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 py-2.5 px-2 transition-colors hover:bg-white/5 ${
                  item.highlight ? "text-[#c8a94a]" : "text-white/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-[11px] text-white/30 font-light">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ─── Main Navbar Component ───────────────────────── */

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track scroll for navbar background opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide on admin pages
  if (location.startsWith("/admin")) return null;

  const isHome = location === "/";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isHome
          ? "bg-[#080c14]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-[72px] flex items-center justify-between">
          {/* ─── Logo ─── */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {/* Monogramme "B" compact dans la navbar */}
            <div className="h-10 w-10 flex items-center justify-center border border-[#c8a94a]/40 rounded-full">
              <span className="font-['Playfair_Display'] text-xl text-[#c8a94a] font-semibold leading-none">
                B
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="font-['Playfair_Display'] text-lg tracking-wide text-[#c8a94a]">
                Maison Baymora
              </span>
            </div>
          </Link>

          {/* ─── Desktop Navigation ─── */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu viewport={false}>
              <NavigationMenuList className="gap-0">
                {/* Services */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white/60 hover:text-[#c8a94a] hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[#c8a94a] text-[13px] tracking-[0.08em] font-light uppercase h-[72px] rounded-none px-4">
                    Nos Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#0c1120]/98 backdrop-blur-2xl border border-white/8 shadow-2xl shadow-black/40 rounded-none p-0 min-w-[380px]">
                    <div className="p-2">
                      <p className="px-3 pt-3 pb-2 text-[10px] tracking-[0.25em] uppercase text-[#c8a94a]/60 font-medium">
                        Services
                      </p>
                      {servicesItems.map((item) => (
                        <NavDropdownItem key={item.title} item={item} />
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Offres */}
                <NavigationMenuItem>
                  <Link href="/offres">
                    <button className="bg-transparent text-white/60 hover:text-[#c8a94a] text-[13px] tracking-[0.08em] font-light uppercase h-[72px] rounded-none px-4 flex items-center gap-1.5 transition-colors">
                      Offres
                    </button>
                  </Link>
                </NavigationMenuItem>

                {/* Destinations */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white/60 hover:text-[#c8a94a] hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[#c8a94a] text-[13px] tracking-[0.08em] font-light uppercase h-[72px] rounded-none px-4">
                    Destinations
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#0c1120]/98 backdrop-blur-2xl border border-white/8 shadow-2xl shadow-black/40 rounded-none p-0 min-w-[380px]">
                    <div className="p-2">
                      <p className="px-3 pt-3 pb-2 text-[10px] tracking-[0.25em] uppercase text-[#c8a94a]/60 font-medium">
                        Explorer le Monde
                      </p>
                      {destinationsItems.map((item) => (
                        <NavDropdownItem key={item.title} item={item} />
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Membership */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white/60 hover:text-[#c8a94a] hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[#c8a94a] text-[13px] tracking-[0.08em] font-light uppercase h-[72px] rounded-none px-4">
                    Membership
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#0c1120]/98 backdrop-blur-2xl border border-white/8 shadow-2xl shadow-black/40 rounded-none p-0 min-w-[380px]">
                    <div className="p-2">
                      <p className="px-3 pt-3 pb-2 text-[10px] tracking-[0.25em] uppercase text-[#c8a94a]/60 font-medium">
                        Rejoindre Maison Baymora
                      </p>
                      {membershipItems.map((item) => (
                        <NavDropdownItem key={item.title} item={item} />
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* À Propos */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white/60 hover:text-[#c8a94a] hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[#c8a94a] text-[13px] tracking-[0.08em] font-light uppercase h-[72px] rounded-none px-4">
                    À Propos
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#0c1120]/98 backdrop-blur-2xl border border-white/8 shadow-2xl shadow-black/40 rounded-none p-0 min-w-[380px]">
                    <div className="p-2">
                      <p className="px-3 pt-3 pb-2 text-[10px] tracking-[0.25em] uppercase text-[#c8a94a]/60 font-medium">
                        Maison Baymora
                      </p>
                      {aboutItems.map((item) => (
                        <NavDropdownItem key={item.title} item={item} />
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* ─── Right Actions ─── */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-3">
                {(user?.role === "team" || user?.role === "admin") && (
                  <Link href="/team/fiches">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/50 hover:text-[#c8a94a] hover:bg-transparent gap-2 rounded-none font-light text-[13px]"
                    >
                      <Building2 className="h-4 w-4" />
                      Terrain
                    </Button>
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link href="/pilotage">
                    <Button
                      size="sm"
                      className="bg-[#c8a94a]/15 text-[#c8a94a] hover:bg-[#c8a94a]/25 gap-2 rounded-none font-semibold text-[13px] border border-[#c8a94a]/40 px-4 uppercase tracking-wider"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Pilotage
                    </Button>
                  </Link>
                )}
                <Link href="/mon-espace">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/50 hover:text-[#c8a94a] hover:bg-transparent gap-2 rounded-none font-light text-[13px]"
                  >
                    <UserCircle className="h-4 w-4" />
                    {user?.name?.split(" ")[0] || "Mon Espace"}
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button
                    size="sm"
                    className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-medium rounded-none px-6 tracking-wider text-[13px] uppercase"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mon Assistant
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <a href={getLoginUrl()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/50 hover:text-[#c8a94a] hover:bg-transparent rounded-none font-light text-[13px] tracking-wider uppercase"
                  >
                    Connexion
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button
                    size="sm"
                    className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] font-medium rounded-none px-6 tracking-wider text-[13px] uppercase"
                  >
                    Demander un Accès
                  </Button>
                </a>
              </div>
            )}

            {/* ─── Mobile Hamburger ─── */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/70 hover:text-[#c8a94a] hover:bg-transparent"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-[#080c14] border-l border-white/5 w-[320px] sm:max-w-[360px] p-0"
                >
                  <SheetHeader className="p-6 pb-4 border-b border-white/5">
                    <SheetTitle className="flex items-center gap-3">
                      <div className="h-8 w-8 flex items-center justify-center border border-[#c8a94a]/40 rounded-full">
                        <span className="font-['Playfair_Display'] text-lg text-[#c8a94a] font-semibold leading-none">
                          B
                        </span>
                      </div>
                      <span className="font-['Playfair_Display'] text-[#c8a94a] text-base">
                        Maison Baymora
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-6 pt-2">
                    <Accordion type="multiple" className="w-full">
                      <MobileNavSection
                        title="Nos Services"
                        items={servicesItems}
                        onClose={() => setMobileOpen(false)}
                      />
                      <MobileNavSection
                        title="Destinations"
                        items={destinationsItems}
                        onClose={() => setMobileOpen(false)}
                      />
                      <MobileNavSection
                        title="Membership"
                        items={membershipItems}
                        onClose={() => setMobileOpen(false)}
                      />
                      <MobileNavSection
                        title="À Propos"
                        items={aboutItems}
                        onClose={() => setMobileOpen(false)}
                      />
                    </Accordion>

                    {/* Direct Links */}
                    <div className="mt-6 space-y-1">
                      <Link
                        href="/discover"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between py-3 px-2 text-sm text-white/60 hover:text-[#c8a94a] transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <Compass className="h-4 w-4" />
                          Explorer
                        </span>
                        <ChevronRight className="h-4 w-4 text-white/20" />
                      </Link>
                      <Link
                        href="/pricing"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between py-3 px-2 text-sm text-white/60 hover:text-[#c8a94a] transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <Crown className="h-4 w-4" />
                          Forfaits
                        </span>
                        <ChevronRight className="h-4 w-4 text-white/20" />
                      </Link>
                    </div>
                  </div>

                  {/* Mobile Footer Actions */}
                  <div className="p-6 border-t border-white/5 space-y-3">
                    {isAuthenticated ? (
                      <>
                        <Link
                          href="/chat"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none py-5 tracking-wider uppercase text-sm font-medium">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Mon Assistant
                          </Button>
                        </Link>
                        <Link
                          href="/mon-espace"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button
                            variant="outline"
                            className="w-full border-white/10 text-white/60 hover:text-[#c8a94a] hover:border-[#c8a94a]/30 rounded-none py-5 tracking-wider uppercase text-sm mt-2"
                          >
                            <UserCircle className="h-4 w-4 mr-2" />
                            Mon Espace
                          </Button>
                        </Link>
                        {(user?.role === "team" || user?.role === "admin") && (
                          <Link
                            href="/team/fiches"
                            onClick={() => setMobileOpen(false)}
                          >
                            <Button
                              variant="outline"
                              className="w-full border-[#c8a94a]/20 text-[#c8a94a]/70 hover:text-[#c8a94a] hover:border-[#c8a94a]/40 rounded-none py-5 tracking-wider uppercase text-sm mt-2"
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              Espace Terrain
                            </Button>
                          </Link>
                        )}
                        {user?.role === "admin" && (
                          <Link
                            href="/pilotage"
                            onClick={() => setMobileOpen(false)}
                          >
                            <Button
                              variant="outline"
                              className="w-full border-[#c8a94a]/30 text-[#c8a94a] hover:text-[#c8a94a] hover:border-[#c8a94a]/60 rounded-none py-5 tracking-wider uppercase text-sm mt-2"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Pilotage
                            </Button>
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        <a href={getLoginUrl()}>
                          <Button className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none py-5 tracking-wider uppercase text-sm font-medium">
                            Demander un Accès
                          </Button>
                        </a>
                        <a href={getLoginUrl()}>
                          <Button
                            variant="outline"
                            className="w-full border-white/10 text-white/60 hover:text-[#c8a94a] hover:border-[#c8a94a]/30 rounded-none py-5 tracking-wider uppercase text-sm mt-2"
                          >
                            Connexion
                          </Button>
                        </a>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
