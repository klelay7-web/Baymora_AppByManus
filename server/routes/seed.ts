/**
 * SEED DATA — Créer des comptes test, parcours, fiches pour simuler l'activité
 *
 * Usage : POST /api/admin/seed { secret, action }
 * Actions : 'users' | 'trips' | 'venues' | 'all'
 */

import { Router } from 'express';
import { prisma } from '../db';
import { PLANS } from '../types';
import crypto from 'crypto';

const router = Router();

// ─── Middleware secret ────────────────────────────────────────────────────────

const requireSecret = (req: any, res: any, next: any) => {
  const secret = req.body?.secret || req.headers['x-admin-secret'];
  if (secret?.trim() !== (process.env.ADMIN_SECRET || '').trim()) {
    res.status(403).json({ error: 'Secret invalide' }); return;
  }
  next();
};

// ─── Données de seed ─────────────────────────────────────────────────────────

const SEED_USERS = [
  // France
  { pseudo: 'Sophie_Paris', prenom: 'Sophie', email: 'sophie.test@baymora.com', city: 'Paris', country: 'FR', circle: 'premium' },
  { pseudo: 'Marc_Lyon', prenom: 'Marc', email: 'marc.test@baymora.com', city: 'Lyon', country: 'FR', circle: 'prive' },
  { pseudo: 'Camille_Nice', prenom: 'Camille', email: 'camille.test@baymora.com', city: 'Nice', country: 'FR', circle: 'premium' },
  { pseudo: 'Lucas_Bordeaux', prenom: 'Lucas', email: 'lucas.test@baymora.com', city: 'Bordeaux', country: 'FR', circle: 'decouverte' },
  { pseudo: 'Emma_Marseille', prenom: 'Emma', email: 'emma.test@baymora.com', city: 'Marseille', country: 'FR', circle: 'premium' },
  // US
  { pseudo: 'James_NYC', prenom: 'James', email: 'james.test@baymora.com', city: 'New York', country: 'US', circle: 'prive' },
  { pseudo: 'Sarah_LA', prenom: 'Sarah', email: 'sarah.test@baymora.com', city: 'Los Angeles', country: 'US', circle: 'premium' },
  { pseudo: 'Mike_Miami', prenom: 'Mike', email: 'mike.test@baymora.com', city: 'Miami', country: 'US', circle: 'premium' },
  { pseudo: 'Emily_SF', prenom: 'Emily', email: 'emily.test@baymora.com', city: 'San Francisco', country: 'US', circle: 'decouverte' },
  { pseudo: 'David_Aspen', prenom: 'David', email: 'david.test@baymora.com', city: 'Aspen', country: 'US', circle: 'prive' },
];

const SEED_TRIPS = [
  {
    title: 'Week-end romantique à Paris', destination: 'Paris', duration: '3 jours', budget: '2 500€', travelers: 2,
    visibility: 'public', isVerified: true, verifiedNotes: 'Incroyable ! La vue depuis le rooftop du Terrass Hotel est à couper le souffle. Le dîner au Cinq a été l\'expérience gastronomique de notre vie.',
    planData: { destination: 'Paris', dates: 'Week-end', duration: '3 jours', travelers: 2, budget: '2 500€',
      hotels: [{ name: 'Terrass Hotel', price: '280€/nuit', status: 'selected' }],
      restaurants: [{ name: 'Le Cinq', stars: 3, price: '250€/couvert' }, { name: 'Pink Mamma', price: '35€/pers' }],
      activities: [{ name: 'Croisière Seine privée', price: '120€/pers' }, { name: 'Montmartre au coucher du soleil' }],
    },
  },
  {
    title: 'NYC en couple — 7 jours', destination: 'New York', duration: '7 jours', budget: '6 000€', travelers: 2,
    visibility: 'public', isVerified: true, verifiedNotes: 'Central Park en automne, c\'est magique. Le rooftop du 1 Hotel Brooklyn Bridge offre LA vue sur Manhattan.',
    planData: { destination: 'New York', duration: '7 jours', travelers: 2, budget: '6 000€',
      hotels: [{ name: '1 Hotel Brooklyn Bridge', price: '350$/nuit', status: 'selected' }],
      restaurants: [{ name: 'Le Bernardin', stars: 3 }, { name: 'Joe\'s Pizza', price: '5$' }],
      activities: [{ name: 'Helicopter tour', price: '250$/pers' }, { name: 'Broadway show' }],
    },
  },
  {
    title: 'Saint-Tropez VIP — 5 jours', destination: 'Saint-Tropez', duration: '5 jours', budget: '12 000€', travelers: 4,
    visibility: 'public', isVerified: false,
    planData: { destination: 'Saint-Tropez', duration: '5 jours', travelers: 4, budget: '12 000€',
      hotels: [{ name: 'Hôtel Byblos', price: '650€/nuit' }],
      restaurants: [{ name: 'Club 55', price: '80€/pers' }, { name: 'La Vague d\'Or', stars: 3 }],
      activities: [{ name: 'Location yacht journée', price: '2 500€' }, { name: 'Beach club Nikki Beach' }],
    },
  },
  {
    title: 'Ski premium à Courchevel', destination: 'Courchevel', duration: '5 jours', budget: '8 000€', travelers: 2,
    visibility: 'public', isVerified: true, verifiedNotes: 'Le chalet de l\'Hôtel Barrière Les Neiges est exceptionnel. Pistes quasi privées le matin avant 9h.',
    planData: { destination: 'Courchevel', duration: '5 jours', travelers: 2, budget: '8 000€',
      hotels: [{ name: 'Les Neiges Courchevel', price: '800€/nuit' }],
      restaurants: [{ name: 'Le 1947', stars: 3 }, { name: 'La Table de l\'Ours' }],
      activities: [{ name: 'Cours ski privé', price: '400€/session' }, { name: 'Spa altitude' }],
    },
  },
  {
    title: 'Mykonos entre amis — 4 jours', destination: 'Mykonos', duration: '4 jours', budget: '3 500€', travelers: 6,
    visibility: 'public', isVerified: false,
    planData: { destination: 'Mykonos', duration: '4 jours', travelers: 6, budget: '3 500€/pers',
      hotels: [{ name: 'Cavo Tagoo', price: '400€/nuit' }],
      restaurants: [{ name: 'Scorpios', price: '60€/pers' }, { name: 'Nammos' }],
      activities: [{ name: 'Boat trip Delos', price: '80€/pers' }, { name: 'Beach club Principote' }],
    },
  },
  {
    title: 'Tokyo découverte — 10 jours', destination: 'Tokyo', duration: '10 jours', budget: '4 500€', travelers: 2,
    visibility: 'public', isVerified: true, verifiedNotes: 'Shibuya Crossing de nuit, les ramen de Fuunji, le temple Meiji au lever du soleil — des moments gravés à vie.',
    planData: { destination: 'Tokyo', duration: '10 jours', travelers: 2, budget: '4 500€',
      hotels: [{ name: 'Park Hyatt Tokyo', price: '380€/nuit' }],
      restaurants: [{ name: 'Sukiyabashi Jiro', stars: 3 }, { name: 'Fuunji Ramen', price: '8€' }],
      activities: [{ name: 'Tea ceremony privée', price: '100€' }, { name: 'Tsukiji Market tour' }],
    },
  },
  {
    title: 'Maldives all-inclusive luxe', destination: 'Maldives', duration: '7 jours', budget: '15 000€', travelers: 2,
    visibility: 'public', isVerified: false,
    planData: { destination: 'Maldives', duration: '7 jours', travelers: 2, budget: '15 000€',
      hotels: [{ name: 'Soneva Fushi', price: '1 800€/nuit' }],
      restaurants: [{ name: 'Out of the Blue (sous-marin)', price: '300€/pers' }],
      activities: [{ name: 'Snorkeling privé', price: '200€' }, { name: 'Sunset dolphin cruise' }],
    },
  },
  {
    title: 'Dubai business + lifestyle', destination: 'Dubai', duration: '4 jours', budget: '5 000€', travelers: 1,
    visibility: 'public', isVerified: false,
    planData: { destination: 'Dubai', duration: '4 jours', travelers: 1, budget: '5 000€',
      hotels: [{ name: 'Burj Al Arab', price: '1 200€/nuit' }],
      restaurants: [{ name: 'Nobu Dubai', price: '150€/pers' }, { name: 'La Petite Maison' }],
      activities: [{ name: 'Desert safari VIP', price: '300€' }, { name: 'Dubai Mall shopping' }],
    },
  },
];

const SEED_VENUES = [
  { name: 'Hôtel Byblos', type: 'hotel', city: 'Saint-Tropez', country: 'FR', description: 'Palace mythique de la Côte d\'Azur depuis 1967. Le rendez-vous de la jet-set internationale.', insiderTips: 'Demander la chambre 12 pour la vue mer. Le barman Éric fait les meilleurs cocktails de la Riviera.', rating: 4.8, priceLevel: 4, priceFrom: 450, ambiance: 'Méditerranéen chic', tags: ['Palace', 'Piscine', 'Spa', 'Vue mer'], testedByBaymora: true },
  { name: 'La Vague d\'Or', type: 'restaurant', city: 'Saint-Tropez', country: 'FR', description: 'Restaurant 3 étoiles du chef Arnaud Donckele. Cuisine méditerranéenne sublimée.', insiderTips: 'Réserver 2 mois à l\'avance minimum. Le menu dégustation du soir est une expérience inoubliable.', rating: 4.9, priceLevel: 4, priceFrom: 250, ambiance: 'Gastronomie étoilée', tags: ['3 étoiles', 'Vue mer', 'Gastronomie'], testedByBaymora: true },
  { name: 'Club 55', type: 'beach', city: 'Saint-Tropez', country: 'FR', description: 'Le beach club le plus mythique de Pampelonne. Ambiance décontractée-chic depuis 1955.', insiderTips: 'Arriver avant 12h pour avoir les meilleurs transats. Commandez la salade niçoise, c\'est leur signature.', rating: 4.5, priceLevel: 3, priceFrom: 80, ambiance: 'Beach club décontracté chic', tags: ['Beach club', 'Déjeuner', 'Plage'], testedByBaymora: true },
  { name: 'Le Bernardin', type: 'restaurant', city: 'New York', country: 'US', description: 'Institution new-yorkaise du chef Éric Ripert. Les meilleurs fruits de mer de Manhattan.', insiderTips: 'Réservez via Resy exactement 30 jours à l\'avance à minuit. Bar seating sans résa pour le lunch.', rating: 4.8, priceLevel: 4, priceFrom: 180, ambiance: 'Fine dining élégant', tags: ['3 étoiles', 'Fruits de mer', 'Fine dining'], testedByBaymora: false },
  { name: 'The Mark Hotel', type: 'hotel', city: 'New York', country: 'US', description: 'L\'hôtel le plus chic de l\'Upper East Side. Design Jean-Georges Vongerichten au restaurant.', insiderTips: 'Le concierge peut débloquer des réservations impossibles. Mentionnez que vous êtes client de l\'hôtel.', rating: 4.7, priceLevel: 4, priceFrom: 600, ambiance: 'Upper East Side luxe', tags: ['Design', 'Restaurant étoilé', 'Central Park'], testedByBaymora: false },
  { name: 'Terrass Hotel', type: 'hotel', city: 'Paris', country: 'FR', description: 'Rooftop avec la plus belle vue de Paris sur la Tour Eiffel et le Sacré-Cœur.', insiderTips: 'Le rooftop bar est ouvert aux non-résidents. Meilleur moment: coucher de soleil, arriver à 19h.', rating: 4.5, priceLevel: 3, priceFrom: 280, ambiance: 'Rooftop romantique', tags: ['Rooftop', 'Vue Tour Eiffel', 'Montmartre'], testedByBaymora: true },
  { name: 'Cavo Tagoo', type: 'hotel', city: 'Mykonos', country: 'GR', description: 'L\'hôtel le plus Instagrammable de Mykonos. Infinity pool face au coucher de soleil.', insiderTips: 'La suite Cave avec piscine privée est la meilleure. Réservez 3 mois à l\'avance pour juillet-août.', rating: 4.7, priceLevel: 4, priceFrom: 500, ambiance: 'Cyclades luxe minimaliste', tags: ['Infinity pool', 'Vue sunset', 'Design'], testedByBaymora: false },
  { name: 'Les Neiges Courchevel', type: 'hotel', city: 'Courchevel', country: 'FR', description: 'Palace 5 étoiles au pied des pistes. Spa Diane Barrière exceptionnel.', insiderTips: 'Ski aux pieds le matin avant 9h = pistes quasi privées. Le restaurant Le 1947 est 3 étoiles.', rating: 4.8, priceLevel: 4, priceFrom: 800, ambiance: 'Montagne palace', tags: ['Ski aux pieds', 'Spa', '3 étoiles', 'Palace'], testedByBaymora: true },
];

// ─── POST /api/admin/seed ────────────────────────────────────────────────────

router.post('/', requireSecret, async (req, res) => {
  try {
    const { action = 'all' } = req.body;
    const results: any = {};

    // ── Seed users ────────────────────────────────────────────────────────────
    if (action === 'users' || action === 'all') {
      const created: string[] = [];
      for (const u of SEED_USERS) {
        const exists = await prisma.user.findFirst({ where: { email: u.email } });
        if (exists) { created.push(`${u.pseudo} (existait déjà)`); continue; }

        const plan = PLANS[u.circle] || PLANS.decouverte;
        await prisma.user.create({
          data: {
            pseudo: u.pseudo,
            prenom: u.prenom,
            email: u.email,
            mode: 'signature',
            circle: u.circle,
            creditsUsed: Math.floor(Math.random() * 50),
            creditsLimit: plan.creditsLimit,
            perplexityUsed: 0,
            perplexityLimit: plan.perplexityLimit,
            messagesUsed: Math.floor(Math.random() * 30),
            messagesLimit: plan.creditsLimit,
            creditsResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
            clubPoints: Math.floor(Math.random() * 2000),
            preferences: { homeCity: u.city, country: u.country },
          },
        });
        created.push(u.pseudo);
      }
      results.users = { created: created.length, details: created };
    }

    // ── Seed trips ───────────────────────────────────────────────────────────
    if (action === 'trips' || action === 'all') {
      const users = await prisma.user.findMany({ where: { email: { contains: 'test@baymora.com' } }, select: { id: true, pseudo: true } });
      if (users.length === 0) { results.trips = { error: 'Créez d\'abord les users (action: users)' }; }
      else {
        const created: string[] = [];
        for (const t of SEED_TRIPS) {
          const user = users[Math.floor(Math.random() * users.length)];
          const shareCode = `${t.destination!.toUpperCase().replace(/\s+/g, '-').substring(0, 10)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          const slug = `${t.destination!.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${t.duration!.replace(/\s/g, '')}-${Date.now().toString(36)}`;

          await prisma.trip.create({
            data: {
              userId: user.id,
              title: t.title,
              destination: t.destination,
              duration: t.duration,
              budget: t.budget,
              travelers: t.travelers,
              planData: t.planData,
              status: t.isVerified ? 'verified' : 'planning',
              visibility: t.visibility,
              isPublic: true,
              isVerified: t.isVerified || false,
              verifiedAt: t.isVerified ? new Date() : null,
              verifiedNotes: t.verifiedNotes || null,
              verifiedPhotos: [],
              shareCode,
              seoSlug: slug,
              viewCount: Math.floor(Math.random() * 500) + 50,
              forkCount: Math.floor(Math.random() * 20),
              usedAsTurnkey: Math.floor(Math.random() * 10),
              shareCount: Math.floor(Math.random() * 30),
            },
          });
          created.push(`${t.title} (${user.pseudo})`);
        }
        results.trips = { created: created.length, details: created };
      }
    }

    // ── Seed venues ──────────────────────────────────────────────────────────
    if (action === 'venues' || action === 'all') {
      const created: string[] = [];
      for (const v of SEED_VENUES) {
        const exists = await prisma.atlasVenue.findFirst({ where: { name: v.name, city: v.city } });
        if (exists) { created.push(`${v.name} (existait déjà)`); continue; }

        await prisma.atlasVenue.create({
          data: {
            ...v,
            status: 'published',
            createdBy: 'seed',
            currency: 'EUR',
            affiliateType: v.testedByBaymora ? 'terrain' : 'auto',
            photos: [],
          },
        });
        created.push(`${v.name} (${v.city})`);
      }
      results.venues = { created: created.length, details: created };
    }

    // ── Seed SEO guides ────────────────────────────────────────────────────
    if (action === 'guides' || action === 'all') {
      const SEED_GUIDES = [
        {
          slug: 'top-10-restaurants-paris', title: 'Les 10 meilleurs restaurants à Paris', subtitle: 'Sélection Baymora — testés et approuvés',
          city: 'Paris', country: 'FR', category: 'restaurants', coverEmoji: '🍽️', previewCount: 3, unlockPrice: 490, unlockPoints: 500, minPlan: 'premium',
          metaTitle: 'Top 10 restaurants Paris 2026 — Sélection Baymora', metaDescription: 'Découvrez les 10 meilleurs restaurants de Paris sélectionnés par les experts Baymora. Étoilés, bistrots, tables cachées.',
          description: 'De la table étoilée au bistrot confidentiel, voici notre sélection des 10 restaurants incontournables de Paris. Chaque adresse a été testée et approuvée par l\'équipe Baymora.',
          tags: ['Paris', 'restaurants', 'gastronomie', 'étoilé', 'bistrot'],
          items: [
            { name: 'Le Cinq', type: 'restaurant', address: '31 Avenue George V', description: '3 étoiles au Four Seasons. Cuisine française sublimée par le chef Christian Le Squer.', insiderTip: 'Menu déjeuner à 145€ — même qualité que le soir à 350€.', price: '145-350€/pers', rating: 4.9 },
            { name: 'Septime', type: 'restaurant', address: '80 Rue de Charonne', description: 'Le temple du néo-bistrot parisien. Menu unique, produits exceptionnels.', insiderTip: 'Réservation en ligne exactement 3 semaines avant à midi.', price: '95€ menu', rating: 4.7 },
            { name: 'Clover Grill', type: 'restaurant', address: '6 Rue Bailleul', description: 'Le grill de Jean-François Piège. Viandes d\'exception, ambiance décontractée.', insiderTip: 'La côte de bœuf pour 2 est le plat signature. Arrivez à 19h30.', price: '60-90€/pers', rating: 4.6 },
            { name: 'L\'Ami Jean', type: 'restaurant', address: '27 Rue Malar', description: 'Cuisine basque généreuse dans le 7e. Le riz au lait est légendaire.', insiderTip: 'Venez affamé. Les portions sont énormes.', price: '45-70€/pers', rating: 4.5, baymoraPrice: '40€/pers' },
            { name: 'Pink Mamma', type: 'restaurant', address: '20bis Rue de Douai', description: 'La trattoria la plus instagrammable de Paris. 4 étages de folie italienne.', insiderTip: 'File d\'attente toujours, mais le 4e étage est le plus beau.', price: '25-40€/pers', rating: 4.3 },
            { name: 'Le Baratin', type: 'restaurant', address: '3 Rue Jouye-Rouve', description: 'Bistrot nature à Belleville. La chef Raquel Carena est une institution.', insiderTip: 'Pas de réservation. Venez à 19h tapantes.', price: '35-55€/pers', rating: 4.5 },
            { name: 'Frenchie', type: 'restaurant', address: '5-6 Rue du Nil', description: 'Gregory Marchand a créé un empire : resto, bar à vins, take-away.', insiderTip: 'Le bar à vins en face accepte les sans-résa.', price: '78€ menu', rating: 4.6 },
            { name: 'Chez Janou', type: 'restaurant', address: '2 Rue Roger Verlomme', description: 'La plus grande carte de pastis de Paris + mousse au chocolat légendaire.', insiderTip: 'La mousse au chocolat est servie dans un saladier. Commandez-la.', price: '30-45€/pers', rating: 4.4 },
            { name: 'Le Comptoir du Panthéon', type: 'restaurant', address: '5 Rue Soufflot', description: 'Brasserie parisienne classique face au Panthéon. Terrasse exceptionnelle.', insiderTip: 'La terrasse été avec vue Panthéon = spot parfait.', price: '25-50€/pers', rating: 4.3 },
            { name: 'Le Grand Véfour', type: 'restaurant', address: '17 Rue du Beaujolais', description: '2 étoiles dans le Palais-Royal. L\'un des plus beaux décors de Paris (1784).', insiderTip: 'Demandez la table de Napoléon. Menu déjeuner à 115€.', price: '115-310€/pers', rating: 4.8 },
          ],
        },
        {
          slug: 'best-beach-clubs-saint-tropez', title: 'Les meilleurs beach clubs de Saint-Tropez', subtitle: 'Été 2026 — La sélection Baymora',
          city: 'Saint-Tropez', country: 'FR', category: 'bars', coverEmoji: '🏖️', previewCount: 2, unlockPrice: 490, unlockPoints: 500, minPlan: 'premium',
          metaTitle: 'Meilleurs beach clubs Saint-Tropez 2026 — Sélection Baymora', metaDescription: 'Les beach clubs incontournables de Saint-Tropez pour l\'été 2026. Club 55, Nikki Beach, Bagatelle et plus.',
          description: 'De Pampelonne à la Ponche, voici les beach clubs qui comptent à Saint-Tropez cet été.',
          tags: ['Saint-Tropez', 'beach club', 'été', 'plage', 'Côte d\'Azur'],
          items: [
            { name: 'Club 55', type: 'beach', address: 'Plage de Pampelonne', description: 'L\'original depuis 1955. Ambiance décontractée-chic, salade niçoise mythique.', insiderTip: 'Arrivez avant 12h. Réservez 1 semaine avant en juillet-août.', price: '80-150€/pers', rating: 4.5 },
            { name: 'Nikki Beach', type: 'beach', address: 'Plage de Pampelonne', description: 'Le plus international. DJ, champagne, et beautiful people.', insiderTip: 'Le brunch du dimanche est le meilleur de la côte.', price: '100-250€/pers', rating: 4.3 },
            { name: 'Bagatelle', type: 'beach', address: 'Plage de Pampelonne', description: 'Déjeuner qui se transforme en fête. Ambiance Ibiza sur la Riviera.', insiderTip: 'Après 14h ça devient un dancefloor.', price: '80-200€/pers', rating: 4.2 },
            { name: 'Indie Beach', type: 'beach', address: 'Plage de Pampelonne', description: 'Le plus cool et décontracté. Musique live, cocktails artisanaux.', insiderTip: 'Le meilleur spot pour le coucher de soleil.', price: '50-100€/pers', rating: 4.4 },
            { name: 'La Réserve à la Plage', type: 'beach', address: 'Plage de Pampelonne', description: 'L\'extension plage du mythique hôtel La Réserve. Ultra-raffiné.', insiderTip: 'Le plus exclusif. Service palace sur le sable.', price: '150-300€/pers', rating: 4.7 },
          ],
        },
        {
          slug: 'top-rooftops-new-york', title: 'Top 8 rooftops à New York', subtitle: 'Les plus belles vues de Manhattan',
          city: 'New York', country: 'US', category: 'bars', coverEmoji: '🗽', previewCount: 3, unlockPrice: 490, unlockPoints: 500, minPlan: 'premium',
          metaTitle: 'Meilleurs rooftops New York 2026 — Sélection Baymora', metaDescription: 'Les 8 rooftops avec les plus belles vues de NYC. Cocktails, skyline, et spots secrets.',
          description: 'Manhattan vu d\'en haut. Notre sélection des rooftops qui valent le détour — du classique au secret.',
          tags: ['New York', 'rooftop', 'cocktails', 'vue', 'Manhattan'],
          items: [
            { name: 'The Edge Hudson Yards', type: 'bar', address: '30 Hudson Yards', description: 'La plus haute terrasse extérieure de l\'hémisphère ouest. Vue 360° époustouflante.', insiderTip: 'Venez au coucher du soleil. Le bar est moins cher que l\'entrée observatoire.', price: '20-40$/cocktail', rating: 4.6 },
            { name: 'Westlight', type: 'bar', address: '111 N 12th St, Brooklyn', description: 'Au sommet du William Vale Hotel. Vue panoramique sur Manhattan depuis Brooklyn.', insiderTip: 'Mardi-mercredi = pas de queue. La vue est la même.', price: '18-25$/cocktail', rating: 4.5 },
            { name: 'The Roof at Public', type: 'bar', address: '215 Chrystie St', description: 'Caché au-dessus du Public Hotel d\'Ian Schrager. Ambiance exclusive.', insiderTip: 'Pas d\'enseigne. Dites au concierge que vous montez au Roof.', price: '22-35$/cocktail', rating: 4.4 },
            { name: 'Le Bain at The Standard', type: 'bar', address: '848 Washington St', description: 'Pool party + DJ + vue sur l\'Hudson. L\'adresse nightlife iconique.', insiderTip: 'Venez avant 23h sinon file d\'attente massive. Dress code strict.', price: '20-30$/cocktail', rating: 4.3 },
            { name: '230 Fifth', type: 'bar', address: '230 5th Ave', description: 'Vue directe sur l\'Empire State Building. Le plus grand rooftop de NYC.', insiderTip: 'En hiver ils fournissent des peignoirs. Photos incroyables.', price: '15-25$/cocktail', rating: 4.2 },
          ],
        },
      ];

      const guidesCreated: string[] = [];
      for (const g of SEED_GUIDES) {
        const exists = await prisma.seoGuide.findUnique({ where: { slug: g.slug } });
        if (exists) { guidesCreated.push(`${g.slug} (existait)`); continue; }
        await prisma.seoGuide.create({
          data: { ...g, itemCount: g.items.length, status: 'published', createdBy: 'seed', viewCount: Math.floor(Math.random() * 800) + 100, unlockCount: Math.floor(Math.random() * 50) },
        });
        guidesCreated.push(g.slug);
      }
      results.guides = { created: guidesCreated.length, details: guidesCreated };
    }

    console.log('[SEED] Données créées:', JSON.stringify(results, null, 2));
    res.json({ success: true, results });
  } catch (error) {
    console.error('[SEED] Erreur:', error);
    res.status(500).json({ error: 'Erreur seed' });
  }
});

export default router;
