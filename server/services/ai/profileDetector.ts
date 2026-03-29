/**
 * PROFILE DETECTOR — Algorithmes de scoring par signaux + orchestration
 *
 * Analyse les messages utilisateur (uniquement role === 'user')
 * pour détecter tier budgétaire, dimensions, status et mode express.
 *
 * NOTE ARCHITECTURE: detectProfile() et buildPersonaPrompt() sont ici
 * (et non dans personas.ts) pour éviter l'import circulaire.
 * llm.ts importe directement depuis ce fichier.
 */

import type { LLMMessage, DimensionKey, DetectedProfile } from './personas';
import { TIER_PROFILES } from './personas';

// ─── scoreTier ────────────────────────────────────────────────────────────────

/**
 * Détermine le tier budgétaire à partir des messages utilisateur.
 * Ne lit que les messages role === 'user' pour éviter la contamination.
 *
 * Confidence = bestScore / (bestScore + secondScore + 1)
 */
export function scoreTier(messages: LLMMessage[]): { tier: string; confidence: number } {
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  if (!userText.trim()) {
    return { tier: 't2', confidence: 0.1 };
  }

  const scores: Record<string, number> = {};

  for (const profile of TIER_PROFILES) {
    let score = 0;
    for (const pattern of profile.signalPatterns) {
      const matches = userText.match(new RegExp(pattern.source, 'gi'));
      if (matches) score += matches.length;
    }
    scores[profile.id] = score;
  }

  // Trouver le meilleur et le second
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const second = sorted[1];

  if (!best || best[1] === 0) {
    return { tier: 't2', confidence: 0.1 };
  }

  const confidence = best[1] / (best[1] + (second?.[1] ?? 0) + 1);

  return { tier: best[0], confidence };
}

// ─── scoreDimensions ──────────────────────────────────────────────────────────

/**
 * Détecte les 14 dimensions du profil client.
 * Ne lit que les messages role === 'user'.
 */
export function scoreDimensions(messages: LLMMessage[]): Partial<Record<DimensionKey, string>> {
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  const dims: Partial<Record<DimensionKey, string>> = {};

  // ── Culture / origine
  if (/halal|inshallah|ramadan|dubaï|abu dhabi|qatar|riyadh|djeddah|casablanca/i.test(userText)) {
    dims.culture = 'mena';
  } else if (/cacher|shabbat|israël|tel aviv|bar.?mitsva/i.test(userText)) {
    dims.culture = 'jewish';
  } else if (/temple|bouddhisme|végétarien.{0,15}bouddhiste|ashram|yoga.{0,15}inde/i.test(userText)) {
    dims.culture = 'asian_spiritual';
  }

  // ── Famille / composition
  if (/enfant|mes enfants|la petite|nanny|baby.?sitter|poussette|bébé|junior/i.test(userText)) {
    dims.family = 'enfants';
  } else if (/en couple|ma femme|mon mari|avec mon (compagnon|partenaire)|ma chérie|mon chéri/i.test(userText)) {
    dims.family = 'couple';
  } else if (/\bseul\b|\bsolo\b|tout seul|par moi.même|solo trip/i.test(userText)) {
    dims.family = 'solo';
  } else if (/entre amis|avec (mes )?(amis|potes|copains)|groupe|bachelor/i.test(userText)) {
    dims.family = 'groupe_amis';
  } else if (/en famille|toute la famille|mes parents|ma famille/i.test(userText)) {
    dims.family = 'famille_elargie';
  }

  // ── Visibilité / ostentation
  if (/instagram|story|reel|tiktok|je veux être vu|selfie|content creator|influenceur/i.test(userText)) {
    dims.visibility = 'bling';
  } else if (/discret|anonymat|pas de photos|sans être vu|incognito|privé/i.test(userText)) {
    dims.visibility = 'discret';
  }

  // ── Mobilité / PMR
  if (/fauteuil|pmr|handicap|mobilité réduite|accès adapté|accessible|ascenseur obligatoire/i.test(userText)) {
    dims.mobility = 'pmr';
  }

  // ── Régime alimentaire
  if (/halal/i.test(userText)) {
    dims.diet = 'halal';
  } else if (/vegan|végétalien/i.test(userText)) {
    dims.diet = 'vegan';
  } else if (/végétarien/i.test(userText)) {
    dims.diet = 'vegetarian';
  } else if (/cacher/i.test(userText)) {
    dims.diet = 'cacher';
  } else if (/sans gluten/i.test(userText)) {
    dims.diet = 'sans_gluten';
  }

  // ── Orientation sexuelle (pour recommandations LGBT+ friendly)
  if (/lgbt|gay|lesbien|queer|pride|avec mon (copain|boyfriend|mec)|avec ma (copine|girlfriend)/i.test(userText)) {
    dims.orientation = 'lgbtq';
  }

  // ── Origine de la richesse
  if (/gstaad|deauville|capri|saint.?moritz|depuis \d{2,3} ans|vieille famille|héritage/i.test(userText)) {
    dims.money_origin = 'old_money';
  } else if (/lamborghini|ferrari|bugatti|rolex|fortune|crypto|nft|startup|licorne|ipo|exit/i.test(userText)) {
    dims.money_origin = 'new_money';
  }

  // ── Besoin de nouveauté vs fidélité
  if (/toujours|comme d'habitude|ma suite habituelle|je reviens|chaque année/i.test(userText)) {
    dims.novelty = 'fidele';
  } else if (/jamais fait|inédit|original|unique|surprenant|hors des sentiers/i.test(userText)) {
    dims.novelty = 'aventurier';
  }

  // ── Autonomie vs accompagnement
  if (/je gère|je m'occupe|juste une idée|pas besoin|je connais/i.test(userText)) {
    dims.autonomy = 'autonome';
  } else if (/prenez en charge|organisez tout|je vous délègue|conciergerie complète/i.test(userText)) {
    dims.autonomy = 'full_service';
  }

  // ── Résidence / contexte géographique
  if (/je suis à paris|depuis paris|depuis lyon|depuis marseille|je vis à/i.test(userText)) {
    const cityMatch = userText.match(/(?:depuis|je suis à|je vis à|basé à)\s+([A-ZÀ-Ÿa-zà-ÿ\s-]{3,20})/i);
    if (cityMatch) dims.residence = cityMatch[1].trim().toLowerCase();
  }

  // ── Social media
  if (/instagram|tiktok|youtube|twitch|followers|abonnés|ma communauté/i.test(userText)) {
    dims.social_media = 'influencer';
  }

  // ── Animal de compagnie
  if (/mon (petit )?chien|ma chienne|labrador|berger|golden|yorkshire/i.test(userText)) {
    dims.pet = 'chien';
  } else if (/mon chat|ma chatte/i.test(userText)) {
    dims.pet = 'chat';
  } else if (/mon animal|avec mon (compagnon animal|pet)/i.test(userText)) {
    dims.pet = 'animal';
  }

  // ── Objectif (deduplique avec detectObjectives, mais utile ici aussi)
  if (/anniversaire|fête|célébration|mariage|lune de miel|honeymoon/i.test(userText)) {
    dims.objective = 'celebration';
  } else if (/réunion|meeting|conférence|séminaire|incentive|team building/i.test(userText)) {
    dims.objective = 'business';
  } else if (/détente|recharge|me ressourcer|stress|burn.?out|repos/i.test(userText)) {
    dims.objective = 'wellness';
  }

  return dims;
}

// ─── detectStatus ─────────────────────────────────────────────────────────────

/**
 * Détecte si le client est une personnalité avec statut particulier.
 */
export function detectStatus(messages: LLMMessage[]): string | undefined {
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  if (/mon agent|ma fédération|match|tournoi|transfert|club de foot|sport pro|entraineur/i.test(userText)) {
    return 'sportif';
  }
  if (/ma tournée|mon label|mon manager|backstage|loge|rider|ma maison de disques|mon concert|mon show/i.test(userText)) {
    return 'star';
  }
  if (/ma boîte|mon entreprise|ma startup|\bCEO\b|fondateur|mon conseil d'administration|mes associés|actionnaires/i.test(userText)) {
    return 'entrepreneur';
  }
  if (/mon film|ma série|ma prod|casting|réalisateur|producteur|scénario/i.test(userText)) {
    return 'star';
  }

  return undefined;
}

// ─── detectObjectives ─────────────────────────────────────────────────────────

/**
 * Détecte les objectifs du voyage.
 * Peut retourner plusieurs objectifs simultanément.
 */
export function detectObjectives(messages: LLMMessage[]): string[] {
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  const objectives: string[] = [];

  if (/anniversaire|fête|célébration|mariage|fiançailles|lune de miel|honeymoon|noces/i.test(userText)) {
    objectives.push('célébration');
  }
  if (/détente|recharge|me ressourcer|stress|burn.?out|repos|spa|massage|décompresser/i.test(userText)) {
    objectives.push('wellness');
  }
  if (/gastronomie|restaurant étoilé|chef|dégustation|vins|oenologie|caviar|truffe/i.test(userText)) {
    objectives.push('gastronomie');
  }
  if (/réunion|meeting|conférence|séminaire|incentive|team building|business|deal/i.test(userText)) {
    objectives.push('business');
  }
  if (/fête|boite|nightlife|soirée|club|dj|après|after|party/i.test(userText)) {
    objectives.push('nightlife');
  }
  if (/culture|musée|galerie|expo|art|patrimoine|architecture|histoire/i.test(userText)) {
    objectives.push('culture');
  }
  if (/nature|randonnée|montagne|forêt|trek|plongée|safari|plein air/i.test(userText)) {
    objectives.push('aventure-nature');
  }
  if (/shopping|boutique|luxe|mode|fashion week|outlet|créateurs/i.test(userText)) {
    objectives.push('shopping');
  }
  if (/golf|tennis|ski|surf|plongée|équitation|sport nautique/i.test(userText)) {
    objectives.push('sport');
  }
  if (/romance|romantique|en amour|surprise pour/i.test(userText)) {
    objectives.push('romantique');
  }

  return objectives;
}

// ─── detectExpressMode ────────────────────────────────────────────────────────

/**
 * Détecte si le dernier message user active le mode express.
 * Ne regarde QUE le dernier message utilisateur.
 */
export function detectExpressMode(messages: LLMMessage[]): boolean {
  const lastUserMessage = [...messages]
    .reverse()
    .find(m => m.role === 'user');

  if (!lastUserMessage) return false;

  return /vite|rapide|au plus vite|maintenant|réserver maintenant|direct|j'ai décidé|le meilleur|top\b|sans attendre|pas le temps|en 2 minutes|efficace|\bgo\b|go !|allez|let's go|je veux juste|donne.moi le meilleur|meilleur tout de suite/i.test(
    lastUserMessage.content
  );
}

// ─── detectProfile ────────────────────────────────────────────────────────────

/**
 * Orchestre la détection complète du profil client.
 * Point d'entrée principal depuis llm.ts.
 */
export function detectProfile(messages: LLMMessage[]): DetectedProfile {
  const { tier, confidence } = scoreTier(messages);
  const dimensions = scoreDimensions(messages);
  const status = detectStatus(messages);
  const objectives = detectObjectives(messages);
  const expressMode = detectExpressMode(messages);

  const tierProfile = TIER_PROFILES.find(t => t.id === tier) ?? TIER_PROFILES[1];

  // Construire le label de profil
  const parts: string[] = [tierProfile.label];
  if (status) parts.push(status);
  if (dimensions.family) parts.push(dimensions.family);
  if (dimensions.visibility) parts.push(dimensions.visibility);

  const profileLabel = parts.join(' · ');

  // Calibration des recommandations
  let recommendationCalibration = tierProfile.dailyUsage;
  if (dimensions.diet) recommendationCalibration += ` | Régime: ${dimensions.diet}`;
  if (dimensions.mobility === 'pmr') recommendationCalibration += ' | Accessibilité PMR requise';
  if (dimensions.culture === 'mena') recommendationCalibration += ' | Options halal';
  if (dimensions.pet) recommendationCalibration += ` | Voyage avec ${dimensions.pet}`;

  return {
    tier,
    tierConfidence: confidence,
    dimensions,
    status,
    objectives,
    expressMode,
    profileLabel,
    recommendationCalibration,
  };
}

// ─── buildPersonaPrompt ───────────────────────────────────────────────────────

/**
 * Génère le bloc Markdown injecté en fin de system prompt.
 * Adapte le niveau de détail selon la confidence et le mode express.
 */
export function buildPersonaPrompt(profile: DetectedProfile): string {
  const tierProfile = TIER_PROFILES.find(t => t.id === profile.tier) ?? TIER_PROFILES[1];
  const confidenceNote = profile.tierConfidence < 0.3
    ? ` *(profil estimé, à confirmer — confidence: ${Math.round(profile.tierConfidence * 100)}%)*`
    : '';

  const lines: string[] = [];

  lines.push(`## Profil client détecté${confidenceNote}`);
  lines.push(`**Tier:** ${tierProfile.label} (${tierProfile.budgetRange})${confidenceNote}`);
  lines.push(`**Label:** ${profile.profileLabel}`);
  lines.push(`**Calibration:** ${profile.recommendationCalibration}`);
  lines.push('');

  lines.push(`**Transports typiques:** ${tierProfile.transport.join(', ')}`);
  lines.push(`**Hébergements typiques:** ${tierProfile.hotels.join(', ')}`);

  if (tierProfile.alcools.length > 0) {
    lines.push(`**Références alcools:** ${tierProfile.alcools.join(', ')}`);
  }
  if (tierProfile.cigares) {
    const cigarMap: Record<string, string> = {
      t3: 'Cohiba Siglo VI, Romeo y Julieta',
      t4: 'Cohiba Siglo VI, Davidoff No. 2, Montecristo No 2',
      t5: 'Cohiba Behike BHK 56, Arturo Fuente Opus X, Davidoff Winston Churchill',
      t6: 'Davidoff Winston Churchill Aged, Cohiba Behike 52/54/56, Arturo Fuente Opus X Double Robusto',
    };
    const cigarRef = cigarMap[profile.tier];
    if (cigarRef) lines.push(`**Cigares de référence:** ${cigarRef}`);
  }

  lines.push(`**Destinations typiques:** ${tierProfile.destinations.join(', ')}`);

  if (tierProfile.villaWeeklyAvg) {
    lines.push(`**Villa:** moy. ${tierProfile.villaWeeklyAvg.toLocaleString('fr-FR')}€/sem`);
  }
  if (tierProfile.yachtDailyAvg) {
    lines.push(`**Yacht:** moy. ${tierProfile.yachtDailyAvg.toLocaleString('fr-FR')}€/jour`);
  }

  const dimLines: string[] = [];
  for (const [key, value] of Object.entries(profile.dimensions)) {
    if (value) dimLines.push(`${key}: ${value}`);
  }
  if (dimLines.length > 0) {
    lines.push('');
    lines.push(`**Dimensions détectées:** ${dimLines.join(' | ')}`);
  }

  if (profile.objectives.length > 0) {
    lines.push(`**Objectifs voyage:** ${profile.objectives.join(', ')}`);
  }

  if (profile.status) {
    const statusContext: Record<string, string> = {
      sportif: 'Client sportif pro ou semi-pro : transferts aéroport rapides, récupération physique, discrétion vis-à-vis des fans',
      star: 'Artiste ou célébrité : entrées discrètes, backroom disponible, pas de photos, rider possible',
      entrepreneur: 'Entrepreneur / CEO : travail en déplacement, connexion fiable, salles de réunion VIP, networking',
    };
    const ctx = statusContext[profile.status];
    if (ctx) {
      lines.push('');
      lines.push(`**Contexte ${profile.status}:** ${ctx}`);
    }
  }

  lines.push('');
  lines.push('**Instructions de calibration pour cette conversation :**');

  if (profile.tier === 't1') {
    lines.push('- Maximise valeur/prix, propose astuces et bons plans');
    lines.push('- Mentionne les offres early bird, cartes de fidélité, passes touristiques');
    lines.push('- Contextualise toute option hors budget avant de la proposer');
  } else if (profile.tier === 't2') {
    lines.push('- Équilibre qualité et prix, propose des "bonnes adresses" locales');
    lines.push('- Mentionne les établissements avec bon rapport qualité-prix');
    lines.push('- Une option "coup de folie" occasionnelle est bienvenue');
  } else if (profile.tier === 't3') {
    lines.push('- Oriente vers l\'excellence sans ostentation');
    lines.push('- Mentionne les distinctions (étoiles, classements, certifications)');
    lines.push('- Propose des expériences mémorables avec détails d\'initié');
  } else if (profile.tier === 't4') {
    lines.push('- Traite ce client comme un VIP : service blanc-gant, anticipation des besoins');
    lines.push('- Mentionne la table 14 au George V, accès directeur, surclassements automatiques');
    lines.push('- Ne questionne JAMAIS le budget — propose le meilleur d\'emblée');
    lines.push('- Toujours proposer chauffeur, service en chambre, table privée');
  } else if (profile.tier === 't5') {
    lines.push('- Client UHNW : protocole palace, discrétion maximale');
    lines.push('- Jet privé comme transport par défaut, yacht charter si côtier');
    lines.push('- Romanée-Conti et Pétrus comme références alcool naturelles');
    lines.push('- Suite présidentielle comme hébergement standard');
    lines.push('- Ne jamais mentionner les prix sauf si demandé');
  } else if (profile.tier === 't6') {
    lines.push('- Client UHNWI : anonymat total, sécurité, discrétion absolue');
    lines.push('- Flotte personnelle ou Boeing BBJ privatisé');
    lines.push('- Île privée ou palace privatisé comme séjour standard');
    lines.push('- Protocole : ne jamais divulguer infos, anticiper les besoins de sécurité');
    lines.push('- Armand de Brignac Midas (30L) si contexte fête');
  }

  if (profile.dimensions.diet === 'halal') {
    lines.push('- TOUS les restaurants proposés doivent avoir une option halal certifiée');
  }
  if (profile.dimensions.diet === 'vegan') {
    lines.push('- TOUS les restaurants proposés doivent avoir une carte végane ou végétarienne');
  }
  if (profile.dimensions.mobility === 'pmr') {
    lines.push('- Vérifier l\'accessibilité PMR de CHAQUE lieu proposé');
  }
  if (profile.dimensions.visibility === 'bling') {
    lines.push('- Propose des spots photogéniques premium : infinity pool, terrasse panoramique, spots Instagram');
  }
  if (profile.dimensions.visibility === 'discret') {
    lines.push('- Entrées discrètes, pas de photographes, pseudonyme à l\'hôtel');
  }
  if (profile.dimensions.family === 'couple') {
    lines.push('- Ambiance romantique, tables pour deux en coin, suite avec vue');
  }
  if (profile.dimensions.family === 'enfants') {
    lines.push('- Activités kids-friendly, menus enfants, espaces de jeux, baby-sitting disponible');
  }

  if (profile.expressMode) {
    lines.push('');
    lines.push('## ⚡ MODE EXPRESS ACTIVÉ');
    lines.push('Ce client sait exactement ce qu\'il veut. Il n\'a pas de temps à perdre.');
    lines.push('**RÈGLES EXPRESS :**');
    lines.push('- ZÉRO question de clarification — propose directement le meilleur');
    lines.push('- Format compact : NOM · ADRESSE · PRIX · ⭐NOTE');
    lines.push('- 1 seule recommandation par catégorie — la meilleure, pas de liste');
    lines.push('- Ajoute immédiatement le :::GCAL::: et le lien de réservation');
    lines.push('- Termine par : "Je vous réserve ça maintenant ?" avec :::QR::: ✅ Réserver | 📞 M\'appeler | ✨ Autre option :::END:::');
  }

  return lines.join('\n');
}
