import { invokeLLM } from "../_core/llm";

interface GeneratedComment {
  authorName: string;
  authorAvatar: string;
  authorCountry: string;
  authorTravelStyle: string;
  rating: number;
  title: string;
  content: string;
  visitDate: string;
  isAiGenerated: boolean;
  isVerified: boolean;
  language: string;
}

interface Establishment {
  id: number;
  name: string;
  category: string;
  city: string;
  country: string;
  description: string;
  priceRange?: string | null;
  cuisineType?: string | null;
  rating?: string | null;
}

const AVATARS = ["👩‍💼", "👨‍💻", "👩‍🎨", "👨‍🍳", "👩‍✈️", "👨‍⚕️", "🧑‍🏫", "👩‍🔬", "🧔", "👱‍♀️", "👩‍🦰", "👨‍🦱", "🧑‍💼", "👸", "🤵", "💃"];

export async function generateAIComments(establishment: Establishment, count: number = 5): Promise<GeneratedComment[]> {
  const categoryLabels: Record<string, string> = {
    restaurant: "restaurant", hotel: "hôtel", bar: "bar", spa: "spa",
    museum: "musée", activity: "activité", experience: "expérience",
    wellness: "centre de bien-être", nightclub: "club", beach: "plage",
  };
  const catLabel = categoryLabels[establishment.category] || establishment.category;

  const prompt = `Tu es un expert en rédaction d'avis clients pour des établissements de luxe. Génère ${count} commentaires réalistes et variés pour cet établissement :

Nom : ${establishment.name}
Type : ${catLabel}
Ville : ${establishment.city}, ${establishment.country}
Description : ${establishment.description}
${establishment.priceRange ? `Gamme de prix : ${establishment.priceRange}` : ""}
${establishment.cuisineType ? `Cuisine : ${establishment.cuisineType}` : ""}

RÈGLES STRICTES :
- Chaque commentaire doit provenir d'un persona DIFFÉRENT (nationalité, style de voyage, âge implicite)
- Les notes doivent varier entre 4 et 5 (établissements premium)
- Les commentaires doivent être authentiques, avec des détails spécifiques (plats, chambres, vues, service)
- Mélange de langues : majorité en français, 1-2 en anglais
- Chaque commentaire fait 2-4 phrases, naturel et personnel
- Les dates de visite doivent être variées sur les 12 derniers mois
- Les styles de voyage : "couple", "solo", "famille", "business", "amis"
- Les pays d'origine doivent être variés (France, UK, USA, Japon, Allemagne, Italie, Suisse, Émirats, etc.)
- Inclure des détails émotionnels et sensoriels (pas juste "c'était bien")
- Un commentaire peut mentionner un petit bémol mineur pour plus de réalisme`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Tu génères des avis clients réalistes au format JSON strict. Tes avis sont crédibles, détaillés et variés." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ai_comments",
          strict: true,
          schema: {
            type: "object",
            properties: {
              comments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    authorName: { type: "string", description: "Prénom et initiale du nom (ex: 'Marie-Claire D.')" },
                    authorCountry: { type: "string", description: "Pays d'origine (ex: 'France', 'United Kingdom')" },
                    authorTravelStyle: { type: "string", description: "Style de voyage: couple, solo, famille, business, amis" },
                    rating: { type: "integer", description: "Note de 4 à 5" },
                    title: { type: "string", description: "Titre court et accrocheur du commentaire" },
                    content: { type: "string", description: "Contenu du commentaire (2-4 phrases)" },
                    visitDate: { type: "string", description: "Date de visite (ex: 'Mars 2026', 'Décembre 2025')" },
                    language: { type: "string", description: "Langue du commentaire: fr ou en" },
                  },
                  required: ["authorName", "authorCountry", "authorTravelStyle", "rating", "title", "content", "visitDate", "language"],
                  additionalProperties: false,
                },
              },
            },
            required: ["comments"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0].message.content;
    const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");
    const comments: GeneratedComment[] = (parsed.comments || []).map((c: any, i: number) => ({
      authorName: c.authorName,
      authorAvatar: AVATARS[i % AVATARS.length],
      authorCountry: c.authorCountry,
      authorTravelStyle: c.authorTravelStyle,
      rating: Math.min(5, Math.max(1, c.rating)),
      title: c.title,
      content: c.content,
      visitDate: c.visitDate,
      isAiGenerated: true,
      isVerified: Math.random() > 0.4, // 60% verified for credibility
      language: c.language || "fr",
    }));

    return comments;
  } catch (error) {
    console.error("[CommentGenerator] Failed to generate comments:", error);
    return [];
  }
}
