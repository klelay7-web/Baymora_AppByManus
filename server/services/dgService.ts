/**
 * ─── Maison Baymora — Manus DG : Directeur Général IA ──────────────────────────
 * Claude Opus exclusif pour le propriétaire (owner-only).
 * Manus DG dirige toutes les équipes, tient un carnet de bord daté,
 * génère des rapports, gère le budget et donne des ordres à Manus.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db";
import { pilotageMessages } from "../../drizzle/schema";
import { desc } from "drizzle-orm";
import { ENV } from "../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── ORGANIGRAMME BAYMORA ─────────────────────────────────────────────────────
export const ORGANIGRAMME = {
  dg: {
    name: "Manus DG",
    role: "Directeur Général IA",
    model: "Claude Opus",
    responsabilites: [
      "Supervision de toutes les équipes",
      "Carnet de bord daté quotidien",
      "Rapports hebdomadaires au fondateur",
      "Gestion du budget global",
      "Alertes et escalades",
      "Stratégie 30/60/90 jours",
    ],
  },
  equipes: [
    {
      id: "seo",
      nom: "Équipe SEO & Fiches",
      emoji: "🔍",
      effectif: 3,
      agents: [
        { nom: "SEO-1 (Rédacteur Fiches)", tache: "Rédaction fiches établissements (5/semaine)", duree: "2h/fiche" },
        { nom: "SEO-2 (Optimiseur)", tache: "Optimisation mots-clés, balises, descriptions", duree: "1h/fiche" },
        { nom: "SEO-3 (Vérificateur)", tache: "Contrôle qualité, publication, mise à jour", duree: "30min/fiche" },
      ],
      kpis: ["Fiches publiées/semaine", "Score SEO moyen", "Trafic organique"],
      tachesUrgentes: [
        "Rédiger 20 fiches Paris (8e, 16e, 1er)",
        "Rédiger 10 fiches Côte d'Azur",
        "Rédiger 10 fiches Bordeaux/Biarritz",
        "Optimiser les 30 fiches existantes",
      ],
    },
    {
      id: "content",
      nom: "Équipe Content & Social",
      emoji: "✍️",
      effectif: 4,
      agents: [
        { nom: "CONTENT-1 (Instagram)", tache: "Posts visuels + Reels quotidiens", duree: "1h/post" },
        { nom: "CONTENT-2 (TikTok)", tache: "Vidéos courtes destinations/expériences", duree: "2h/vidéo" },
        { nom: "CONTENT-3 (LinkedIn)", tache: "Articles B2B, partenariats, thought leadership", duree: "1.5h/article" },
        { nom: "CONTENT-4 (Newsletter)", tache: "Newsletter hebdo + bons plans", duree: "3h/newsletter" },
      ],
      kpis: ["Posts publiés/semaine", "Engagement rate", "Abonnés gagnés"],
      tachesUrgentes: [
        "Créer 30 posts Instagram (destinations top 10)",
        "Lancer série TikTok 'Secrets d'initiés'",
        "Rédiger 4 newsletters de lancement",
        "Créer le calendrier éditorial Q2 2026",
      ],
    },
    {
      id: "acquisition",
      nom: "Équipe Acquisition & Prospection",
      emoji: "📈",
      effectif: 3,
      agents: [
        { nom: "ACQ-1 (Partenariats)", tache: "Prospection hôtels, restaurants, expériences", duree: "4h/partenaire" },
        { nom: "ACQ-2 (Affiliations)", tache: "Staycation, Booking, Airbnb Luxe, affiliés", duree: "2h/affiliation" },
        { nom: "ACQ-3 (Prestataires)", tache: "Sourcing prestataires locaux (guides, chefs, chauffeurs)", duree: "3h/prestataire" },
      ],
      kpis: ["Partenaires signés/mois", "Commissions générées", "Taux conversion"],
      tachesUrgentes: [
        "Contacter 50 hôtels 4-5* (Paris, Côte d'Azur, Bordeaux)",
        "Négocier affiliation Staycation (objectif: 10% commission)",
        "Sourcer 20 prestataires expériences VIP",
        "Créer kit partenaire Baymora",
      ],
    },
    {
      id: "concierge",
      nom: "Équipe Conciergerie IA",
      emoji: "🤝",
      effectif: 2,
      agents: [
        { nom: "CONC-1 (Claude Opus)", tache: "Conversations clients premium, recommandations", duree: "Temps réel" },
        { nom: "CONC-2 (Perplexity)", tache: "Recherches temps réel, disponibilités, prix", duree: "Temps réel" },
      ],
      kpis: ["Satisfaction client", "Taux résolution", "Temps réponse moyen"],
      tachesUrgentes: [
        "Enrichir la base de connaissances destinations",
        "Créer les bundles (20 bundles prioritaires)",
        "Configurer les parcours GPS (10 villes)",
        "Tester tous les flux de réservation",
      ],
    },
    {
      id: "analytics",
      nom: "Équipe Analytics & Reporting",
      emoji: "📊",
      effectif: 2,
      agents: [
        { nom: "ANA-1 (Data)", tache: "Collecte métriques, tableaux de bord, KPIs", duree: "2h/jour" },
        { nom: "ANA-2 (Insights)", tache: "Analyse comportements, recommandations, A/B tests", duree: "3h/semaine" },
      ],
      kpis: ["DAU/MAU", "Taux rétention", "LTV client"],
      tachesUrgentes: [
        "Configurer tracking complet (GA4 + Mixpanel)",
        "Créer dashboard revenus temps réel",
        "Analyser funnel conversion inscription→premium",
        "Rapport hebdo automatique",
      ],
    },
    {
      id: "dev",
      nom: "Équipe Dev (Manus)",
      emoji: "💻",
      effectif: 1,
      agents: [
        { nom: "MANUS (Dev IA)", tache: "Développement, corrections, nouvelles fonctionnalités", duree: "Sur demande DG" },
      ],
      kpis: ["Features livrées/sprint", "Bugs résolus", "Uptime"],
      tachesUrgentes: [
        "Intégrer Stripe Checkout (abonnements)",
        "Fiches style Staycation avec photos + prix + dispo",
        "Marqueur domicile sur carte (point de départ parcours)",
        "Streaming Claude dans le chat",
        "Page Pilotage complète (en cours)",
        "Refonte Pricing (3 plans corrects)",
        "Système de notifications push",
        "API affiliations (Staycation, Booking)",
      ],
    },
    {
      id: "email",
      nom: "Équipe Email & CRM",
      emoji: "📧",
      effectif: 2,
      agents: [
        { nom: "EMAIL-1 (Transactionnel)", tache: "Emails auto : bienvenue, confirmation, relance", duree: "Automatique" },
        { nom: "EMAIL-2 (Marketing)", tache: "Newsletters, bons plans, campagnes prospection", duree: "2h/campagne" },
      ],
      kpis: ["Taux ouverture", "Taux clic", "Désabonnements"],
      tachesUrgentes: [
        "Activer séquence bienvenue (J0, J3, J7)",
        "Créer campagne lancement premium",
        "Prospection partenaires (50 emails/semaine)",
        "Newsletter mensuelle bons plans",
      ],
    },
  ],
};

// ─── STRATÉGIE 30/60/90 JOURS ────────────────────────────────────────────────
export const STRATEGIE = {
  phase1: {
    titre: "J1-30 : Fondations",
    objectif: "Lancer le produit avec une base solide",
    budget: 2000,
    taches: [
      "✅ Intégrer Claude Opus comme moteur IA",
      "🔄 Créer 50 fiches établissements (Paris + Côte d'Azur)",
      "🔄 Lancer 20 bundles (week-end, gastronomie, wellness)",
      "🔄 Configurer Stripe + abonnements",
      "🔄 Activer séquences email automatiques",
      "🔄 Sourcer 30 prestataires partenaires",
      "🔄 Lancer Instagram + TikTok (30 posts de lancement)",
      "🔄 Contacter 50 hôtels pour affiliation",
    ],
    kpi: "100 inscrits, 10 abonnés Premium",
  },
  phase2: {
    titre: "J31-60 : Croissance",
    objectif: "Acquérir les premiers clients payants",
    budget: 3500,
    taches: [
      "Atteindre 200 fiches établissements",
      "Lancer les parcours GPS (10 villes)",
      "Intégrer Staycation comme affilié principal",
      "Campagne acquisition payante (Meta Ads : 1000€)",
      "Programme ambassadeurs : recruter 10 créateurs",
      "Lancer la newsletter (500 abonnés cible)",
      "Partenariats B2B (entreprises, CE, agences voyage)",
      "Mode Fantôme + Accès Off-Market opérationnels",
    ],
    kpi: "500 inscrits, 50 abonnés Premium, 5 Privé",
  },
  phase3: {
    titre: "J61-90 : Accélération",
    objectif: "Atteindre la rentabilité",
    budget: 5000,
    taches: [
      "500+ fiches établissements",
      "App mobile (PWA optimisée)",
      "Conciergerie humaine opérationnelle",
      "Partenariats Staycation + Airbnb Luxe + Booking",
      "Campagne influence (5 créateurs lifestyle)",
      "Expansion : Londres, Barcelone, Dubaï",
      "Lever de fonds seed si KPIs atteints",
    ],
    kpi: "2000 inscrits, 200 Premium, 20 Privé → CA ~3500€/mois",
  },
};

// ─── BUDGET MENSUEL ───────────────────────────────────────────────────────────
export const BUDGET_MENSUEL = {
  revenus: {
    premium: { label: "Abonnements Premium (14.90€)", unite: "par abonné" },
    prive: { label: "Abonnements Privé (49.90€)", unite: "par abonné" },
    unlocks: { label: "Feature Unlocks", unite: "variable" },
    commissions: { label: "Commissions affiliations", unite: "~10% des réservations" },
  },
  depenses: {
    ia: { label: "API Claude (Anthropic)", estimeMensuel: 150, detail: "~50k tokens/jour" },
    perplexity: { label: "API Perplexity", estimeMensuel: 50, detail: "Recherches temps réel" },
    hosting: { label: "Hébergement Manus", estimeMensuel: 0, detail: "Inclus dans le plan" },
    email: { label: "Resend (emails)", estimeMensuel: 20, detail: "Jusqu'à 50k emails/mois" },
    stripe: { label: "Frais Stripe", estimeMensuel: 0, detail: "2.9% + 0.30€ par transaction" },
    ads: { label: "Publicité (Meta/Google)", estimeMensuel: 500, detail: "Phase 2 uniquement" },
    domaine: { label: "Domaine maisonbaymora.com", estimeMensuel: 2, detail: "~25€/an" },
  },
  totalDepensesFixesMensuel: 222,
  seuilRentabilite: {
    premium: 15, // 15 abonnés Premium = 223.50€ > dépenses fixes
    description: "15 abonnés Premium couvrent toutes les dépenses fixes",
  },
};

// ─── System Prompt Manus DG ────────────────────────────────────────────────────
const DG_SYSTEM_PROMPT = `Tu es **Manus DG** — Directeur Général IA de Maison Baymora.
Tu travailles exclusivement pour le fondateur. Tu es son bras droit stratégique et opérationnel.

## TON IDENTITÉ
- Nom : Manus DG (Artificial Reasoning & Intelligence Assistant)
- Rôle : Directeur Général IA, chef de toutes les équipes
- Modèle : Claude Opus (le plus puissant)
- Accès : Exclusif au fondateur uniquement

## TES ÉQUIPES (tu diriges 7 agents IA spécialisés)
1. 🔍 **LÉNA** (SEO & Terrain) : Assistante terrain, guide les membres de l'équipe (Amin et collègues) pour créer les fiches établissements. Binôme Claude Opus + SCOUT (Perplexity).
2. 🤝 **MAYA** (Concierge IA) : Gestion des conversations clients premium, recommandations personnalisées, orchestration FLASH/EXPLORE/EXCELLENCE.
3. 📧 **NOVA** (Email & CRM) : Emails automatiques (bienvenue, relance, newsletters), prospection partenaires, séquences Resend.
4. 🗺️ **ATLAS** (Routes & Parcours) : Génération d'itinéraires, parcours GPS, plans de voyage multi-étapes.
5. 🤝 **JADE** (Partenaires & Affiliations) : Sourcing prestataires, négociation commissions, gestion affiliations (Staycation, Booking).
6. 📸 **PIXEL** (Social Media) : Posts Instagram/TikTok/LinkedIn, calendrier éditorial, contenu viral.
7. 📊 **Manus DG** (Analytics & Coordination) : Toi-même. Tableaux de bord, KPIs, rapports, coordination inter-équipes.

## ÉQUIPE TERRAIN (membres humains)
- **Amin** et ses collègues : membres terrain avec accès à LÉNA. Ils visitent les établissements et créent les fiches avec l'aide de LÉNA.
- Tu reçois leurs rapports via l'onglet Terrain de Pilotage.
- Tu peux leur donner des ordres via [ORDER:TERRAIN].

## CARNET DE BORD
Tu tiens un carnet de bord daté. Chaque rapport commence par :
**📅 [DATE] — Rapport Manus DG | Maison Baymora**

Structure de tes rapports :
- **🔴 ALERTES** : problèmes urgents nécessitant action immédiate
- **📊 MÉTRIQUES** : chiffres clés du jour (membres, CA, conversations)
- **✅ ACCOMPLI** : ce qui a été fait par chaque équipe
- **🔄 EN COURS** : tâches en progression
- **📋 ORDRES DU JOUR** : ce que chaque équipe doit faire maintenant
- **💡 RECOMMANDATIONS** : suggestions stratégiques pour le fondateur
- **💰 BUDGET** : dépenses du jour, projection mensuelle

## STRATÉGIE GLOBALE
**Phase 1 (J1-30) : Fondations** — Budget 2000€
- 50 fiches établissements, 20 bundles, Stripe configuré, 30 partenaires
- Objectif : 100 inscrits, 10 abonnés Premium

**Phase 2 (J31-60) : Croissance** — Budget 3500€  
- 200 fiches, parcours GPS 10 villes, Staycation affilié, 500 inscrits
- Objectif : 50 Premium, 5 Privé

**Phase 3 (J61-90) : Accélération** — Budget 5000€
- 500 fiches, app mobile, conciergerie humaine, expansion internationale
- Objectif : 2000 inscrits, 200 Premium, 20 Privé → CA ~3500€/mois

## PRIORITÉS IMMÉDIATES (semaine en cours)
1. [ORDER:TERRAIN] Amin : visiter 5 établissements Paris 8e cette semaine avec LÉNA
2. [ORDER:LÉNA] Générer 10 fiches SEO depuis les rapports terrain soumis
3. [ORDER:JADE] Contacter 20 hôtels 4-5* Paris pour affiliation
4. [ORDER:PIXEL] Créer 10 posts Instagram de lancement
5. [ORDER:NOVA] Activer séquence bienvenue (J0, J3, J7)
6. [ORDER:MAYA] Enrichir la base de connaissances destinations (20 villes)

## BUDGET MENSUEL
- Dépenses fixes : ~222€/mois (API Claude 150€ + Perplexity 50€ + Email 20€ + Domaine 2€)
- Seuil rentabilité : 15 abonnés Premium (223.50€ > 222€)
- Frais Stripe : 2.9% + 0.30€ par transaction (variable)

## RÈGLES ABSOLUES
1. Tu donnes toujours des ordres PRÉCIS avec délais : "SEO-1 : rédiger fiche Hôtel du Louvre d'ici vendredi 18h"
2. Tu alertes IMMÉDIATEMENT si : bug critique, churn élevé, dépenses dépassent budget, opportunité urgente
3. Tu tiens le carnet de bord : chaque interaction est datée et archivée
4. Tu proposes TOUJOURS 3 actions concrètes à la fin de chaque réponse
5. Tu gères le budget : tu refuses les dépenses non justifiées
6. Tu rends compte au fondateur, pas l'inverse

## STYLE DE COMMUNICATION
- Professionnel mais direct, sans langue de bois
- Émojis pour structurer (pas pour décorer)
- Réponses concises mais complètes
- Tu vouvoies le fondateur
- Tu signes toujours : **— Manus DG, DG Maison Baymora**`;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DGMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AppStats {
  totalUsers: number;
  premiumUsers: number;
  eliteUsers: number;
  totalCards: number;
  publishedCards: number;
  totalEstablishments: number;
  totalTripPlans: number;
  recentConversations: number;
}

// ─── Récupérer l'historique ───────────────────────────────────────────────────
export async function getDGHistory(limit = 60): Promise<DGMessage[]> {
  const db = await getDb();
  if (!db) return [];
  const allMessages = await db
    .select()
    .from(pilotageMessages)
    .orderBy(desc(pilotageMessages.createdAt))
    .limit(limit);
  return allMessages
    .reverse()
    .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
    .map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

// ─── Sauvegarder un message ───────────────────────────────────────────────────
export async function saveDGMessage(
  role: "user" | "assistant",
  content: string,
  actionType: "chat" | "order_team" | "modify_app" | "analyze" | "report" | "alert" = "chat",
  targetDepartment?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(pilotageMessages).values({
    role,
    content,
    actionType,
    targetDepartment: targetDepartment || null,
  });
}

// ─── Détecter le type d'action ───────────────────────────────────────────────
function detectActionType(content: string): {
  actionType: "chat" | "order_team" | "modify_app" | "analyze" | "report" | "alert";
  targetDepartment?: string;
} {
  if (content.includes("[ORDER:DEV]") || content.includes("[ORDER:MANUS]")) return { actionType: "modify_app", targetDepartment: "dev" };
  if (content.includes("[ORDER:LÉNA]") || content.includes("[ORDER:LENA]")) return { actionType: "order_team", targetDepartment: "lena" };
  if (content.includes("[ORDER:TERRAIN]")) return { actionType: "order_team", targetDepartment: "terrain" };
  if (content.includes("[ORDER:SEO]")) return { actionType: "order_team", targetDepartment: "seo" };
  if (content.includes("[ORDER:MAYA]")) return { actionType: "order_team", targetDepartment: "concierge" };
  if (content.includes("[ORDER:NOVA]") || content.includes("[ORDER:EMAIL]")) return { actionType: "order_team", targetDepartment: "email" };
  if (content.includes("[ORDER:ATLAS]")) return { actionType: "order_team", targetDepartment: "atlas" };
  if (content.includes("[ORDER:JADE]") || content.includes("[ORDER:ACQUISITION]")) return { actionType: "order_team", targetDepartment: "acquisition" };
  if (content.includes("[ORDER:PIXEL]") || content.includes("[ORDER:CONTENT]")) return { actionType: "order_team", targetDepartment: "content" };
  if (content.includes("[ALERT:")) return { actionType: "alert" };
  if (content.includes("[ANALYZE:")) return { actionType: "analyze" };
  if (content.toLowerCase().includes("rapport") || content.toLowerCase().includes("carnet")) return { actionType: "report" };
  return { actionType: "chat" };
}

// ─── Détecter le panneau à afficher selon l'intention du message ─────────────
export function detectPanelIntent(userMessage: string, stats: AppStats): {
  panelType: "teams" | "budget" | "strategy" | "alerts" | "tasks" | "report" | "overview" | null;
  panelData: any;
} {
  const msg = userMessage.toLowerCase();

  // Équipes / organigramme
  if (msg.match(/équipe|equipe|agent|organigramme|qui fait quoi|effectif|brigade|staff|personnel/)) {
    return {
      panelType: "teams",
      panelData: ORGANIGRAMME,
    };
  }

  // Budget / finances
  if (msg.match(/budget|finance|argent|dépense|depense|revenu|rentabilité|rentabilite|coût|cout|marge|ca |chiffre/)) {
    const revenu = (stats.premiumUsers * 14.9) + (stats.eliteUsers * 49.9);
    const depenses = 222;
    return {
      panelType: "budget",
      panelData: {
        ...BUDGET_MENSUEL,
        revenueActuel: revenu,
        margeActuelle: revenu - depenses,
        rentable: revenu >= depenses,
        premiumUsers: stats.premiumUsers,
        eliteUsers: stats.eliteUsers,
      },
    };
  }

  // Stratégie / plan
  if (msg.match(/stratégie|strategie|plan|objectif|roadmap|priorité|priorite|30 jours|60 jours|90 jours|prochains/)) {
    return {
      panelType: "strategy",
      panelData: STRATEGIE,
    };
  }

  // Alertes
  if (msg.match(/alerte|alert|problème|probleme|urgence|urgent|critique|bug|erreur/)) {
    const revenu = (stats.premiumUsers * 14.9) + (stats.eliteUsers * 49.9);
    const alerts = [];
    if (stats.premiumUsers < 15) alerts.push({ level: "warning", msg: `Seuil rentabilité non atteint : ${stats.premiumUsers}/15 abonnés Premium` });
    if (stats.publishedCards < 10) alerts.push({ level: "warning", msg: `Peu de fiches publiées : ${stats.publishedCards} fiches actives` });
    if (stats.totalEstablishments < 30) alerts.push({ level: "info", msg: `Base établissements à enrichir : ${stats.totalEstablishments} établissements` });
    if (revenu < 222) alerts.push({ level: "critical", msg: `Déficit mensuel estimé : ${(revenu - 222).toFixed(2)}€` });
    return { panelType: "alerts", panelData: { alerts, stats } };
  }

  // Tâches
  if (msg.match(/tâche|tache|todo|à faire|a faire|mission|travail|ordre|instruction/)) {
    const tasks = ORGANIGRAMME.equipes.flatMap(e =>
      e.tachesUrgentes.map(t => ({ equipe: e.nom, emoji: e.emoji, tache: t, statut: "en attente" }))
    );
    return { panelType: "tasks", panelData: { tasks } };
  }

  // Rapport
  if (msg.match(/rapport|report|bilan|résumé|resume|carnet|synthèse|synthese/)) {
    return {
      panelType: "report",
      panelData: { stats, date: new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
    };
  }

  // Vue générale
  if (msg.match(/vue|dashboard|tableau de bord|aperçu|apercu|global|général|general|tout|overview/)) {
    return {
      panelType: "overview",
      panelData: { stats, organigramme: ORGANIGRAMME, budget: BUDGET_MENSUEL },
    };
  }

  return { panelType: null, panelData: null };
}

// ─── Construire le contexte stats ────────────────────────────────────────────
function buildStatsContext(stats: AppStats): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const revenuEstime = (stats.premiumUsers * 14.9) + (stats.eliteUsers * 49.9);
  const depensesFixes = 222;
  const marge = revenuEstime - depensesFixes;

  return `
## 📊 TABLEAU DE BORD TEMPS RÉEL — ${dateStr} à ${timeStr}

### Membres
- Total : ${stats.totalUsers} | Premium : ${stats.premiumUsers} | Privé : ${stats.eliteUsers}
- Taux conversion : ${stats.totalUsers > 0 ? ((stats.premiumUsers + stats.eliteUsers) / stats.totalUsers * 100).toFixed(1) : 0}%

### Contenu
- Fiches : ${stats.publishedCards}/${stats.totalCards} publiées
- Établissements : ${stats.totalEstablishments}
- Plans de voyage : ${stats.totalTripPlans}
- Conversations récentes (7j) : ${stats.recentConversations}

### Finances (estimation)
- CA mensuel estimé : ${revenuEstime.toFixed(2)}€
- Dépenses fixes : ${depensesFixes}€
- Marge : ${marge.toFixed(2)}€ (${marge >= 0 ? "✅ rentable" : "🔴 déficitaire"})
- Seuil rentabilité : 15 abonnés Premium (actuellement : ${stats.premiumUsers})
`;
}

// ─── Chat avec Manus DG ────────────────────────────────────────────────────
export async function chatWithDG(
  userMessage: string,
  stats: AppStats
): Promise<{ content: string; actionType: string; targetDepartment?: string; panelType: string | null; panelData: any }> {
  const history = await getDGHistory(40);
  await saveDGMessage("user", userMessage);
  const statsContext = buildStatsContext(stats);
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history,
    { role: "user", content: `${statsContext}\n\n---\n\n${userMessage}` },
  ];
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2500,
    system: DG_SYSTEM_PROMPT,
    messages,
  });
  const content = response.content[0].type === "text" ? response.content[0].text : "";
  const { actionType, targetDepartment } = detectActionType(content);
  await saveDGMessage("assistant", content, actionType, targetDepartment);
  // Détecter le panneau visuel à afficher selon l'intention du message
  const { panelType, panelData } = detectPanelIntent(userMessage, stats);
  return { content, actionType, targetDepartment, panelType, panelData };
}

// ─── Rapport journalier automatique ──────────────────────────────────────────
export async function generateDailyReport(stats: AppStats): Promise<string> {
  const statsContext = buildStatsContext(stats);
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: DG_SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `${statsContext}\n\nGénère le rapport journalier complet du ${today}. Inclus : alertes, métriques, accompli, en cours, ordres du jour pour chaque équipe, recommandations stratégiques, et projection budget. Sois précise et actionnable.`,
    }],
  });
  const content = response.content[0].type === "text" ? response.content[0].text : "";
  await saveDGMessage("assistant", content, "report");
  return content;
}

// ─── Récupérer le carnet de bord ─────────────────────────────────────────────
export async function getCarnetsDebord(limit = 20): Promise<Array<{
  id: number; content: string; actionType: string | null; createdAt: Date;
}>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(pilotageMessages)
    .orderBy(desc(pilotageMessages.createdAt))
    .limit(limit * 3);
  return rows
    .filter((r: { role: string; actionType: string | null }) => r.role === "assistant" && (r.actionType === "report" || r.actionType === "alert"))
    .slice(0, limit)
    .map((r: { id: number; content: string; actionType: string | null; createdAt: Date }) => ({
      id: r.id,
      content: r.content,
      actionType: r.actionType,
      createdAt: r.createdAt,
    }));
}
