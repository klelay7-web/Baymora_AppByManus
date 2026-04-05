/**
 * Script de lancement de la campagne SEO MANUS+LÉNA
 * Lance l'enrichissement des 5 premiers établissements en base
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Charger les variables d'environnement
const dotenv = require("dotenv");
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const mysql = require("mysql2/promise");

// ─── Recherche Perplexity ─────────────────────────────────────────────────────
async function searchPerplexity(query) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) { console.warn("  ⚠️  PERPLEXITY_API_KEY manquante"); return ""; }
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Tu es un assistant de recherche pour une agence de conciergerie de luxe. Réponds en français avec des informations précises." },
          { role: "user", content: query },
        ],
        max_tokens: 1200,
        temperature: 0.2,
      }),
    });
    if (!response.ok) { console.error("  Perplexity error:", response.status); return ""; }
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("  Perplexity fetch error:", err.message);
    return "";
  }
}

// ─── Génération fiche SEO via LLM ────────────────────────────────────────────
async function generateSeoFiche(estab, generalInfo, reviews, viralVideos) {
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!apiUrl || !apiKey) throw new Error("BUILT_IN_FORGE_API_URL ou BUILT_IN_FORGE_API_KEY manquant");

  const prompt = `Tu es LÉNA, experte SEO pour Maison Baymora (conciergerie de luxe).

Génère une fiche SEO complète et premium pour :
**${estab.name}** — ${estab.category} à ${estab.city}
Adresse : ${estab.address || estab.city}

## Données terrain MANUS :

### Informations générales :
${generalInfo || "Utilise ta connaissance de cet établissement"}

### Avis et highlights :
${reviews || "Utilise ta connaissance de cet établissement"}

### Vidéos virales :
${viralVideos || "Recherche les vidéos virales connues de cet établissement"}

## Consignes :
- Ton Baymora : luxe accessible, chaleureux, authentique
- SEO optimisé pour "meilleur ${estab.category} ${estab.city}"
- 5 highlights uniques et précis
- metaTitle max 60 chars, metaDescription max 160 chars

Réponds UNIQUEMENT avec du JSON valide :
{
  "slug": "${estab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${estab.city.toLowerCase()}",
  "title": "Nom officiel",
  "subtitle": "Tagline premium max 80 chars",
  "category": "${estab.category}",
  "city": "${estab.city}",
  "country": "France",
  "region": "Région/arrondissement",
  "description": "Description 150-200 mots ton Baymora",
  "highlights": ["Point fort 1", "Point fort 2", "Point fort 3", "Point fort 4", "Point fort 5"],
  "practicalInfo": {
    "phone": "+33...",
    "website": "https://...",
    "hours": "Horaires détaillés",
    "priceRange": "€€€",
    "address": "${estab.address || estab.city}",
    "reservationRequired": "Oui / Recommandé",
    "dresscode": "Smart casual"
  },
  "metaTitle": "max 60 chars",
  "metaDescription": "max 160 chars",
  "rating": 4.7,
  "priceLevel": 4,
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "viralVideos": [
    {"platform": "TikTok", "url": "", "description": "Description vidéo virale connue"},
    {"platform": "Instagram", "url": "", "description": "Description reel viral connu"}
  ]
}`;

  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      messages: [
        { role: "system", content: "Tu es LÉNA, experte SEO de Maison Baymora. Tu génères uniquement du JSON valide, sans markdown ni explication." },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM n'a pas retourné de contenu");

  // Extraire le JSON
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Impossible de trouver le JSON dans la réponse");
  return JSON.parse(match[0]);
}

// ─── Enrichir un établissement ────────────────────────────────────────────────
async function enrichEstablishment(estab) {
  console.log(`\n  📍 ${estab.name} (${estab.city})`);

  console.log("  🔍 Recherche infos générales...");
  const generalInfo = await searchPerplexity(
    `Informations complètes sur "${estab.name}" à ${estab.city} : téléphone, site web, horaires, prix, ambiance, spécialités, anecdotes`
  );

  console.log("  ⭐ Analyse des avis...");
  const reviews = await searchPerplexity(
    `Meilleurs avis et points forts de "${estab.name}" à ${estab.city} selon TripAdvisor et Google : highlights, ce que les clients adorent, expériences signature`
  );

  console.log("  🎬 Recherche vidéos virales...");
  const viralVideos = await searchPerplexity(
    `Vidéos TikTok, Instagram Reels et YouTube les plus virales sur "${estab.name}" à ${estab.city} : créateurs, vues, hashtags populaires`
  );

  console.log("  ✍️  LÉNA génère la fiche SEO...");
  const fiche = await generateSeoFiche(estab, generalInfo, reviews, viralVideos);
  console.log(`  ✅ Fiche générée : "${fiche.title}"`);
  return fiche;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Campagne SEO MANUS+LÉNA — Démarrage\n");

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Récupérer les 5 premiers établissements
  const [establishments] = await conn.execute(
    "SELECT id, name, city, category, address FROM establishments ORDER BY id ASC LIMIT 5"
  );

  console.log(`📋 ${establishments.length} établissements sélectionnés :`);
  establishments.forEach((e, i) => console.log(`  ${i + 1}. ${e.name} (${e.city})`));

  const results = [];

  for (const estab of establishments) {
    const start = Date.now();
    try {
      const fiche = await enrichEstablishment(estab);

      // Générer un slug unique
      const baseSlug = fiche.slug || `${estab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${estab.city.toLowerCase()}`;
      const slug = `${baseSlug}-${Date.now()}`.slice(0, 100);

      // Sauvegarder en base
      const [result] = await conn.execute(
        `INSERT INTO seoCards (
          slug, title, subtitle, category, city, country, region,
          description, highlights, practicalInfo, metaTitle, metaDescription,
          imageUrl, galleryUrls, rating, priceLevel, tags,
          status, generatedBy, isVerified, lenaCreated, sourceType,
          schemaOrg, affiliateLinks, viewCount, publishedAt,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          slug,
          fiche.title || estab.name,
          fiche.subtitle || null,
          fiche.category || estab.category,
          fiche.city || estab.city,
          fiche.country || "France",
          fiche.region || null,
          fiche.description || "",
          JSON.stringify(fiche.highlights || []),
          JSON.stringify(fiche.practicalInfo || {}),
          fiche.metaTitle || fiche.title || estab.name,
          fiche.metaDescription || "",
          null, // imageUrl — sera enrichi plus tard
          JSON.stringify([]),
          fiche.rating ? parseFloat(String(fiche.rating)) : null,
          (() => { const p = fiche.priceLevel; if (!p) return 'luxury'; if (typeof p === 'string' && ['budget','moderate','upscale','luxury'].includes(p)) return p; const n = parseInt(String(p)); if (n <= 1) return 'budget'; if (n === 2) return 'moderate'; if (n === 3) return 'upscale'; return 'luxury'; })(),
          JSON.stringify(fiche.tags || []),
          "draft",
          "lena",
          false,
          true,
          "ai_auto",
          fiche.viralVideos ? JSON.stringify(fiche.viralVideos) : null,
          null,
          0,
          null,
        ]
      );

      const ficheId = result.insertId;
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  💾 Sauvegardé en base (ID: ${ficheId}) — ${duration}s`);
      results.push({ name: estab.name, status: "success", ficheId, title: fiche.title, duration });
    } catch (err) {
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      console.error(`  ❌ Erreur pour "${estab.name}": ${err.message} — ${duration}s`);
      results.push({ name: estab.name, status: "error", error: err.message, duration });
    }
  }

  await conn.end();

  // Résumé
  console.log("\n" + "═".repeat(60));
  console.log("📊 RÉSUMÉ DE LA CAMPAGNE");
  console.log("═".repeat(60));
  const success = results.filter(r => r.status === "success");
  const errors = results.filter(r => r.status === "error");
  console.log(`✅ Succès : ${success.length}/${results.length}`);
  if (errors.length > 0) console.log(`❌ Erreurs : ${errors.length}`);
  console.log("\nFiches créées :");
  success.forEach(r => console.log(`  • [ID:${r.ficheId}] ${r.title} (${r.duration}s)`));
  if (errors.length > 0) {
    console.log("\nErreurs :");
    errors.forEach(r => console.log(`  • ${r.name}: ${r.error}`));
  }
  console.log("\n✨ Campagne terminée ! Rendez-vous dans LÉNA Workspace → Fiches SEO pour vérifier et publier.");
}

main().catch(err => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
