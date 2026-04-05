/**
 * CALENDAR EVENTS — Conscience temporelle de Baymora
 *
 * Fournit au LLM la date/heure actuelle + les fêtes/événements proches
 * pour adapter ses recommandations (cadeaux, anticipation, promos saisonnières).
 *
 * Couvre : France, USA, fêtes internationales, événements lifestyle premium.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  name: string;
  date: string;            // MM-DD ou calculé dynamiquement
  country: 'FR' | 'US' | 'INT';
  category: 'holiday' | 'gift' | 'lifestyle' | 'season' | 'commercial';
  giftIdea?: string;       // suggestion cadeau / action Baymora
  daysBeforeAlert?: number; // combien de jours avant pour alerter (défaut: 14)
  proactivePrompt?: string; // message que l'IA peut glisser
}

// ─── Fêtes fixes (MM-DD) ────────────────────────────────────────────────────

const FIXED_EVENTS: CalendarEvent[] = [
  // 🇫🇷 France
  { name: 'Jour de l\'An', date: '01-01', country: 'FR', category: 'holiday', giftIdea: 'Voyage surprise, coffret bien-être', daysBeforeAlert: 7 },
  { name: 'Épiphanie (Galette des Rois)', date: '01-06', country: 'FR', category: 'lifestyle' },
  { name: 'Saint-Valentin', date: '02-14', country: 'INT', category: 'gift', giftIdea: 'Dîner étoilé, week-end romantique, bijoux', daysBeforeAlert: 21, proactivePrompt: 'La Saint-Valentin approche — un dîner étoilé ou un week-end surprise pour votre moitié ?' },
  { name: 'Chandeleur', date: '02-02', country: 'FR', category: 'lifestyle' },
  { name: 'Journée de la Femme', date: '03-08', country: 'INT', category: 'gift', giftIdea: 'Spa, expérience, séjour entre amies', daysBeforeAlert: 10 },
  { name: 'Saint-Patrick', date: '03-17', country: 'INT', category: 'lifestyle', giftIdea: 'Soirée irlandaise, pub crawl' },
  { name: 'Poisson d\'Avril', date: '04-01', country: 'FR', category: 'lifestyle' },
  { name: 'Fête du Travail', date: '05-01', country: 'FR', category: 'holiday', giftIdea: 'Week-end prolongé, escapade nature' },
  { name: 'Victoire 1945', date: '05-08', country: 'FR', category: 'holiday' },
  { name: 'Fête des Mères (FR)', date: 'LAST_SUN_MAY', country: 'FR', category: 'gift', giftIdea: 'Spa, bijoux, séjour, brunch palace', daysBeforeAlert: 21, proactivePrompt: 'La Fête des Mères arrive — un cadeau inoubliable pour elle ?' },
  { name: 'Mother\'s Day (US)', date: '2ND_SUN_MAY', country: 'US', category: 'gift', giftIdea: 'Spa day, jewelry, brunch', daysBeforeAlert: 21 },
  { name: 'Fête des Pères', date: '3RD_SUN_JUN', country: 'FR', category: 'gift', giftIdea: 'Expérience voiture, montre, gastronomie', daysBeforeAlert: 21, proactivePrompt: 'La Fête des Pères approche — expérience unique ou cadeau premium ?' },
  { name: 'Father\'s Day (US)', date: '3RD_SUN_JUN', country: 'US', category: 'gift', giftIdea: 'Golf, watches, whisky tasting', daysBeforeAlert: 21 },
  { name: 'Fête de la Musique', date: '06-21', country: 'FR', category: 'lifestyle', giftIdea: 'Concerts, festivals, sorties nocturnes' },
  { name: 'Fête Nationale (FR)', date: '07-14', country: 'FR', category: 'holiday', giftIdea: 'Feux d\'artifice, croisière, rooftop' },
  { name: 'Independence Day (US)', date: '07-04', country: 'US', category: 'holiday', giftIdea: 'BBQ party, fireworks cruise, Hamptons' },
  { name: 'Assomption', date: '08-15', country: 'FR', category: 'holiday', giftIdea: 'Week-end prolongé, escapade balnéaire' },
  { name: 'Labor Day (US)', date: '1ST_MON_SEP', country: 'US', category: 'holiday' },
  { name: 'Journée du Patrimoine', date: '3RD_SAT_SEP', country: 'FR', category: 'lifestyle', giftIdea: 'Visites privées, lieux habituellement fermés' },
  { name: 'Halloween', date: '10-31', country: 'INT', category: 'lifestyle', giftIdea: 'Soirée costumée, expérience frisson, fête privée', daysBeforeAlert: 14 },
  { name: 'Toussaint', date: '11-01', country: 'FR', category: 'holiday' },
  { name: 'Armistice', date: '11-11', country: 'FR', category: 'holiday' },
  { name: 'Thanksgiving (US)', date: '4TH_THU_NOV', country: 'US', category: 'holiday', giftIdea: 'Dîner spécial, family gathering', daysBeforeAlert: 14 },
  { name: 'Black Friday', date: 'DAY_AFTER_THANKSGIVING', country: 'INT', category: 'commercial', giftIdea: 'Shopping premium, bonnes affaires luxe', daysBeforeAlert: 7 },
  { name: 'Cyber Monday', date: 'CYBER_MONDAY', country: 'INT', category: 'commercial' },
  { name: 'Noël', date: '12-25', country: 'INT', category: 'gift', giftIdea: 'Cadeaux premium, séjour ski, croisière, coffret', daysBeforeAlert: 30, proactivePrompt: 'Noël approche — besoin d\'idées cadeaux ou d\'un séjour en famille ?' },
  { name: 'Saint-Sylvestre', date: '12-31', country: 'INT', category: 'holiday', giftIdea: 'Réveillon palace, yacht party, chalet ski', daysBeforeAlert: 21 },

  // Événements lifestyle premium
  { name: 'Festival de Cannes', date: '05-13', country: 'FR', category: 'lifestyle', giftIdea: 'Accès projections, yacht party, soirées privées', daysBeforeAlert: 30 },
  { name: 'Roland-Garros', date: '05-26', country: 'FR', category: 'lifestyle', giftIdea: 'Loges VIP, hospitality', daysBeforeAlert: 30 },
  { name: 'Monaco Grand Prix', date: '05-25', country: 'INT', category: 'lifestyle', giftIdea: 'Terrasse VIP, yacht dans le port', daysBeforeAlert: 30 },
  { name: 'Wimbledon', date: '07-01', country: 'INT', category: 'lifestyle', giftIdea: 'Debenture seats, strawberries & cream experience', daysBeforeAlert: 30 },
  { name: 'Art Basel (Miami)', date: '12-05', country: 'US', category: 'lifestyle', giftIdea: 'VIP preview, gallery tours, parties', daysBeforeAlert: 21 },
  { name: 'Fashion Week Paris', date: '09-25', country: 'FR', category: 'lifestyle', giftIdea: 'Shows, ateliers, after-parties', daysBeforeAlert: 21 },
  { name: 'Fashion Week Milan', date: '09-17', country: 'INT', category: 'lifestyle', daysBeforeAlert: 21 },
  { name: 'Coachella', date: '04-11', country: 'US', category: 'lifestyle', giftIdea: 'VIP passes, luxury camping, party houses', daysBeforeAlert: 30 },

  // Saisons
  { name: 'Début des soldes d\'hiver (FR)', date: '01-08', country: 'FR', category: 'commercial' },
  { name: 'Début des soldes d\'été (FR)', date: '06-25', country: 'FR', category: 'commercial' },
];

// ─── Calcul des dates dynamiques ────────────────────────────────────────────

function getNthWeekday(year: number, month: number, weekday: number, nth: number): Date {
  const first = new Date(year, month, 1);
  let day = 1 + ((weekday - first.getDay() + 7) % 7);
  day += (nth - 1) * 7;
  return new Date(year, month, day);
}

function getLastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0);
  let day = last.getDate() - ((last.getDay() - weekday + 7) % 7);
  return new Date(year, month, day);
}

function resolveDynamicDate(dateSpec: string, year: number): Date | null {
  switch (dateSpec) {
    case 'LAST_SUN_MAY': return getLastWeekday(year, 4, 0);         // Dernier dimanche de mai
    case '2ND_SUN_MAY': return getNthWeekday(year, 4, 0, 2);        // 2e dimanche de mai
    case '3RD_SUN_JUN': return getNthWeekday(year, 5, 0, 3);        // 3e dimanche de juin
    case '1ST_MON_SEP': return getNthWeekday(year, 8, 1, 1);        // 1er lundi de sept
    case '3RD_SAT_SEP': return getNthWeekday(year, 8, 6, 3);        // 3e samedi de sept
    case '4TH_THU_NOV': return getNthWeekday(year, 10, 4, 4);       // 4e jeudi de nov
    case 'DAY_AFTER_THANKSGIVING': {
      const thx = getNthWeekday(year, 10, 4, 4);
      return new Date(thx.getFullYear(), thx.getMonth(), thx.getDate() + 1);
    }
    case 'CYBER_MONDAY': {
      const thx = getNthWeekday(year, 10, 4, 4);
      return new Date(thx.getFullYear(), thx.getMonth(), thx.getDate() + 4);
    }
    default: return null;
  }
}

function getEventDate(event: CalendarEvent, year: number): Date | null {
  if (event.date.match(/^\d{2}-\d{2}$/)) {
    const [month, day] = event.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return resolveDynamicDate(event.date, year);
}

// ─── Saison actuelle ────────────────────────────────────────────────────────

function getCurrentSeason(now: Date): { name: string; emoji: string; context: string } {
  const month = now.getMonth();
  if (month >= 2 && month <= 4) return {
    name: 'Printemps',
    emoji: '🌸',
    context: 'Saison idéale pour les city breaks, terrasses, jardins, premières escapades. Pollen actif pour les allergiques.',
  };
  if (month >= 5 && month <= 7) return {
    name: 'Été',
    emoji: '☀️',
    context: 'Haute saison balnéaire, festivals, vacances scolaires. Réserver 2-3 mois à l\'avance pour les spots populaires.',
  };
  if (month >= 8 && month <= 10) return {
    name: 'Automne',
    emoji: '🍂',
    context: 'Saison parfaite pour la gastronomie, le vin, les city breaks culturels. Basse saison = meilleures offres hôtels.',
  };
  return {
    name: 'Hiver',
    emoji: '❄️',
    context: 'Ski, marchés de Noël, réveillons, escapades au soleil. Réservations anticipées pour Noël/Nouvel An indispensables.',
  };
}

// ─── Génération du contexte temporel pour le LLM ────────────────────────────

export interface TemporalContext {
  dateTimeBlock: string;     // Bloc à injecter dans le system prompt
  upcomingEvents: Array<{
    name: string;
    daysUntil: number;
    giftIdea?: string;
    proactivePrompt?: string;
  }>;
}

export function buildTemporalContext(userCountry?: 'FR' | 'US'): TemporalContext {
  const now = new Date();
  const year = now.getFullYear();
  const todayStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  const season = getCurrentSeason(now);

  // Filtrer les événements pertinents (pays du user + internationaux)
  const relevantCountries: Set<string> = new Set(['INT']);
  if (userCountry) relevantCountries.add(userCountry);
  else { relevantCountries.add('FR'); relevantCountries.add('US'); } // Par défaut les deux

  // Calculer les jours restants pour chaque événement
  const upcoming: TemporalContext['upcomingEvents'] = [];

  for (const event of FIXED_EVENTS) {
    if (!relevantCountries.has(event.country)) continue;

    const eventDate = getEventDate(event, year);
    if (!eventDate) continue;

    // Si l'événement est passé cette année, regarder l'année prochaine
    let targetDate = eventDate;
    if (targetDate < now) {
      const nextYearDate = getEventDate(event, year + 1);
      if (nextYearDate) targetDate = nextYearDate;
      else continue;
    }

    const daysUntil = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const alertDays = event.daysBeforeAlert ?? 14;

    if (daysUntil <= alertDays && daysUntil >= 0) {
      upcoming.push({
        name: event.name,
        daysUntil,
        giftIdea: event.giftIdea,
        proactivePrompt: event.proactivePrompt,
      });
    }
  }

  // Trier par proximité
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

  // Construire le bloc texte
  const lines: string[] = [
    `## 📅 Contexte temporel`,
    `**Date :** ${todayStr}`,
    `**Heure (Paris) :** ${timeStr}`,
    `**Saison :** ${season.emoji} ${season.name} — ${season.context}`,
  ];

  if (upcoming.length > 0) {
    lines.push('');
    lines.push('**Événements proches :**');
    for (const evt of upcoming) {
      const urgency = evt.daysUntil === 0 ? '🔴 AUJOURD\'HUI'
        : evt.daysUntil <= 3 ? `🟠 dans ${evt.daysUntil}j`
        : `dans ${evt.daysUntil}j`;
      let line = `- **${evt.name}** — ${urgency}`;
      if (evt.giftIdea) line += ` · Idées : ${evt.giftIdea}`;
      lines.push(line);
    }
    lines.push('');
    lines.push('**Instructions :** Si le client parle de cadeau, de surprise, ou d\'un événement proche, utilise ces dates pour proposer proactivement. Si un événement est dans moins de 3 jours, mentionne-le naturellement ("D\'ailleurs, [fête] c\'est dans X jours — besoin d\'une idée ?"). Ne force pas si le sujet est différent.');
  }

  // Jour de la semaine context
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 5) {
    lines.push('\n**C\'est vendredi** — les clients cherchent souvent des plans pour ce week-end. Sois proactif sur les suggestions immédiates.');
  } else if (dayOfWeek === 6 || dayOfWeek === 0) {
    lines.push('\n**C\'est le week-end** — propositions immédiates (brunch, sortie, activité aujourd\'hui/demain).');
  }

  // Heure du jour context
  const hour = now.getHours();
  if (hour >= 17 && hour <= 21) {
    lines.push('**Soirée** — les clients cherchent peut-être un restaurant, un bar, une sortie pour ce soir.');
  } else if (hour >= 11 && hour <= 13) {
    lines.push('**Midi** — si le client est en ville, proposer un déjeuner / brunch.');
  }

  return {
    dateTimeBlock: lines.join('\n'),
    upcomingEvents: upcoming,
  };
}
