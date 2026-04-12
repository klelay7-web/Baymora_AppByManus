/**
 * EVENT MAINTENANCE SERVICE — Baymora V7.3
 *
 * Re-seed automatique des événements avec dates glissantes.
 * Vérifie toutes les heures si des événements sont passés et les renouvelle.
 *
 * Déclenchement : au démarrage du serveur + cron toutes les heures
 */

import { getDb, getMysqlConnOpts } from "../db";
import { events } from "../../drizzle/schema";
import { lt, count } from "drizzle-orm";

// ─── Templates d'événements (dates glissantes) ───────────────────────────────

type EventCategory =
  | "soiree"
  | "concert"
  | "expo"
  | "degustation"
  | "spectacle"
  | "festival"
  | "sport"
  | "diner_secret"
  | "vip"
  | "afterwork"
  | "brunch"
  | "marche"
  | "autre";

interface EventTemplate {
  title: string;
  description: string;
  category: EventCategory;
  city: string;
  venueName: string;
  venueAddress: string;
  price: string | null;
  imageUrl: string | null;
  daysFromNow: number;
  timeStart: string;
  timeEnd: string;
  isVip: boolean;
  isMembersOnly: boolean;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  // Bordeaux
  {
    title: "Dégustation Grands Crus — Château Margaux",
    description: "Soirée exclusive de dégustation des millésimes d'exception du Château Margaux. Accès privé aux caves historiques, rencontre avec le maître de chai.",
    category: "degustation",
    city: "Bordeaux",
    venueName: "Château Margaux",
    venueAddress: "33460 Margaux, Gironde",
    price: "180€",
    imageUrl: null,
    daysFromNow: 0,
    timeStart: "19:00",
    timeEnd: "22:00",
    isVip: true,
    isMembersOnly: true,
  },
  {
    title: "Soirée Jazz & Tapas — Le Petit Commerce",
    description: "Jazz live dans l'une des meilleures tables de Bordeaux. Tapas de saison, vins naturels de la région, ambiance intime et feutrée.",
    category: "soiree",
    city: "Bordeaux",
    venueName: "Le Petit Commerce",
    venueAddress: "22 Rue Parlement Saint-Pierre, 33000 Bordeaux",
    price: "45€",
    imageUrl: null,
    daysFromNow: 0,
    timeStart: "20:00",
    timeEnd: "23:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Rooftop Sunset — Darwin Ecosystème",
    description: "Coucher de soleil sur la Garonne depuis le rooftop du Darwin. DJ set, cocktails artisanaux, food trucks gastronomiques.",
    category: "soiree",
    city: "Bordeaux",
    venueName: "Darwin Ecosystème",
    venueAddress: "87 Quai des Queyries, 33100 Bordeaux",
    price: "25€",
    imageUrl: null,
    daysFromNow: 1,
    timeStart: "18:00",
    timeEnd: "22:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Yoga Sunrise — Jardin Public",
    description: "Séance de yoga au lever du soleil dans le Jardin Public de Bordeaux. Instructeur certifié, tapis fournis, thé offert.",
    category: "sport",
    city: "Bordeaux",
    venueName: "Jardin Public",
    venueAddress: "Cours de Verdun, 33000 Bordeaux",
    price: "15€",
    imageUrl: null,
    daysFromNow: 1,
    timeStart: "07:00",
    timeEnd: "08:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Visite Privée — Cité du Vin",
    description: "Visite guidée en avant-première de l'exposition temporaire. Accès aux collections permanentes, dégustation commentée en terrasse panoramique.",
    category: "expo",
    city: "Bordeaux",
    venueName: "Cité du Vin",
    venueAddress: "134 Quai de Bacalan, 33300 Bordeaux",
    price: "35€",
    imageUrl: null,
    daysFromNow: 2,
    timeStart: "10:00",
    timeEnd: "12:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Dîner Étoilé — Le Pressoir d'Argent",
    description: "Table d'exception au Pressoir d'Argent. Menu dégustation 7 services, accord mets-vins par le sommelier, vue sur la Grand-Place.",
    category: "diner_secret",
    city: "Bordeaux",
    venueName: "Le Pressoir d'Argent",
    venueAddress: "2-5 Place de la Comédie, 33000 Bordeaux",
    price: "250€",
    imageUrl: null,
    daysFromNow: 2,
    timeStart: "20:00",
    timeEnd: "23:00",
    isVip: true,
    isMembersOnly: true,
  },
  {
    title: "Marché Nocturne des Capucins",
    description: "Le marché des Capucins s'illumine pour une soirée exceptionnelle. Producteurs locaux, huîtres fraîches, vins de Bordeaux, animations musicales.",
    category: "marche",
    city: "Bordeaux",
    venueName: "Marché des Capucins",
    venueAddress: "Place des Capucins, 33800 Bordeaux",
    price: "Entrée libre",
    imageUrl: null,
    daysFromNow: 3,
    timeStart: "18:00",
    timeEnd: "22:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Croisière Coucher de Soleil — Garonne",
    description: "Croisière privée sur la Garonne au coucher du soleil. Champagne, canapés, vue sur les quais classés UNESCO.",
    category: "vip",
    city: "Bordeaux",
    venueName: "Quai des Chartrons",
    venueAddress: "Quai des Chartrons, 33000 Bordeaux",
    price: "75€",
    imageUrl: null,
    daysFromNow: 4,
    timeStart: "19:00",
    timeEnd: "21:00",
    isVip: true,
    isMembersOnly: false,
  },
  // Paris
  {
    title: "Vernissage Privé — Galerie Perrotin",
    description: "Vernissage en avant-première d'un artiste contemporain international. Champagne, rencontre avec l'artiste, oeuvres en exclusivité.",
    category: "expo",
    city: "Paris",
    venueName: "Galerie Perrotin",
    venueAddress: "76 Rue de Turenne, 75003 Paris",
    price: "Entrée libre",
    imageUrl: null,
    daysFromNow: 0,
    timeStart: "18:00",
    timeEnd: "21:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Dîner Secret — Chef Étoilé Surprise",
    description: "Dîner clandestin dans un lieu secret parisien. Chef étoilé, menu unique, 12 convives maximum. L'adresse révélée 2h avant.",
    category: "diner_secret",
    city: "Paris",
    venueName: "Lieu secret — Paris 8e",
    venueAddress: "Paris 8e arrondissement",
    price: "320€",
    imageUrl: null,
    daysFromNow: 1,
    timeStart: "20:00",
    timeEnd: "00:00",
    isVip: true,
    isMembersOnly: true,
  },
  {
    title: "Rooftop Le Perchoir — Soirée Privée",
    description: "Soirée exclusive au Perchoir Ménilmontant. Vue panoramique sur Paris, DJ set, cocktails signature, accès VIP sans file d'attente.",
    category: "soiree",
    city: "Paris",
    venueName: "Le Perchoir",
    venueAddress: "14 Rue Crespin du Gast, 75011 Paris",
    price: "30€",
    imageUrl: null,
    daysFromNow: 1,
    timeStart: "21:00",
    timeEnd: "02:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Visite Nocturne — Musée d'Orsay",
    description: "Visite privée du Musée d'Orsay après fermeture. Accès aux galeries impressionnistes, guide expert, champagne devant le Monet.",
    category: "expo",
    city: "Paris",
    venueName: "Musée d'Orsay",
    venueAddress: "1 Rue de la Légion d'Honneur, 75007 Paris",
    price: "120€",
    imageUrl: null,
    daysFromNow: 3,
    timeStart: "21:00",
    timeEnd: "23:00",
    isVip: true,
    isMembersOnly: false,
  },
  {
    title: "Masterclass Cuisine — École Ferrandi",
    description: "Masterclass avec un chef Ferrandi. Cuisine française gastronomique, techniques professionnelles, déjeuner des préparations.",
    category: "autre",
    city: "Paris",
    venueName: "École Ferrandi",
    venueAddress: "28 Rue de l'Abbé Grégoire, 75006 Paris",
    price: "145€",
    imageUrl: null,
    daysFromNow: 4,
    timeStart: "09:00",
    timeEnd: "13:00",
    isVip: false,
    isMembersOnly: false,
  },
  {
    title: "Soirée Opéra — Palais Garnier",
    description: "Représentation exceptionnelle à l'Opéra Garnier. Places de premier rang, champagne à l'entracte dans le Grand Foyer.",
    category: "spectacle",
    city: "Paris",
    venueName: "Opéra Garnier",
    venueAddress: "Place de l'Opéra, 75009 Paris",
    price: "280€",
    imageUrl: null,
    daysFromNow: 5,
    timeStart: "19:00",
    timeEnd: "22:00",
    isVip: true,
    isMembersOnly: false,
  },
  {
    title: "Afterwork Rooftop — Terrass Hotel Montmartre",
    description: "Afterwork avec vue imprenable sur Montmartre et la Tour Eiffel. Cocktails, DJ ambient, finger food gastronomique.",
    category: "afterwork",
    city: "Paris",
    venueName: "Terrass Hotel",
    venueAddress: "12-14 Rue Joseph de Maistre, 75018 Paris",
    price: "20€",
    imageUrl: null,
    daysFromNow: 6,
    timeStart: "18:00",
    timeEnd: "22:00",
    isVip: false,
    isMembersOnly: false,
  },
];

// ─── Logique de re-seed ───────────────────────────────────────────────────────

function getEventDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

export async function runEventMaintenance(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.log("[EventMaintenance] DB non disponible, maintenance ignorée");
    return;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compter les événements passés
    const pastEventsResult = await db
      .select({ count: count() })
      .from(events)
      .where(lt(events.date, today));

    const pastCount = Number(pastEventsResult[0]?.count ?? 0);
    console.log(`[EventMaintenance] ${pastCount} événements passés détectés`);

    if (pastCount === 0) {
      console.log("[EventMaintenance] Aucun événement passé, rien à faire");
      return;
    }

    // Supprimer les événements passés
    await db.delete(events).where(lt(events.date, today));
    console.log("[EventMaintenance] Événements passés supprimés");

    // Re-seeder avec des dates fraîches
    const newEvents = EVENT_TEMPLATES.map(template => ({
      title: template.title,
      description: template.description,
      category: template.category,
      city: template.city,
      venueName: template.venueName,
      venueAddress: template.venueAddress,
      price: template.price,
      imageUrl: template.imageUrl,
      date: getEventDate(template.daysFromNow),
      timeStart: template.timeStart,
      timeEnd: template.timeEnd,
      isVip: template.isVip,
      isMembersOnly: template.isMembersOnly,
      source: "baymora-seed",
    }));

    // Insérer par batch de 5
    for (let i = 0; i < newEvents.length; i += 5) {
      const batch = newEvents.slice(i, i + 5);
      await db.insert(events).values(batch);
    }

    console.log(`[EventMaintenance] ${newEvents.length} événements re-seedés avec dates fraîches`);
  } catch (error) {
    console.error("[EventMaintenance] Erreur:", error);
  }
}

// ─── Reset mensuel parcours + radar ───────────────────────────────────────────────

async function runMonthlyReset(): Promise<void> {
  try {
    const mysql = await import('mysql2/promise');
    const conn = await (mysql.default).createConnection(getMysqlConnOpts());
    try {
      await conn.execute(
        `UPDATE users SET monthlyParcours = 0, monthlyParcoursReset = NOW() WHERE monthlyParcoursReset IS NULL OR DATEDIFF(NOW(), monthlyParcoursReset) >= 30`
      );
      await conn.execute(`UPDATE users SET radar_searches_used = 0`);
      console.log("[MonthlyReset] monthlyParcours + radarSearchesUsed réinitialisés");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.error("[MonthlyReset] Erreur:", err);
  }
}

// ─── Démarrage du cron (toutes les heures) ───────────────────────────────────────────────

export function startEventMaintenanceCron(): void {
  console.log("[EventMaintenance] Cron démarré — vérification toutes les heures");

  // Première exécution au démarrage (après 30s)
  setTimeout(() => {
    runEventMaintenance().catch(err =>
      console.error("[EventMaintenance] Erreur au démarrage:", err)
    );
  }, 30000);

  // Cron toutes les heures
  setInterval(() => {
    runEventMaintenance().catch(err =>
      console.error("[EventMaintenance] Erreur cron:", err)
    );
  }, 60 * 60 * 1000);

  // Cron mensuel (toutes les 24h, vérifie si le 1er du mois)
  setInterval(() => {
    const now = new Date();
    if (now.getDate() === 1 && now.getHours() === 0) {
      runMonthlyReset().catch(err =>
        console.error("[MonthlyReset] Erreur cron:", err)
      );
    }
  }, 60 * 60 * 1000); // vérifie toutes les heures
}