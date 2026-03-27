import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Download } from "lucide-react";
import { ChatInterface } from "@/components/ChatInterface";
import { cn } from "@/lib/utils";

export default function Chat() {
  const [language, setLanguage] = useState<'en' | 'fr'>('fr');
  const [conversationId, setConversationId] = useState('');
  const [showPlans, setShowPlans] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {language === 'fr' ? 'Accueil' : 'Home'}
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant={language === 'fr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('fr')}
            >
              🇫🇷 FR
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
            >
              🇬🇧 EN
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <Card className="border-primary/20 h-full">
              <CardContent className="p-0">
                <ChatInterface
                  conversationId={conversationId}
                  language={language}
                  onConversationCreated={setConversationId}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Tips */}
            <Card className="border-secondary/20">
              <div className="p-4">
                <h3 className="font-semibold mb-3 text-sm">
                  {language === 'fr' ? '💡 Conseils' : '💡 Tips'}
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>
                      {language === 'fr'
                        ? 'Parlez naturellement de vos envies'
                        : 'Speak naturally about your wishes'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>
                      {language === 'fr'
                        ? 'Mentionnez le nombre de personnes'
                        : 'Mention how many people'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>
                      {language === 'fr'
                        ? 'Partagez votre budget'
                        : 'Share your budget'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>
                      {language === 'fr'
                        ? 'Indiquez les contraintes (animaux, enfants...)'
                        : 'Mention constraints (pets, kids...)'}
                    </span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* What You Get */}
            <Card className="border-accent/20">
              <div className="p-4">
                <h3 className="font-semibold mb-3 text-sm">
                  {language === 'fr' ? '🎯 Ce que tu obtiens' : '🎯 What you get'}
                </h3>
                <ul className="space-y-2 text-xs">
                  <li className="flex gap-2 items-start">
                    <span className="text-secondary">📍</span>
                    <span>
                      {language === 'fr'
                        ? 'Destination et trajet'
                        : 'Destination & route'}
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-secondary">🏨</span>
                    <span>
                      {language === 'fr' ? 'Hébergement' : 'Accommodation'}
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-secondary">🍽️</span>
                    <span>
                      {language === 'fr'
                        ? 'Restaurants & cafés'
                        : 'Restaurants & cafes'}
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-secondary">🎭</span>
                    <span>
                      {language === 'fr' ? 'Activités' : 'Activities'}
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-secondary">🚗</span>
                    <span>
                      {language === 'fr'
                        ? 'Transport & mobilité'
                        : 'Transport & mobility'}
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-secondary">💡</span>
                    <span>
                      {language === 'fr'
                        ? 'Tips locaux & secrets'
                        : 'Local tips & secrets'}
                    </span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Recent Plans */}
            <Card className="border-primary/20">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    {language === 'fr' ? '📋 Plans' : '📋 Plans'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPlans(!showPlans)}
                    className="text-primary"
                  >
                    {showPlans ? 'Masquer' : 'Voir'}
                  </Button>
                </div>

                {showPlans && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {language === 'fr'
                        ? 'Aucun plan encore. Créez-en un dans la conversation !'
                        : 'No plans yet. Create one in the chat!'}
                    </p>
                    <Button size="sm" variant="outline" className="w-full gap-2">
                      <Download className="h-3 w-3" />
                      {language === 'fr' ? 'Télécharger plan' : 'Download plan'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Help */}
            <Card className="border-border">
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2">
                  {language === 'fr' ? '❓ Questions ?' : '❓ Questions?'}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {language === 'fr'
                    ? 'Consultez notre guide ou contactez le support'
                    : 'Check our guide or contact support'}
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  {language === 'fr' ? 'Guide Baymora' : 'Baymora Guide'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
          <p className="text-xs text-muted-foreground">
            {language === 'fr'
              ? '🔒 Vos conversations sont privées et sécurisées. Baymora ne partage jamais vos données.'
              : '🔒 Your conversations are private and secure. Baymora never shares your data.'}
          </p>
        </div>
      </div>
    </div>
  );
}
