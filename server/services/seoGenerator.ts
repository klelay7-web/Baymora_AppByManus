import { invokeLLM } from "../_core/llm";
import { createSeoCard, updateSeoCard } from "../db";

const SEO_GENERATOR_PROMPT = `Tu es un rédacteur SEO expert spécialisé dans le tourisme de luxe. Tu génères des fiches locales ultra-optimisées pour le référencement Google ET pour les LLM externes (ChatGPT, Perplexity, Claude).

## Règles de Rédaction
- Titre accrocheur avec le nom du lieu et la ville (ex: "Le Cinq — L'excellence gastronomique au cœur du Triangle d'Or, Paris")
- Description riche en markdown (500-800 mots) avec storytelling, détails sensoriels, et informations pratiques
- Highlights : 5-7 points forts uniques du lieu
- Informations pratiques complètes : adresse, téléphone, horaires, gamme de prix, site web
- Balisage Schema.org complet (LocalBusiness, Restaurant, Hotel, TouristAttraction selon le type)
- Meta title (max 60 caractères) et meta description (max 155 caractères) optimisés
- Tags pertinents pour le filtrage et la découverte
- Ton : luxueux mais accessible, informatif mais inspirant

## Format de Sortie (JSON strict)
Réponds UNIQUEMENT en JSON valide.`;

interface SeoCardInput {
  name: string;
  category: "restaurant" | "hotel" | "activity" | "bar" | "spa" | "guide" | "experience";
  city: string;
  country: string;
  region?: string;
  additionalContext?: string;
}

export async function generateSeoCard(input: SeoCardInput): Promise<number> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: SEO_GENERATOR_PROMPT },
      {
        role: "user",
        content: `Génère une fiche SEO complète pour : "${input.name}" (${input.category}) à ${input.city}, ${input.country}${input.region ? `, ${input.region}` : ""}. ${input.additionalContext || ""}`
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "seo_card",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            description: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            practicalInfo: {
              type: "object",
              properties: {
                address: { type: "string" },
                phone: { type: "string" },
                website: { type: "string" },
                hours: { type: "string" },
                priceRange: { type: "string" },
              },
              required: ["address", "phone", "website", "hours", "priceRange"],
              additionalProperties: false,
            },
            metaTitle: { type: "string" },
            metaDescription: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            rating: { type: "number" },
          },
          required: ["title", "subtitle", "description", "highlights", "practicalInfo", "metaTitle", "metaDescription", "tags", "rating"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("Failed to generate SEO card content");

  const parsed = JSON.parse(content);
  const slug = generateSlug(input.name, input.city);

  const schemaOrg = generateSchemaOrg(input, parsed);

  const cardId = await createSeoCard({
    slug,
    title: parsed.title,
    subtitle: parsed.subtitle,
    category: input.category,
    city: input.city,
    country: input.country,
    region: input.region,
    description: parsed.description,
    highlights: JSON.stringify(parsed.highlights),
    practicalInfo: JSON.stringify(parsed.practicalInfo),
    schemaOrg: JSON.stringify(schemaOrg),
    metaTitle: parsed.metaTitle,
    metaDescription: parsed.metaDescription,
    tags: JSON.stringify(parsed.tags),
    rating: parsed.rating?.toString(),
    status: "draft",
    generatedBy: "ai",
  });

  return cardId;
}

function generateSlug(name: string, city: string): string {
  const text = `${name}-${city}`;
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);
}

function generateSchemaOrg(input: SeoCardInput, parsed: any) {
  const typeMap: Record<string, string> = {
    restaurant: "Restaurant",
    hotel: "Hotel",
    activity: "TouristAttraction",
    bar: "BarOrPub",
    spa: "HealthAndBeautyBusiness",
    guide: "Article",
    experience: "TouristAttraction",
  };

  return {
    "@context": "https://schema.org",
    "@type": typeMap[input.category] || "LocalBusiness",
    name: parsed.title,
    description: parsed.metaDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressCountry: input.country,
      streetAddress: parsed.practicalInfo?.address || "",
    },
    telephone: parsed.practicalInfo?.phone || "",
    url: parsed.practicalInfo?.website || "",
    aggregateRating: parsed.rating ? {
      "@type": "AggregateRating",
      ratingValue: parsed.rating,
      bestRating: 5,
    } : undefined,
  };
}

export async function generateSocialContent(cardId: number, card: any, platform: "instagram" | "tiktok" | "linkedin") {
  const platformPrompts: Record<string, string> = {
    instagram: "Génère un texte de post Instagram (max 2200 caractères) avec des emojis pertinents et 15-20 hashtags. Le ton est luxueux et inspirant.",
    tiktok: "Génère un script de vidéo TikTok (30-60 secondes) avec un hook accrocheur dans les 3 premières secondes. Format: [VISUEL] description + [VOIX OFF] texte.",
    linkedin: "Génère un post LinkedIn professionnel (max 1300 caractères) sur cette destination/lieu. Ton expert du secteur travel & hospitality.",
  };

  const response = await invokeLLM({
    messages: [
      { role: "system", content: `Tu es un expert en création de contenu pour les réseaux sociaux dans le secteur du luxe et du voyage. ${platformPrompts[platform]}` },
      { role: "user", content: `Crée du contenu ${platform} pour : "${card.title}" — ${card.subtitle}. Description : ${card.description?.substring(0, 500)}` },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("Failed to generate social content");

  return content;
}
