/**
 * PERSONAS — Système de profils dimensionnels Baymora
 *
 * Détecte automatiquement le profil client dès les premières phrases
 * et calibre toutes les recommandations en conséquence.
 *
 * 6 tiers budgétaires × 14 dimensions = profil unique par client
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DimensionKey =
  | 'age'
  | 'family'
  | 'visibility'
  | 'orientation'
  | 'mobility'
  | 'diet'
  | 'objective'
  | 'culture'
  | 'money_origin'
  | 'novelty'
  | 'autonomy'
  | 'residence'
  | 'social_media'
  | 'pet';

// Déplacé ici depuis llm.ts pour éviter les imports circulaires
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TierProfile {
  id: string;
  label: string;
  budgetRange: string;
  transport: string[];
  hotels: string[];
  restaurants: string[];
  nightlife: string[];
  alcools: string[];
  cigares?: boolean;
  destinations: string[];
  villaWeeklyAvg?: number;
  yachtDailyAvg?: number;
  dailyUsage: string;
  proactiveAlerts: string[];
  signalPatterns: RegExp[];
}

export interface DetectedProfile {
  tier: string;
  tierConfidence: number;
  dimensions: Partial<Record<DimensionKey, string>>;
  status?: string;
  objectives: string[];
  expressMode: boolean;
  profileLabel: string;
  recommendationCalibration: string;
}

// ─── Données tiers ────────────────────────────────────────────────────────────

export const TIER_PROFILES: TierProfile[] = [
  {
    id: 't1',
    label: 'Explorer',
    budgetRange: '200–1500€',
    transport: ['BlaBlaCar', 'Ouigo', 'Flixbus', 'Autocar'],
    hotels: ['Hostel', 'Ibis', 'Airbnb budget', 'Camping glamping'],
    restaurants: ['Bistrots locaux', 'Street food', 'Marchés'],
    nightlife: ['Bars locaux', 'Concerts gratuits', 'Festivals low-cost'],
    alcools: ['Bière locale', 'Vin maison', 'Cocktails standards'],
    cigares: false,
    destinations: ['Barcelone', 'Prague', 'Lisbonne', 'Cracovie', 'Séville', 'Budapest'],
    dailyUsage: 'Voyageur curieux, maximalise les expériences pour un budget serré',
    proactiveAlerts: ['Promo transport', 'Airbnb deals', 'Activités gratuites'],
    signalPatterns: [
      /blablacar/i,
      /ouigo/i,
      /flixbus/i,
      /pas trop cher/i,
      /petit budget/i,
      /économique/i,
      /bon marché/i,
      /hostel/i,
      /moins de \d{3,4}\s*€/i,
      /budget (serré|limité|réduit)/i,
      /low.?cost/i,
    ],
  },
  {
    id: 't2',
    label: 'Staycation',
    budgetRange: '1500–5000€',
    transport: ['TGV standard', 'Transavia', 'EasyJet', 'Voiture de location'],
    hotels: ['Hôtel 3–4★', 'Airbnb qualité', 'Charme & caractère', 'B&B de charme'],
    restaurants: ['Brasseries qualité', 'Bistrots gastronomiques', 'Tables locales renommées'],
    nightlife: ['Rooftops', 'Wine bars', 'Cocktail bars tendance'],
    alcools: ['Champagne entrée de gamme', 'Bordeaux milieu de gamme', 'Whisky standard'],
    cigares: false,
    destinations: ['Saint-Malo', 'Bordeaux', 'Nice', 'Biarritz', 'Colmar', 'Lyon', 'Annecy'],
    dailyUsage: 'Profil Staycation — qualité de vie sans ostentation',
    proactiveAlerts: ['Promos weekend', 'Tables disponibles', 'Expériences insolites'],
    signalPatterns: [
      /airbnb/i,
      /tgv/i,
      /week.?end/i,
      /se faire plaisir/i,
      /petit.?prix/i,
      /transavia/i,
      /easyjet/i,
      /3.?étoiles/i,
      /4.?étoiles/i,
      /gîte/i,
      /maison d'hôtes/i,
    ],
  },
  {
    id: 't3',
    label: 'Confort+',
    budgetRange: '5000–15000€',
    transport: ['TGV 1ère classe', 'Business court courrier', 'Voiture premium'],
    hotels: ['Hôtel 4–5★', 'Boutique hotel', 'Suites standards', 'Relais & Châteaux'],
    restaurants: ['Tables étoilées', 'Michelin', 'Chefs reconnus'],
    nightlife: ['Bars d\'hôtels de luxe', 'Caves à cocktails premium', 'Clubs select'],
    alcools: ['Dom Pérignon entrée', 'Chablis grand cru', 'Bordeaux classé', 'Scotch 18 ans'],
    cigares: true,
    destinations: ['Côte d\'Azur', 'Toscane', 'Venise', 'Marrakech', 'Amsterdam', 'Édimbourg'],
    dailyUsage: 'Confort et qualité, sensible aux étoiles et aux distinctions',
    proactiveAlerts: ['Disponibilités étoilés', 'Surclassement possible', 'Événements privés'],
    signalPatterns: [
      /1ère classe/i,
      /première classe/i,
      /boutique hotel/i,
      /étoilé/i,
      /michelin/i,
      /relais.{0,10}château/i,
      /5.?étoiles/i,
      /suite/i,
      /premium/i,
      /haut de gamme/i,
    ],
  },
  {
    id: 't4',
    label: 'Premium',
    budgetRange: '15000–60000€',
    transport: ['Business class long-courrier', 'Chauffeur privé', 'Hélicoptère court-trajet'],
    hotels: ['Suites de luxe 1000–5000€/nuit', 'Villa privée', 'Hôtels-boutiques exclusifs'],
    restaurants: ['Tables 2–3 étoiles Michelin', 'Chefs multi-étoilés', 'Expériences privées'],
    nightlife: ['Tables VIP en boîte', 'Bouteilles prestige', 'Événements privés'],
    alcools: ['Dom Pérignon Oenothèque', 'Cristal', 'Krug', 'Pétrus', 'Romanée-Conti entrée', 'Cognac Louis XIII'],
    cigares: true,
    destinations: ['Saint-Tropez', 'Monaco', 'Maldives', 'Ibiza', 'Dubaï', 'Courchevel', 'Capri', 'Mykonos'],
    villaWeeklyAvg: 40000,
    yachtDailyAvg: 10000,
    dailyUsage: 'Client premium, accès VIP, service sur-mesure attendu',
    proactiveAlerts: ['Tables 3 étoiles disponibles', 'Villa disponible', 'Yacht charter'],
    signalPatterns: [
      /business class/i,
      /chauffeur/i,
      /villa privée/i,
      /villa de luxe/i,
      /dom pérignon/i,
      /cristal/i,
      /krug/i,
      /pétrus/i,
      /table privée/i,
      /concierge/i,
      /sur.?mesure/i,
      /exclusif/i,
    ],
  },
  {
    id: 't5',
    label: 'Luxe',
    budgetRange: '60000–500000€',
    transport: ['Jet privé', 'Hélicoptère', 'Yacht charter', 'Sous-marin de luxe'],
    hotels: ['Palace', 'Suite présidentielle', 'Mégayacht', 'Villa 50–300k€/sem'],
    restaurants: ['Dîners privés', 'Chefs déplacés', 'Tables ultra-rares'],
    nightlife: ['Tables VIP de prestige', 'Événements sur invitation', 'Soirées privées'],
    alcools: ['Romanée-Conti', 'Armand de Brignac (Ace of Spades)', 'Louis XIII Black Pearl', 'Pétrus vieux millésimes', 'Dom Pérignon Plénitude P3'],
    cigares: true,
    destinations: ['Ritz Paris', 'George V', 'Four Seasons', 'Gstaad', 'Aspen', 'Tulum VIP', 'Maldives atoll privé'],
    villaWeeklyAvg: 150000,
    yachtDailyAvg: 60000,
    dailyUsage: 'Client UHNW, service blanc-gant, anticipation totale',
    proactiveAlerts: ['Disponibilité palace', 'Jet disponible', 'Événement ultra-select'],
    signalPatterns: [
      /jet privé/i,
      /hélicoptère/i,
      /palace/i,
      /ritz/i,
      /george.?v/i,
      /four seasons/i,
      /romanée.?conti/i,
      /armand.?de.?brignac/i,
      /ace of spades/i,
      /mégayacht/i,
      /mega.?yacht/i,
      /suite présidentielle/i,
      /île privée/i,
    ],
  },
  {
    id: 't6',
    label: 'Ultra',
    budgetRange: 'Sans limite',
    transport: ['Boeing BBJ privatisé', 'Flotte personnelle', 'Sous-marin privé'],
    hotels: ['Île privée', 'Mégayacht >500k€/sem', 'Palace privatisé', 'Château privé'],
    restaurants: ['Dîner de chef triplement étoilé à domicile', 'Expériences ultra-rares'],
    nightlife: ['Soirée privée sur yacht', 'Villa party exclusive', 'Événement créé pour vous'],
    alcools: ['Romanée-Conti collection complète', 'Pétrus vieux millésimes', 'Davidoff Winston Churchill', 'Armand de Brignac Midas 30L'],
    cigares: true,
    destinations: ['Espace (bientôt)', 'Antarctique privé', 'Île achetée', 'Tout avec anonymat total'],
    villaWeeklyAvg: 500000,
    yachtDailyAvg: 200000,
    dailyUsage: 'Client UHNWI, anonymat total, protocole blanc-gant absolu',
    proactiveAlerts: ['Disponibilité île privée', 'Flotte jet', 'Sécurité et logistique'],
    signalPatterns: [
      /mon jet/i,
      /mon yacht/i,
      /mon île/i,
      /mon château/i,
      /mes gardes.{0,10}corps/i,
      /bodyguard/i,
      /anonymat total/i,
      /discrétion absolue/i,
      /ma sécurité/i,
      /ma flotte/i,
      /milliard/i,
    ],
  },
];

// ─── Note architecture ────────────────────────────────────────────────────────
// detectProfile() et buildPersonaPrompt() sont définis dans profileDetector.ts
// pour éviter l'import circulaire : personas.ts ↔ profileDetector.ts
// llm.ts importe directement depuis profileDetector.ts
