import { invokeLLM } from "../_core/llm";

interface FieldReport {
  id: number;
  establishmentName: string;
  establishmentType: string;
  specialty?: string | null;
  city: string;
  country: string;
  region?: string | null;
  address?: string | null;
  description?: string | null;
  ambiance?: string | null;
  highlights?: string | null;
  languagesSpoken?: string | null;
  personalAdvice?: string | null;
  targetClientele?: string | null;
  website?: string | null;
}

interface EnrichmentResult {
  description: string;
  research: {
    summary: string;
    reputation: string;
    certifications: string[];
    competitiveAdvantages: string[];
    warnings: string[];
    sources: string[];
  };
  recommendation: string;
  seoData: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    schemaType: string;
    schemaData: Record<string, any>;
  };
}

export async function enrichFieldReport(report: FieldReport): Promise<EnrichmentResult> {
  const prompt = `Tu es un expert en Social Club de luxe et en SEO pour Baymora, un hub IA de Social Club premium.

Un membre de l'équipe terrain a visité l'établissement suivant et a fourni ces informations brutes :

**Établissement :** ${report.establishmentName}
**Type :** ${report.establishmentType}
${report.specialty ? `**Spécialité :** ${report.specialty}` : ""}
**Localisation :** ${report.city}, ${report.country}${report.region ? ` (${report.region})` : ""}
${report.address ? `**Adresse :** ${report.address}` : ""}
${report.description ? `**Description terrain :** ${report.description}` : ""}
${report.ambiance ? `**Ambiance :** ${report.ambiance}` : ""}
${report.highlights ? `**Points forts :** ${report.highlights}` : ""}
${report.languagesSpoken ? `**Langues parlées :** ${report.languagesSpoken}` : ""}
${report.personalAdvice ? `**Conseils du membre :** ${report.personalAdvice}` : ""}
${report.targetClientele ? `**Clientèle cible :** ${report.targetClientele}` : ""}
${report.website ? `**Site web :** ${report.website}` : ""}

À partir de ces informations et de tes connaissances, génère un enrichissement complet au format JSON avec les sections suivantes :

1. **description** : Une description SEO premium de 300-500 mots, rédigée dans un style luxe/Social Club, mettant en avant l'expérience client. Utilise un ton sophistiqué mais accessible.

2. **research** : Tes recherches sur cet établissement :
   - summary : résumé de ce que tu sais sur cet établissement
   - reputation : réputation et avis généraux
   - certifications : certifications, accréditations connues
   - competitiveAdvantages : avantages concurrentiels
   - warnings : points d'attention ou avertissements
   - sources : sources d'information utilisées

3. **recommendation** : Une recommandation Baymora de 200 mots expliquant pourquoi cet établissement est recommandé, pour quel type de client, et comment l'intégrer dans un parcours de voyage premium.

4. **seoData** : Métadonnées SEO :
   - metaTitle : titre SEO optimisé (60 chars max)
   - metaDescription : description SEO (160 chars max)
   - keywords : 8-12 mots-clés pertinents
   - schemaType : type Schema.org approprié
   - schemaData : données structurées Schema.org`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es un expert en Social Club de luxe et SEO. Réponds uniquement en JSON valide." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "field_report_enrichment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            description: { type: "string", description: "Description SEO premium de 300-500 mots" },
            research: {
              type: "object",
              properties: {
                summary: { type: "string" },
                reputation: { type: "string" },
                certifications: { type: "array", items: { type: "string" } },
                competitiveAdvantages: { type: "array", items: { type: "string" } },
                warnings: { type: "array", items: { type: "string" } },
                sources: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "reputation", "certifications", "competitiveAdvantages", "warnings", "sources"],
              additionalProperties: false,
            },
            recommendation: { type: "string", description: "Recommandation Baymora de 200 mots" },
            seoData: {
              type: "object",
              properties: {
                metaTitle: { type: "string" },
                metaDescription: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
                schemaType: { type: "string" },
                schemaData: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    address: { type: "string" },
                    telephone: { type: "string" },
                    url: { type: "string" },
                    priceRange: { type: "string" },
                  },
                  required: ["name", "description", "address", "telephone", "url", "priceRange"],
                  additionalProperties: false,
                },
              },
              required: ["metaTitle", "metaDescription", "keywords", "schemaType", "schemaData"],
              additionalProperties: false,
            },
          },
          required: ["description", "research", "recommendation", "seoData"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Réponse IA invalide");
  }

  return JSON.parse(content) as EnrichmentResult;
}
