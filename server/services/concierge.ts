import { invokeLLM } from "../_core/llm";
import { getUserPreferences, getUserCompanions, upsertPreference } from "../db";

const CONCIERGE_SYSTEM_PROMPT = `Tu es Baymora, un accès privé premium propulsé par l'intelligence artificielle. Tu es le point d'entrée central entre les membres et les meilleurs prestataires de luxe au monde.

## Ta Personnalité
- Tu es raffiné, cultivé, discret et proactif.
- Tu vouvoies toujours avec élégance.
- Tu ne parles JAMAIS de prix en premier. Tu parles d'expérience, d'exclusivité, de gain de temps.
- Tu inspires avant de recommander. Tu racontes une micro-histoire avant de proposer.
- Tu es un expert en psychologie du luxe : le client doit se sentir unique.

## RÈGLE FONDAMENTALE : INTERACTION CLIQUABLE
- Tu dois TOUJOURS proposer des réponses cliquables au client.
- Le client doit écrire le MINIMUM possible. Il clique, il choisit, il valide.
- Chaque message DOIT contenir des options de réponse sous forme de boutons.
- Tu poses UNE question à la fois, jamais plus.
- Si tes propositions ne conviennent pas, inclus toujours une option "Autre" pour que le client écrive.
- Tu prends l'INITIATIVE. Tu proposes AVANT que le client ne pense à demander.

## Ton Rôle (Hub d'Interconnexion)
- Tu ne vends rien directement. Tu connectes le client au bon prestataire au bon moment.
- Tu qualifies le besoin avec finesse via des questions cliquables (destination, dates, style, compagnons).
- Tu proposes des parcours sur-mesure en intégrant hôtels, restaurants, activités et transports.
- Tu mâches le travail : le client n'a qu'à cliquer pour valider.

## Règles Strictes
- Ne jamais inventer de lieux, restaurants ou hôtels qui n'existent pas.
- Toujours demander les dates et le nombre de voyageurs avant de proposer un itinéraire.
- Utiliser la mémoire client pour personnaliser.
- Répondre en français par défaut.
- Garder les réponses COURTES (max 150 mots). Trop de texte tue l'échange.
- Chaque établissement mentionné doit inclure : nom, type, ville.

## FORMAT DE RÉPONSE OBLIGATOIRE (JSON)
Tu DOIS répondre en JSON valide avec cette structure exacte :
{
  "message": "Ton message court et engageant en Markdown",
  "quickReplies": ["Option 1", "Option 2", "Option 3", "✏️ Autre"],
  "establishments": [
    {
      "name": "Nom de l'établissement",
      "type": "restaurant|hotel|activity|transport|bar|spa",
      "city": "Ville",
      "country": "Pays",
      "description": "Une phrase d'accroche sexy",
      "priceRange": "€€€|€€€€|€€€€€",
      "coordinates": { "lat": 0.0, "lng": 0.0 }
    }
  ],
  "tripSuggestion": null,
  "action": null
}

### Champs spéciaux :
- "quickReplies" : TOUJOURS présent, 2-5 options cliquables + "✏️ Autre" en dernier
- "establishments" : liste des lieux mentionnés (vide si aucun)
- "tripSuggestion" : quand tu proposes un parcours complet, structure :
  {
    "title": "Titre du parcours",
    "duration": "3 jours",
    "style": "Romantique|Aventure|Culture|Gastronomie|Bien-être|Business|Famille",
    "days": [
      {
        "day": 1,
        "title": "Titre du jour",
        "steps": [
          {
            "time": "09:00",
            "establishment": "Nom",
            "type": "hotel|restaurant|activity|transport",
            "description": "Description courte",
            "city": "Ville",
            "coordinates": { "lat": 0.0, "lng": 0.0 }
          }
        ]
      }
    ]
  }
- "action" : action spéciale ("generate_3_trips" quand le client a donné assez d'infos pour générer 3 parcours différents)

## FLOW DE CONVERSATION TYPE
1. Accueil proactif → proposer type d'expérience (Voyage, Restaurant, Événement, Business)
2. Si Voyage → Où ? (proposer continents/destinations tendance)
3. Quand ? (proposer des périodes)
4. Avec qui ? (Seul, En couple, En famille, Entre amis, Business)
5. Quel style ? (Romantique, Aventure, Culture, Gastronomie, Détente)
6. Générer 3 parcours différents (Confort, Premium, Élite)
7. Le client sélectionne, modifie, valide`;

function buildMemoryContext(preferences: any[], companions: any[]): string {
  if (preferences.length === 0 && companions.length === 0) return "";

  let context = "\n\n## Mémoire Client (informations connues)\n";

  if (preferences.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const pref of preferences) {
      if (!grouped[pref.category]) grouped[pref.category] = [];
      grouped[pref.category].push(`${pref.key}: ${pref.value}`);
    }
    for (const [category, items] of Object.entries(grouped)) {
      context += `\n### ${category}\n`;
      for (const item of items) context += `- ${item}\n`;
    }
  }

  if (companions.length > 0) {
    context += "\n### Compagnons de voyage\n";
    for (const c of companions) {
      context += `- ${c.name}`;
      if (c.relationship) context += ` (${c.relationship})`;
      if (c.dietaryRestrictions) context += ` — Restrictions: ${c.dietaryRestrictions}`;
      context += "\n";
    }
  }

  return context;
}

export interface ConciergeResponse {
  message: string;
  quickReplies: string[];
  establishments: Array<{
    name: string;
    type: string;
    city: string;
    country?: string;
    description: string;
    priceRange?: string;
    coordinates?: { lat: number; lng: number };
  }>;
  tripSuggestion: {
    title: string;
    duration: string;
    style: string;
    days: Array<{
      day: number;
      title: string;
      steps: Array<{
        time: string;
        establishment: string;
        type: string;
        description: string;
        city: string;
        coordinates?: { lat: number; lng: number };
      }>;
    }>;
  } | null;
  action: string | null;
}

const WELCOME_RESPONSE: ConciergeResponse = {
  message: "Bienvenue chez **Maison Baymora** ✨\n\nJe suis Maya, votre accès privé à la Maison. Avant même que vous ne le demandiez, j'ai déjà quelques idées pour vous.\n\n**Que souhaitez-vous vivre ?**",
  quickReplies: [
    "🌍 Planifier un voyage",
    "🍽️ Trouver un restaurant d'exception",
    "🎭 Organiser un événement",
    "💼 Voyage d'affaires",
    "🎁 Offrir une expérience",
    "✏️ Autre"
  ],
  establishments: [],
  tripSuggestion: null,
  action: null,
};

export function getWelcomeResponse(): ConciergeResponse {
  return WELCOME_RESPONSE;
}

export async function generateConciergeResponse(
  userId: number,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string
): Promise<ConciergeResponse> {
  const [preferences, companions] = await Promise.all([
    getUserPreferences(userId),
    getUserCompanions(userId),
  ]);

  const memoryContext = buildMemoryContext(preferences, companions);
  const systemPrompt = CONCIERGE_SYSTEM_PROMPT + memoryContext;

  const llmMessages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory.slice(-20).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await invokeLLM({
    messages: llmMessages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "maya_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            message: { type: "string", description: "Message court et engageant en Markdown" },
            quickReplies: {
              type: "array",
              items: { type: "string" },
              description: "2-5 options de réponse cliquables"
            },
            establishments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  city: { type: "string" },
                  country: { type: "string" },
                  description: { type: "string" },
                  priceRange: { type: "string" },
                  coordinates: {
                    type: "object",
                    properties: {
                      lat: { type: "number" },
                      lng: { type: "number" }
                    },
                    required: ["lat", "lng"],
                    additionalProperties: false,
                  }
                },
                required: ["name", "type", "city", "country", "description", "priceRange", "coordinates"],
                additionalProperties: false,
              }
            },
            tripSuggestion: {
              type: ["object", "null"],
              properties: {
                title: { type: "string" },
                duration: { type: "string" },
                style: { type: "string" },
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "integer" },
                      title: { type: "string" },
                      steps: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            time: { type: "string" },
                            establishment: { type: "string" },
                            type: { type: "string" },
                            description: { type: "string" },
                            city: { type: "string" },
                            coordinates: {
                              type: "object",
                              properties: {
                                lat: { type: "number" },
                                lng: { type: "number" }
                              },
                              required: ["lat", "lng"],
                              additionalProperties: false,
                            }
                          },
                          required: ["time", "establishment", "type", "description", "city", "coordinates"],
                          additionalProperties: false,
                        }
                      }
                    },
                    required: ["day", "title", "steps"],
                    additionalProperties: false,
                  }
                }
              },
              required: ["title", "duration", "style", "days"],
              additionalProperties: false,
            },
            action: { type: ["string", "null"] }
          },
          required: ["message", "quickReplies", "establishments", "tripSuggestion", "action"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices?.[0]?.message?.content;

  try {
    if (typeof rawContent === "string") {
      const parsed = JSON.parse(rawContent) as ConciergeResponse;
      // Ensure quickReplies always has "Autre" option
      if (!parsed.quickReplies.some(r => r.includes("Autre"))) {
        parsed.quickReplies.push("✏️ Autre");
      }
      // Extract preferences asynchronously
      extractAndSavePreferences(userId, userMessage).catch(console.error);
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse Maya JSON response:", e);
  }

  // Fallback to plain text response
  return {
    message: typeof rawContent === "string" ? rawContent : "Je suis désolé, pourriez-vous reformuler ?",
    quickReplies: ["🔄 Recommencer", "✏️ Autre"],
    establishments: [],
    tripSuggestion: null,
    action: null,
  };
}

async function extractAndSavePreferences(userId: number, userMessage: string) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Tu es un extracteur de préférences. Analyse le message utilisateur et extrais les préférences de voyage implicites ou explicites. Réponds UNIQUEMENT en JSON valide avec le format: { "preferences": [{ "category": "...", "key": "...", "value": "..." }] }. Catégories possibles: dietary (alimentaire), travel_style (style de voyage), budget (budget), accommodation (hébergement), activities (activités), destinations (destinations préférées). Si aucune préférence n'est détectable, réponds: { "preferences": [] }`
        },
        { role: "user", content: userMessage }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "preferences_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              preferences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    key: { type: "string" },
                    value: { type: "string" },
                  },
                  required: ["category", "key", "value"],
                  additionalProperties: false,
                },
              },
            },
            required: ["preferences"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return;
    const parsed = JSON.parse(content);
    if (parsed.preferences && Array.isArray(parsed.preferences)) {
      for (const pref of parsed.preferences) {
        await upsertPreference(userId, pref.category, pref.key, pref.value, "inferred");
      }
    }
  } catch (e) {
    // Silently fail — preference extraction is non-critical
  }
}
