/**
 * ─── Maison Baymora — Profile Extractor (Auto-remplissage IA Silencieux) ─────
 * 
 * À chaque message du client, Claude analyse silencieusement le texte pour
 * détecter des informations personnelles et les fusionner dans le profil.
 * 
 * Exemples détectés :
 * - "Ma femme est végétarienne" → companion.dietRegime = "vegetarien"
 * - "On part avec nos 2 enfants" → profile.travelGroup = "famille"
 * - "J'ai un budget de 5000€" → profile.travelBudget = "premium"
 * - "Je suis allergique aux noix" → profile.dietAllergies += "noix"
 * - "J'habite à Lyon" → profile.homeCity = "Lyon"
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";
import { upsertClientProfile } from "./profileService";

const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

interface ExtractedProfileData {
  pseudo?: string;
  dietRegime?: string[];
  dietAllergies?: string[];
  dietOther?: string;
  travelStyles?: string[];
  travelBudget?: "economique" | "confort" | "premium" | "luxe" | "sans_limite";
  travelGroup?: "solo" | "couple" | "famille" | "amis" | "business";
  travelMobility?: "aucune" | "pmr" | "reduite" | "poussette";
  languages?: string[];
  pet?: "aucun" | "chien" | "chat" | "autre";
  smoking?: "non_fumeur" | "fumeur" | "cigare" | "vape";
  dresscode?: "casual" | "smart_casual" | "chic" | "formel";
  ecofriendly?: boolean;
  homeCity?: string;
  homeAddress?: string;
  preferredAirport?: string;
  airportLounge?: boolean;
  priorityLane?: boolean;
  clothingSize?: string;
  shoeSize?: string;
  favoriteAlcohol?: string;
  favoriteCuisine?: string;
  sleepPreference?: string;
  tempPreference?: string;
  freeNotes?: string;
}

const EXTRACTION_SYSTEM_PROMPT = `Tu es un extracteur de données JSON silencieux pour Maison Baymora.
Analyse le message utilisateur et extrait UNIQUEMENT les informations personnelles explicitement mentionnées.
Ne déduis rien, n'invente rien. Si rien n'est mentionné, retourne {}.

Retourne un JSON valide avec UNIQUEMENT les champs détectés parmi :
- pseudo: string (surnom/pseudo mentionné)
- dietRegime: string[] (régimes: "vegetarien","vegan","halal","casher","sans_gluten","sans_lactose","pescetarien","flexitarien")
- dietAllergies: string[] (allergies: "arachides","noix","fruits_de_mer","crustaces","gluten","lactose","oeufs","soja","sesame","sulfites")
- dietOther: string (autre restriction alimentaire)
- travelStyles: string[] (styles: "detente","aventure","culture","gastronomie","nightlife","nature","shopping","sport","romance","bien_etre")
- travelBudget: "economique"|"confort"|"premium"|"luxe"|"sans_limite"
- travelGroup: "solo"|"couple"|"famille"|"amis"|"business"
- travelMobility: "aucune"|"pmr"|"reduite"|"poussette"
- languages: string[] (langues parlées)
- pet: "aucun"|"chien"|"chat"|"autre"
- smoking: "non_fumeur"|"fumeur"|"cigare"|"vape"
- dresscode: "casual"|"smart_casual"|"chic"|"formel"
- ecofriendly: boolean
- homeCity: string
- homeAddress: string
- preferredAirport: string (code IATA: CDG, ORY...)
- airportLounge: boolean
- priorityLane: boolean
- clothingSize: string
- shoeSize: string
- favoriteAlcohol: string
- favoriteCuisine: string
- sleepPreference: string
- tempPreference: string
- freeNotes: string (infos utiles non catégorisées)

Exemples :
- "Je suis végétarien" → {"dietRegime": ["vegetarien"]}
- "On part en famille avec 2 enfants" → {"travelGroup": "famille"}
- "Budget 3000€ pour le séjour" → {"travelBudget": "confort"}
- "J'habite à Paris 16ème" → {"homeCity": "Paris"}
- "Je prends toujours CDG" → {"preferredAirport": "CDG"}
- "J'ai peur en avion" → {"freeNotes": "Peur en avion"}
- Message sans info personnelle → {}`;

export async function extractProfileFromMessage(
  userId: number,
  userMessage: string
): Promise<void> {
  // Ne pas extraire pour les messages très courts ou sans contexte personnel
  if (userMessage.length < 15) return;
  
  // Mots-clés qui suggèrent des infos personnelles
  const personalKeywords = [
    "je suis", "j'ai", "j'habite", "mon", "ma", "mes", "nous", "on part",
    "budget", "allergi", "végétar", "vegan", "halal", "casher", "gluten",
    "enfant", "famille", "couple", "solo", "ami", "collègue",
    "chien", "chat", "fumeur", "cigare", "taille", "pointure",
    "aéroport", "cdg", "ory", "lounge", "priority", "peur", "adore", "déteste",
    "préfère", "j'aime", "je n'aime pas", "langue", "parle", "résid",
  ];
  
  const lowerMsg = userMessage.toLowerCase();
  const hasPersonalInfo = personalKeywords.some(kw => lowerMsg.includes(kw));
  if (!hasPersonalInfo) return;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = response.content[0];
    if (content.type !== "text") return;

    const text = content.text.trim();
    if (text === "{}" || !text.startsWith("{")) return;

    const extracted: ExtractedProfileData = JSON.parse(text);
    if (Object.keys(extracted).length === 0) return;

    // Convertir les arrays en JSON strings pour la DB
    const dbData: Record<string, unknown> = {};
    
    if (extracted.dietRegime) dbData.dietRegime = JSON.stringify(extracted.dietRegime);
    if (extracted.dietAllergies) dbData.dietAllergies = JSON.stringify(extracted.dietAllergies);
    if (extracted.travelStyles) dbData.travelStyles = JSON.stringify(extracted.travelStyles);
    if (extracted.languages) dbData.languages = JSON.stringify(extracted.languages);
    
    // Champs scalaires directs
    const scalarFields = [
      "pseudo", "dietOther", "travelBudget", "travelGroup", "travelMobility",
      "pet", "smoking", "dresscode", "ecofriendly", "homeCity", "homeAddress",
      "preferredAirport", "airportLounge", "priorityLane", "clothingSize",
      "shoeSize", "favoriteAlcohol", "favoriteCuisine", "sleepPreference",
      "tempPreference", "freeNotes",
    ] as const;
    
    for (const field of scalarFields) {
      if (extracted[field] !== undefined) {
        dbData[field] = extracted[field];
      }
    }

    if (Object.keys(dbData).length > 0) {
      await upsertClientProfile(userId, {
        ...dbData,
        aiLastExtracted: new Date(),
      } as any);
      console.log(`[ProfileExtractor] Extracted ${Object.keys(dbData).length} fields for user ${userId}`);
    }
  } catch (err) {
    // Silencieux — ne jamais bloquer la conversation principale
    console.warn("[ProfileExtractor] Silent extraction failed:", err instanceof Error ? err.message : "unknown");
  }
}
