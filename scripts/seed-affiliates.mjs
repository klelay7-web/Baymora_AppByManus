import mysql from 'mysql2/promise';

const PARTNERS = [
  // HÉBERGEMENT
  { name: 'Booking.com', slug: 'booking', category: 'hebergement', baseUrl: 'https://www.booking.com', trackingParam: 'aid', affiliateId: '2311236', signupUrl: 'https://www.booking.com/affiliate-program', commissionRate: '4.00', isActive: true, status: 'active' },
  { name: 'Hotels.com', slug: 'hotelscom', category: 'hebergement', baseUrl: 'https://www.hotels.com', trackingParam: 'affid', affiliateId: 'baymora', signupUrl: 'https://affiliate.hotels.com', commissionRate: '4.00', isActive: true, status: 'active' },
  { name: 'Expedia', slug: 'expedia', category: 'hebergement', baseUrl: 'https://www.expedia.fr', trackingParam: 'affcid', affiliateId: 'baymora', signupUrl: 'https://www.expedia.com/affiliate', commissionRate: '3.00', isActive: true, status: 'active' },
  { name: 'Mr & Mrs Smith', slug: 'mrandmrssmith', category: 'hebergement', baseUrl: 'https://www.mrandmrssmith.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.mrandmrssmith.com/affiliate', commissionRate: '6.00', isActive: true, status: 'active' },
  { name: 'Design Hotels', slug: 'designhotels', category: 'hebergement', baseUrl: 'https://www.designhotels.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.designhotels.com/affiliate', commissionRate: '5.00', isActive: true, status: 'active' },
  { name: 'Small Luxury Hotels', slug: 'slh', category: 'hebergement', baseUrl: 'https://www.slh.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.slh.com/affiliate', commissionRate: '5.00', isActive: true, status: 'active' },
  { name: 'Airbnb Luxe', slug: 'airbnbluxe', category: 'hebergement', baseUrl: 'https://www.airbnb.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.airbnb.fr/invite', commissionRate: '3.00', isActive: true, status: 'active' },
  { name: 'Relais & Châteaux', slug: 'relaischateaux', category: 'hebergement', baseUrl: 'https://www.relaischateaux.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.relaischateaux.com/affiliate', commissionRate: '6.00', isActive: true, status: 'active' },

  // GASTRONOMIE
  { name: 'TheFork', slug: 'thefork', category: 'gastronomie', baseUrl: 'https://www.thefork.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.thefork.fr/affiliate', commissionRate: '5.00', isActive: true, status: 'active' },
  { name: 'OpenTable', slug: 'opentable', category: 'gastronomie', baseUrl: 'https://www.opentable.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.opentable.com/affiliate', commissionRate: '4.00', isActive: true, status: 'active' },
  { name: 'Resy', slug: 'resy', category: 'gastronomie', baseUrl: 'https://resy.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://resy.com/affiliate', commissionRate: '4.00', isActive: true, status: 'active' },

  // TRANSPORT
  { name: 'SNCF Connect', slug: 'sncf', category: 'transport', baseUrl: 'https://www.sncf-connect.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.sncf-connect.com/affiliate', commissionRate: '2.00', isActive: true, status: 'active' },
  { name: 'Eurostar', slug: 'eurostar', category: 'transport', baseUrl: 'https://www.eurostar.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.eurostar.com/affiliate', commissionRate: '3.00', isActive: true, status: 'active' },
  { name: 'Trainline', slug: 'trainline', category: 'transport', baseUrl: 'https://www.trainline.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.trainline.fr/affiliate', commissionRate: '3.00', isActive: true, status: 'active' },
  { name: 'Skyscanner', slug: 'skyscanner', category: 'transport', baseUrl: 'https://www.skyscanner.fr', trackingParam: 'associateid', affiliateId: 'baymora', signupUrl: 'https://www.skyscanner.net/affiliates', commissionRate: '3.00', isActive: true, status: 'active' },
  { name: 'Kayak', slug: 'kayak', category: 'transport', baseUrl: 'https://www.kayak.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.kayak.fr/affiliate', commissionRate: '3.00', isActive: true, status: 'active' },
  { name: 'Uber', slug: 'uber', category: 'transport', baseUrl: 'https://www.uber.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.uber.com/affiliate', commissionRate: '2.00', isActive: true, status: 'active' },
  { name: 'Heliair', slug: 'heliair', category: 'transport', baseUrl: 'https://www.heliair.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.heliair.com/affiliate', commissionRate: '8.00', isActive: true, status: 'active' },

  // EXPÉRIENCES
  { name: 'Viator', slug: 'viator', category: 'experience', baseUrl: 'https://www.viator.com', trackingParam: 'mcid', affiliateId: 'baymora', signupUrl: 'https://www.viator.com/affiliate', commissionRate: '8.00', isActive: true, status: 'active' },
  { name: 'GetYourGuide', slug: 'getyourguide', category: 'experience', baseUrl: 'https://www.getyourguide.fr', trackingParam: 'partner_id', affiliateId: 'baymora', signupUrl: 'https://partner.getyourguide.com', commissionRate: '8.00', isActive: true, status: 'active' },
  { name: 'Airbnb Expériences', slug: 'airbnbexp', category: 'experience', baseUrl: 'https://www.airbnb.fr/experiences', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.airbnb.fr/invite', commissionRate: '5.00', isActive: true, status: 'active' },
  { name: 'Fever', slug: 'fever', category: 'experience', baseUrl: 'https://feverup.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://feverup.com/affiliate', commissionRate: '5.00', isActive: true, status: 'active' },

  // BIEN-ÊTRE & SPA
  { name: 'Treatwell', slug: 'treatwell', category: 'bienetre', baseUrl: 'https://www.treatwell.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.treatwell.fr/affiliate', commissionRate: '6.00', isActive: true, status: 'active' },
  { name: 'Spabreaks', slug: 'spabreaks', category: 'bienetre', baseUrl: 'https://www.spabreaks.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.spabreaks.com/affiliate', commissionRate: '7.00', isActive: true, status: 'active' },

  // SHOPPING & LUXE
  { name: 'Net-a-Porter', slug: 'netaporter', category: 'shopping', baseUrl: 'https://www.net-a-porter.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.net-a-porter.com/affiliate', commissionRate: '6.00', isActive: true, status: 'active' },
  { name: 'Farfetch', slug: 'farfetch', category: 'shopping', baseUrl: 'https://www.farfetch.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.farfetch.com/affiliate', commissionRate: '5.00', isActive: true, status: 'active' },

  // YACHTS & JETS
  { name: 'Click&Boat', slug: 'clickandboat', category: 'yacht', baseUrl: 'https://www.clickandboat.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.clickandboat.com/affiliate', commissionRate: '8.00', isActive: true, status: 'active' },
  { name: 'Samboat', slug: 'samboat', category: 'yacht', baseUrl: 'https://www.samboat.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.samboat.fr/affiliate', commissionRate: '8.00', isActive: true, status: 'active' },
  { name: 'PrivateFly', slug: 'privatefly', category: 'jet', baseUrl: 'https://www.privatefly.com', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.privatefly.com/affiliate', commissionRate: '5.00', isActive: true, status: 'active' },

  // ASSURANCE VOYAGE
  { name: 'AXA Travel', slug: 'axatravel', category: 'assurance', baseUrl: 'https://www.axa.fr/assurance-voyage', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.axa.fr/affiliate', commissionRate: '10.00', isActive: true, status: 'active' },
  { name: 'Chapka', slug: 'chapka', category: 'assurance', baseUrl: 'https://www.chapkadirect.fr', trackingParam: 'ref', affiliateId: 'baymora', signupUrl: 'https://www.chapkadirect.fr/affiliate', commissionRate: '12.00', isActive: true, status: 'active' },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let inserted = 0;
  let skipped = 0;

  for (const p of PARTNERS) {
    try {
      await conn.execute(
        `INSERT INTO affiliatePartners (name, slug, category, baseUrl, trackingParam, affiliateId, signupUrl, commissionRate, isActive, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE baseUrl=VALUES(baseUrl), affiliateId=VALUES(affiliateId), signupUrl=VALUES(signupUrl), commissionRate=VALUES(commissionRate), status=VALUES(status)`,
        [p.name, p.slug, p.category, p.baseUrl, p.trackingParam, p.affiliateId, p.signupUrl, p.commissionRate, p.isActive ? 1 : 0, p.status]
      );
      inserted++;
    } catch (e) {
      console.error(`Error inserting ${p.name}:`, e.message);
      skipped++;
    }
  }

  console.log(`✅ ${inserted} partenaires insérés/mis à jour, ${skipped} erreurs`);
  await conn.end();
}

seed().catch(console.error);
