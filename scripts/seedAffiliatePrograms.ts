/**
 * Seed 22 affiliate programs in DB
 * Run: npx tsx scripts/seedAffiliatePrograms.ts
 */
import { getDb } from "../server/db";
import { affiliatePrograms } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const programs = [
  // HÔTELS
  { name: "Booking.com", slug: "booking", category: "hotel", baseUrl: "https://www.booking.com", commissionRate: "25-40% de la commission Booking", cookieDuration: "30 jours", urlTemplate: "https://www.booking.com/searchresults.html?ss={query}&aid={affiliateId}", priority: 1 },
  { name: "Expedia", slug: "expedia", category: "hotel", baseUrl: "https://www.expedia.fr", commissionRate: "2-6%", cookieDuration: "30 jours", urlTemplate: "https://www.expedia.fr/Hotel-Search?destination={query}&affcid={affiliateId}", priority: 2 },
  { name: "Hotels.com", slug: "hotels-com", category: "hotel", baseUrl: "https://fr.hotels.com", commissionRate: "4-6%", cookieDuration: "30 jours", priority: 3 },
  { name: "Agoda", slug: "agoda", category: "hotel", baseUrl: "https://www.agoda.com", commissionRate: "5-7%", cookieDuration: "30 jours", priority: 4 },
  { name: "TravelPayouts", slug: "travelpayouts", category: "hotel", baseUrl: "https://www.travelpayouts.com", commissionRate: "3-8%", cookieDuration: "30 jours", priority: 5 },
  { name: "Mr & Mrs Smith", slug: "mr-mrs-smith", category: "hotel", baseUrl: "https://www.mrandmrssmith.com", commissionRate: "5%", cookieDuration: "30 jours", priority: 6 },
  { name: "Small Luxury Hotels", slug: "slh", category: "hotel", baseUrl: "https://www.slh.com", commissionRate: "5%", cookieDuration: "30 jours", priority: 7 },
  { name: "Hilton", slug: "hilton", category: "hotel", baseUrl: "https://www.hilton.com", commissionRate: "4-6%", cookieDuration: "30 jours", priority: 8 },
  { name: "Accor", slug: "accor", category: "hotel", baseUrl: "https://all.accor.com", commissionRate: "3-5%", cookieDuration: "30 jours", priority: 9 },
  { name: "Lastminute.com", slug: "lastminute", category: "hotel", baseUrl: "https://www.lastminute.com", commissionRate: "Jusqu'à 50€/vente", cookieDuration: "30 jours", priority: 10 },

  // ACTIVITÉS & EXPÉRIENCES
  { name: "GetYourGuide", slug: "getyourguide", category: "activite", baseUrl: "https://www.getyourguide.fr", commissionRate: "8%", cookieDuration: "30 jours", urlTemplate: "https://www.getyourguide.fr/s/?q={query}&partner_id={affiliateId}", priority: 1 },
  { name: "Viator", slug: "viator", category: "activite", baseUrl: "https://www.viator.com", commissionRate: "8%", cookieDuration: "30 jours", priority: 2 },
  { name: "Klook", slug: "klook", category: "activite", baseUrl: "https://www.klook.com", commissionRate: "3-5%", cookieDuration: "30 jours", priority: 3 },
  { name: "Fever", slug: "fever", category: "activite", baseUrl: "https://ffrr.io", commissionRate: "Variable", cookieDuration: "Variable", priority: 4 },
  { name: "Airbnb Experiences", slug: "airbnb-exp", category: "activite", baseUrl: "https://www.airbnb.fr/experiences", commissionRate: "Variable", cookieDuration: "Variable", priority: 5 },

  // RESTAURANTS
  { name: "TheFork", slug: "thefork", category: "restaurant", baseUrl: "https://www.thefork.fr", commissionRate: "Commission par réservation", cookieDuration: "30 jours", urlTemplate: "https://www.thefork.fr/recherche?q={query}", priority: 1 },

  // TRANSPORT
  { name: "Omio", slug: "omio", category: "transport", baseUrl: "https://www.omio.fr", commissionRate: "2-4%", cookieDuration: "30 jours", priority: 1 },
  { name: "SNCF Connect", slug: "sncf", category: "transport", baseUrl: "https://www.sncf-connect.com", commissionRate: "1-2%", cookieDuration: "7 jours", priority: 2 },

  // VOLS
  { name: "Skyscanner", slug: "skyscanner", category: "vol", baseUrl: "https://www.skyscanner.fr", commissionRate: "CPC", cookieDuration: "30 jours", priority: 1 },
  { name: "Kayak", slug: "kayak", category: "vol", baseUrl: "https://www.kayak.fr", commissionRate: "Jusqu'à 50%", cookieDuration: "30 jours", priority: 2 },

  // LOCATION VOITURE
  { name: "Rentalcars", slug: "rentalcars", category: "location_voiture", baseUrl: "https://www.rentalcars.com", commissionRate: "4-6%", cookieDuration: "30 jours", priority: 1 },
  { name: "Europcar", slug: "europcar", category: "location_voiture", baseUrl: "https://www.europcar.fr", commissionRate: "3-5%", cookieDuration: "30 jours", priority: 2 },
  { name: "Sixt", slug: "sixt", category: "location_voiture", baseUrl: "https://www.sixt.fr", commissionRate: "4-6%", cookieDuration: "30 jours", priority: 3 },
];

async function seed() {
  const db = await getDb();
  console.log("[seedAffiliatePrograms] Seeding 22 affiliate programs...");

  let inserted = 0;
  let skipped = 0;

  for (const p of programs) {
    try {
      await db.execute(sql.raw(`
        INSERT IGNORE INTO affiliate_programs (id, name, slug, category, base_url, commission_rate, cookie_duration, url_template, is_active, priority)
        VALUES (UUID(), ${JSON.stringify(p.name)}, ${JSON.stringify(p.slug)}, ${JSON.stringify(p.category)}, 
                ${p.baseUrl ? JSON.stringify(p.baseUrl) : 'NULL'}, 
                ${p.commissionRate ? JSON.stringify(p.commissionRate) : 'NULL'}, 
                ${p.cookieDuration ? JSON.stringify(p.cookieDuration) : 'NULL'}, 
                ${(p as any).urlTemplate ? JSON.stringify((p as any).urlTemplate) : 'NULL'}, 
                0, ${p.priority})
      `));
      console.log(`  ✓ ${p.name} (${p.category})`);
      inserted++;
    } catch (e: any) {
      console.log(`  ⚠ ${p.name}: ${e.message?.substring(0, 60)}`);
      skipped++;
    }
  }

  console.log(`[seedAffiliatePrograms] Done: ${inserted} inserted, ${skipped} skipped`);
  process.exit(0);
}

seed().catch(console.error);
