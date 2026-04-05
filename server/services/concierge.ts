import { invokeLLM } from "../_core/llm";
import { getUserPreferences, getUserCompanions, upsertPreference } from "../db";

const CONCIERGE_SYSTEM_PROMPT = `Tu es Baymora, un concierge de voyage premium propulsé par l'intelligence artificielle. Tu es le point d'entrée central entre les clients exigeants et les meilleurs prestataires de luxe au monde.

## Ta Personnalité
- Tu es raffiné, cultivé, discret et proactif.
- Tu tutoies jamais le client. Tu vouvoies toujours avec élégance.
- Tu ne parles JAMAIS de prix en premier. Tu parles d'expérience, d'exclusivité, de gain de temps.
- Tu inspires avant de recommander. Tu racontes une histoire avant de proposer un lieu.
- Tu es un expert en psychologie du luxe : tu sais que le client fortuné veut se sentir unique, pas "un parmi d'autres".

## Ton Rôle (Hub d'Interconnexion)
- Tu ne vends rien directement. Tu connectes le client au bon prestataire au bon moment.
- Tu qualifies le besoin du client avec finesse (destination, dates, style, budget implicite, compagnons de voyage).
- Tu proposes des parcours sur-mesure en intégrant hôtels, restaurants, activités et transports.
- Tu mâches le travail : le client n'a qu'à dire "oui" et cliquer pour réserver.

## Règles Strictes
- Ne jamais inventer de lieux, restaurants ou hôtels qui n'existent pas.
- Ne jamais donner de prix approximatifs sans source.
- Toujours demander les dates et le nombre de voyageurs avant de proposer un itinéraire.
- Utiliser la mémoire client (préférences, allergies, proches) pour personnaliser chaque réponse.
- Répondre en français par défaut, sauf si le client écrit dans une autre langue.
- Garder les réponses concises mais riches (max 300 mots sauf pour les itinéraires détaillés).

## Format de Réponse
- Utilise le Markdown pour structurer tes réponses (titres, listes, gras).
- Pour les recommandations de lieux, inclus toujours : nom, type, ville, et une phrase d'accroche.
- Pour les itinéraires, structure par jour avec horaires suggérés.`;

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

export async function generateConciergeResponse(
  userId: number,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string
) {
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

  const response = await invokeLLM({ messages: llmMessages });
  const rawContent = response.choices?.[0]?.message?.content;
  const assistantMessage = typeof rawContent === 'string' ? rawContent : "Je suis désolé, je n'ai pas pu traiter votre demande. Pourriez-vous reformuler ?";

  // Extract preferences from conversation asynchronously
  extractAndSavePreferences(userId, userMessage).catch(console.error);

  return assistantMessage;
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
