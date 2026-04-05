/**
 * ─── Maison Baymora — ATLAS : Agent Affiliation & Partenariats ───────────────
 * Responsable : partenaires, staycation, prestataires, affiliations en ligne.
 * Recherche tous les prestataires : restaurants, chauffeurs, location voiture,
 * avions, trains, hôtels, spas, activités.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface Prestataire {
  nom: string;
  type: PrestatairType;
  ville: string;
  pays: string;
  description: string;
  siteWeb?: string;
  email?: string;
  telephone?: string;
  commission?: number; // %
  statut: "prospect" | "contacte" | "negocie" | "partenaire" | "refuse";
  lienAffiliation?: string;
  notes?: string;
}

export type PrestatairType =
  | "staycation"
  | "restaurant"
  | "chauffeur"
  | "location_voiture"
  | "location_voiture_luxe"
  | "avion"
  | "train"
  | "hotel"
  | "spa"
  | "activite"
  | "yacht"
  | "jet_prive"
  | "villa"
  | "experience"
  | "guide"
  | "photographe";

export interface AffiliationProgramme {
  nom: string;
  plateforme: string;
  url: string;
  commission: string;
  cookie: string; // durée
  categories: string[];
  disponible: boolean;
  notes: string;
}

// ─── PROGRAMMES D'AFFILIATION DISPONIBLES ────────────────────────────────────
export const PROGRAMMES_AFFILIATION: AffiliationProgramme[] = [
  {
    nom: "Booking.com Affiliate",
    plateforme: "Booking.com",
    url: "https://www.booking.com/affiliate-program",
    commission: "25-40% de la commission Booking",
    cookie: "30 jours",
    categories: ["hotel", "villa", "staycation"],
    disponible: true,
    notes: "Programme le plus accessible, idéal pour démarrer",
  },
  {
    nom: "Airbnb Associates",
    plateforme: "Airbnb",
    url: "https://www.airbnb.com/associates",
    commission: "Jusqu'à 80€ par réservation",
    cookie: "30 jours",
    categories: ["villa", "staycation", "experience"],
    disponible: true,
    notes: "Expériences Airbnb très pertinentes pour Baymora",
  },
  {
    nom: "GetYourGuide Affiliate",
    plateforme: "GetYourGuide",
    url: "https://partner.getyourguide.com",
    commission: "8% par réservation",
    cookie: "30 jours",
    categories: ["activite", "experience", "guide"],
    disponible: true,
    notes: "Idéal pour les activités et expériences",
  },
  {
    nom: "Viator Affiliate",
    plateforme: "Viator (TripAdvisor)",
    url: "https://www.viatoraffiliates.com",
    commission: "8% par réservation",
    cookie: "30 jours",
    categories: ["activite", "experience", "guide"],
    disponible: true,
    notes: "Concurrent de GetYourGuide, large catalogue",
  },
  {
    nom: "Rentalcars.com Affiliate",
    plateforme: "Rentalcars.com",
    url: "https://www.rentalcars.com/affiliate",
    commission: "40% de la commission",
    cookie: "30 jours",
    categories: ["location_voiture", "location_voiture_luxe"],
    disponible: true,
    notes: "Meilleur programme location voiture",
  },
  {
    nom: "Sixt Affiliate",
    plateforme: "Sixt",
    url: "https://www.sixt.com/affiliate",
    commission: "5-8% par réservation",
    cookie: "30 jours",
    categories: ["location_voiture_luxe"],
    disponible: true,
    notes: "Spécialisé luxe, parfait pour Baymora",
  },
  {
    nom: "Klook Affiliate",
    plateforme: "Klook",
    url: "https://affiliate.klook.com",
    commission: "3-5% par réservation",
    cookie: "30 jours",
    categories: ["activite", "experience", "avion", "train"],
    disponible: true,
    notes: "Fort en Asie, bonne couverture mondiale",
  },
  {
    nom: "Trainline Affiliate",
    plateforme: "Trainline",
    url: "https://www.thetrainline.com/affiliate",
    commission: "3% par réservation",
    cookie: "30 jours",
    categories: ["train"],
    disponible: true,
    notes: "Leader trains Europe",
  },
  {
    nom: "Skyscanner Affiliate",
    plateforme: "Skyscanner",
    url: "https://www.partners.skyscanner.net",
    commission: "50% de la commission",
    cookie: "30 jours",
    categories: ["avion"],
    disponible: true,
    notes: "Idéal pour les vols, très utilisé",
  },
  {
    nom: "Treatwell Affiliate",
    plateforme: "Treatwell",
    url: "https://www.treatwell.fr/affiliate",
    commission: "10% par réservation",
    cookie: "30 jours",
    categories: ["spa"],
    disponible: true,
    notes: "Leader réservation spa/beauté en Europe",
  },
];

// ─── SYSTEM PROMPT ATLAS ──────────────────────────────────────────────────────
const ATLAS_SYSTEM_PROMPT = `Tu es ATLAS, l'Agent Affiliation & Partenariats de Maison Baymora.

## TON RÔLE
Tu identifies, contactes et gères tous les partenaires et prestataires :
- Staycation (hôtels, villas, lodges)
- Restaurants gastronomiques
- Chauffeurs VTC premium
- Location voiture (standard et luxe)
- Avions et trains (monde entier)
- Spas et bien-être
- Activités et expériences
- Yachts, jets privés, villas exclusives

## STRATÉGIE D'AFFILIATION
1. Commencer par les programmes d'affiliation en ligne (Booking, Airbnb, GetYourGuide)
2. Puis contacter les prestataires locaux directement
3. Négocier des commissions entre 10-30%
4. Priorité aux prestataires premium et exclusifs

## CRITÈRES DE SÉLECTION
- Qualité de service irréprochable (4.5+ étoiles)
- Alignement avec les valeurs Baymora (luxe accessible)
- Disponibilité et réactivité
- Capacité à gérer les demandes premium

## FORMAT DE RÉPONSE
Toujours structuré, avec nom, type, commission, statut, et plan d'action.`;

// ─── RECHERCHER DES PRESTATAIRES ──────────────────────────────────────────────
export async function rechercherPrestataires(
  type: PrestatairType,
  ville: string,
  pays: string = "France"
): Promise<Prestataire[]> {
  const prompt = `Identifie les meilleurs prestataires de type "${type}" à ${ville}, ${pays} pour Maison Baymora.

Critères : qualité premium, réputation établie, potentiel d'affiliation.

Réponds en JSON array (5-10 prestataires) :
[{
  "nom": "...",
  "type": "${type}",
  "ville": "${ville}",
  "pays": "${pays}",
  "description": "...",
  "siteWeb": "https://...",
  "commission": 15,
  "statut": "prospect",
  "notes": "..."
}]`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: ATLAS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "[]";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return [];
}

// ─── GÉNÉRER STRATÉGIE D'AFFILIATION ─────────────────────────────────────────
export async function genererStrategieAffiliation(
  budget: number,
  priorites: string[]
): Promise<{
  programmesRecommandes: AffiliationProgramme[];
  planAction: string[];
  revenusEstimes: string;
  delai: string;
}> {
  const programmesDisponibles = PROGRAMMES_AFFILIATION.filter(p => p.disponible);

  return {
    programmesRecommandes: programmesDisponibles.slice(0, 5),
    planAction: [
      "1. S'inscrire à Booking.com Affiliate (gratuit, immédiat)",
      "2. S'inscrire à Airbnb Associates (gratuit, immédiat)",
      "3. S'inscrire à GetYourGuide Affiliate (gratuit, 48h validation)",
      "4. Intégrer les liens dans les fiches SEO et bundles",
      "5. Créer une page /partenaires sur le site",
      "6. Contacter 10 prestataires locaux par semaine",
    ],
    revenusEstimes: "500-2000€/mois à 6 mois avec 50+ fiches actives",
    delai: "Premiers revenus dans 30-60 jours",
  };
}

// ─── ANALYSER UN PARTENAIRE POTENTIEL ────────────────────────────────────────
export async function analyserPartenaire(
  nom: string,
  type: string,
  siteWeb: string
): Promise<{
  score: number;
  forces: string[];
  faiblesses: string[];
  recommandation: string;
  commissionSuggeree: number;
}> {
  const prompt = `Analyse ce partenaire potentiel pour Maison Baymora :
Nom : ${nom}
Type : ${type}
Site : ${siteWeb}

Réponds en JSON :
{
  "score": 85,
  "forces": ["force1", "force2"],
  "faiblesses": ["faiblesse1"],
  "recommandation": "...",
  "commissionSuggeree": 15
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 800,
    system: ATLAS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    score: 70,
    forces: ["Réputation établie"],
    faiblesses: ["Informations insuffisantes"],
    recommandation: "À approfondir",
    commissionSuggeree: 15,
  };
}
