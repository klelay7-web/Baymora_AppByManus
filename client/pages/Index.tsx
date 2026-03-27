import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, Users, Sparkles, Map, Lock, Zap } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-primary-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg"></div>
            <span className="font-playfair font-bold text-xl text-foreground">Baymora</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="sm">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="font-playfair text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your Personal Travel <span className="text-primary">Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Baymora is your premium AI assistant that understands your preferences, discovers extraordinary experiences, and orchestrates flawless journeys with white-glove concierge precision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat">
              <Button size="lg" className="gap-2">
                Begin Your Journey
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-playfair text-4xl font-bold text-center mb-16 text-foreground">
            Why Choose Baymora?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our intelligence engine learns your preferences with each conversation, suggesting personalized experiences tailored to your style, budget, and constraints.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Map className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Verified Journeys</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every recommendation is vetted by our team. We visit partners, verify quality, negotiate exclusive rates, and guarantee your satisfaction.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Concierge Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  From digital planning to white-glove execution. Hand off to your personal assistant or our partner concierges for seamless implementation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Complete Discretion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Travel under a pseudonym if you prefer. Your privacy is paramount. We never share your data or preferences without explicit consent.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Instant Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Comprehensive plans in minutes, not days. Local restaurants, transportation options, activities, and insider tips—all curated for your party.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Global Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Partnerships with luxury hotels, Michelin-starred restaurants, exclusive venues, and local experts in every major destination worldwide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-playfair text-4xl font-bold text-center mb-16 text-foreground">
            How Baymora Works
          </h2>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <div className="bg-primary text-white rounded-2xl p-1 w-16 h-16 flex items-center justify-center font-playfair text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="font-playfair text-2xl font-bold mb-3 text-foreground">
                  Tell Us Your Dream
                </h3>
                <p className="text-muted-foreground text-lg mb-4">
                  Chat with Baymora about where you want to go, who's traveling with you, and what makes you happy. Share your budget, preferences, and any special requirements. No research needed—we handle that.
                </p>
              </div>
              <div className="md:w-1/2 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Globe className="h-24 w-24 text-primary/40 mx-auto" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
              <div className="md:w-1/2">
                <div className="bg-secondary text-white rounded-2xl p-1 w-16 h-16 flex items-center justify-center font-playfair text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="font-playfair text-2xl font-bold mb-3 text-foreground">
                  Baymora Composes Your Journey
                </h3>
                <p className="text-muted-foreground text-lg mb-4">
                  Our AI learns about you and crafts a personalized itinerary. We suggest accommodations, restaurants, activities, and transportation options. Everything is researched, verified, and hand-picked.
                </p>
              </div>
              <div className="md:w-1/2 h-64 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-24 w-24 text-secondary/40 mx-auto" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <div className="bg-primary text-white rounded-2xl p-1 w-16 h-16 flex items-center justify-center font-playfair text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="font-playfair text-2xl font-bold mb-3 text-foreground">
                  Review & Refine
                </h3>
                <p className="text-muted-foreground text-lg mb-4">
                  Review your complete itinerary with detailed descriptions, photos, and recommendations. Adjust activities, swap restaurants, or request alternatives until it's perfect.
                </p>
              </div>
              <div className="md:w-1/2 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-24 w-24 text-primary/40 mx-auto" />
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
              <div className="md:w-1/2">
                <div className="bg-secondary text-white rounded-2xl p-1 w-16 h-16 flex items-center justify-center font-playfair text-2xl font-bold mb-4">
                  4
                </div>
                <h3 className="font-playfair text-2xl font-bold mb-3 text-foreground">
                  Execute or Delegate
                </h3>
                <p className="text-muted-foreground text-lg mb-4">
                  Book directly, or hand your plan to us. We connect you with our concierge partners to handle all reservations, special requests, and last-minute adjustments.
                </p>
              </div>
              <div className="md:w-1/2 h-64 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-24 w-24 text-secondary/40 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-playfair text-4xl font-bold text-center mb-16 text-foreground">
            Choose Your Experience
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Assistant Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assistant</CardTitle>
                <CardDescription>Explore & Discover</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-primary">$299</div>
                <p className="text-sm text-muted-foreground">/month</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    AI chat interface
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Web research
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Basic recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    PDF plan export
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Curated Plan */}
            <Card className="border-secondary ring-2 ring-secondary/30">
              <CardHeader>
                <CardTitle className="text-lg">Curated</CardTitle>
                <CardDescription>Verified Partners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-secondary">$999</div>
                <p className="text-sm text-muted-foreground">/month</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-secondary rounded-full"></span>
                    Everything in Assistant
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-secondary rounded-full"></span>
                    Verified partner network
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-secondary rounded-full"></span>
                    Exclusive access & rates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-secondary rounded-full"></span>
                    Client memory & learning
                  </li>
                </ul>
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  Popular Choice
                </Button>
              </CardContent>
            </Card>

            {/* Verified Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verified</CardTitle>
                <CardDescription>Tested Journeys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-primary">$2,999</div>
                <p className="text-sm text-muted-foreground">/month</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Everything in Curated
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Tested journeys
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Concierge support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Quality guarantee
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Explore
                </Button>
              </CardContent>
            </Card>

            {/* Bespoke Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bespoke</CardTitle>
                <CardDescription>Custom Journeys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-primary">Custom</div>
                <p className="text-sm text-muted-foreground">Tailored pricing</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Bespoke design & execution
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    White-glove concierge
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    Unlimited revisions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-primary rounded-full"></span>
                    VIP treatment
                  </li>
                </ul>
                <Button className="w-full" variant="default">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-playfair text-4xl font-bold mb-6">Ready to Travel Better?</h2>
          <p className="text-white/90 text-lg mb-8">
            Start your free conversation with Baymora and discover how we can transform your travel planning.
          </p>
          <Link to="/chat">
            <Button size="lg" variant="secondary" className="gap-2">
              Start Planning Now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-secondary rounded-lg"></div>
                <span className="font-playfair font-bold text-lg">Baymora</span>
              </div>
              <p className="text-white/60 text-sm">
                Premium travel intelligence for the discerning traveler.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/60">
            <p>&copy; 2024 Baymora. All rights reserved.</p>
            <p>Crafted for the world's most discerning travelers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
