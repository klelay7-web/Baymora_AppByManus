/**
 * seedEstablishments.ts
 * Inserts curated premium establishments into the establishments table.
 * Skips any row whose slug already exists.
 *
 * Usage: npx tsx server/scripts/seedEstablishments.ts
 *
 * Requires DATABASE_URL env var. SSL is forced when the URL contains tidbcloud.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

type Category =
  | "restaurant"
  | "hotel"
  | "bar"
  | "spa"
  | "museum"
  | "park"
  | "beach"
  | "nightclub"
  | "shopping"
  | "transport"
  | "activity"
  | "experience"
  | "wellness";

interface Establishment {
  slug: string;
  name: string;
  category: Category;
  subcategory?: string;
  city: string;
  country: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  shortDescription: string;
  rating: number;
}

const ESTABLISHMENTS: Establishment[] = [
  // ─── PARIS — Bars / Rooftops ─────────────────────────────────────
  {
    slug: "le-perchoir-marais",
    name: "Le Perchoir Marais",
    category: "bar",
    subcategory: "rooftop",
    city: "Paris",
    country: "France",
    address: "33 rue de la Verrerie, 75004 Paris",
    lat: 48.8566,
    lng: 2.3522,
    description:
      "Rooftop iconique avec vue sur les toits de Paris. Cocktails signatures et ambiance solaire au cœur du Marais.",
    shortDescription: "Rooftop iconique avec vue sur les toits de Paris. Cocktails signatures et ambiance solaire.",
    rating: 4.5,
  },
  {
    slug: "lulu-white",
    name: "Lulu White",
    category: "bar",
    subcategory: "speakeasy",
    city: "Paris",
    country: "France",
    address: "12 rue Frochot, 75009 Paris",
    lat: 48.8812,
    lng: 2.3374,
    description:
      "Speakeasy caché dans le style Nouvelle-Orléans. Absinthe et jazz live dans un décor années 20.",
    shortDescription: "Speakeasy style Nouvelle-Orléans. Absinthe et jazz live dans un décor années 20.",
    rating: 4.6,
  },
  {
    slug: "le-syndicat",
    name: "Le Syndicat",
    category: "bar",
    subcategory: "cocktail",
    city: "Paris",
    country: "France",
    address: "51 rue du Faubourg Saint-Denis, 75010 Paris",
    lat: 48.8719,
    lng: 2.3544,
    description:
      "Bar à cocktails 100% spiritueux français. Créativité radicale, ambiance brute et élégante, dans un décor affranchi.",
    shortDescription: "Bar à cocktails 100% spiritueux français. Créativité radicale, ambiance brute et élégante.",
    rating: 4.7,
  },
  {
    slug: "copperbay",
    name: "CopperBay",
    category: "bar",
    subcategory: "cocktail",
    city: "Paris",
    country: "France",
    address: "5 rue Bouchardon, 75010 Paris",
    lat: 48.8710,
    lng: 2.3612,
    description:
      "Comptoir cuivre et cocktails d'auteur signés Aurélie Panhelleux et Elfi Meilhac. L'adresse confidentielle du 10e arrondissement.",
    shortDescription: "Comptoir cuivre et cocktails d'auteur. L'adresse confidentielle du 10e.",
    rating: 4.6,
  },
  {
    slug: "gravity-bar",
    name: "Gravity Bar",
    category: "bar",
    subcategory: "vins nature",
    city: "Paris",
    country: "France",
    address: "44 rue des Vinaigriers, 75010 Paris",
    lat: 48.8738,
    lng: 2.3625,
    description:
      "Cave à vins naturels et petites assiettes. L'énergie du Canal Saint-Martin dans un décor architectural épuré.",
    shortDescription: "Cave à vins naturels et petites assiettes. L'énergie du Canal Saint-Martin.",
    rating: 4.4,
  },
  {
    slug: "le-roof-maison-blanche",
    name: "Le Roof – Maison Blanche",
    category: "bar",
    subcategory: "rooftop",
    city: "Paris",
    country: "France",
    address: "15 avenue Montaigne, 75008 Paris",
    lat: 48.8660,
    lng: 2.3045,
    description:
      "Rooftop sur les Champs avec vue Tour Eiffel. Champagne et coucher de soleil sur l'avenue Montaigne.",
    shortDescription: "Rooftop sur les Champs avec vue Tour Eiffel. Champagne et coucher de soleil.",
    rating: 4.5,
  },

  // ─── PARIS — Nightclubs ──────────────────────────────────────────
  {
    slug: "concrete-paris",
    name: "Concrete",
    category: "nightclub",
    subcategory: "techno",
    city: "Paris",
    country: "France",
    address: "Port de la Rapée, 75012 Paris",
    lat: 48.8462,
    lng: 2.3663,
    description:
      "Club flottant sur la Seine. Techno et house non-stop, sound system légendaire de la scène parisienne.",
    shortDescription: "Club flottant sur la Seine. Techno et house non-stop, sound system légendaire.",
    rating: 4.6,
  },
  {
    slug: "rex-club",
    name: "Rex Club",
    category: "nightclub",
    subcategory: "techno",
    city: "Paris",
    country: "France",
    address: "5 boulevard Poissonnière, 75002 Paris",
    lat: 48.8711,
    lng: 2.3481,
    description:
      "Institution techno parisienne depuis 1988. Le son avant tout, dans un club-temple aux basses inoubliables.",
    shortDescription: "Institution techno parisienne depuis 1988. Le son avant tout.",
    rating: 4.7,
  },
  {
    slug: "badaboum",
    name: "Badaboum",
    category: "nightclub",
    subcategory: "club",
    city: "Paris",
    country: "France",
    address: "2bis rue des Taillandiers, 75011 Paris",
    lat: 48.8540,
    lng: 2.3749,
    description:
      "Club Bastille à double personnalité : restaurant le soir, dancefloor la nuit. La programmation la plus éclectique du 11e.",
    shortDescription: "Club Bastille à double personnalité : restaurant le soir, dancefloor la nuit.",
    rating: 4.4,
  },
  {
    slug: "la-machine-du-moulin-rouge",
    name: "La Machine du Moulin Rouge",
    category: "nightclub",
    subcategory: "club",
    city: "Paris",
    country: "France",
    address: "90 boulevard de Clichy, 75018 Paris",
    lat: 48.8843,
    lng: 2.3323,
    description:
      "Trois salles, trois ambiances. Electro, live, after — sous l'enseigne mythique du Moulin Rouge.",
    shortDescription: "Trois salles, trois ambiances. Electro, live, after — sous l'enseigne mythique.",
    rating: 4.5,
  },

  // ─── PARIS — Restaurants ─────────────────────────────────────────
  {
    slug: "septime",
    name: "Septime",
    category: "restaurant",
    subcategory: "gastronomique",
    city: "Paris",
    country: "France",
    address: "80 rue de Charonne, 75011 Paris",
    lat: 48.8534,
    lng: 2.3810,
    description:
      "Table contemporaine étoilée par Bertrand Grébaut. Menu surprise, produits vivants, expérience pure au cœur du 11e.",
    shortDescription: "Table contemporaine étoilée. Menu surprise, produits vivants, expérience pure.",
    rating: 4.8,
  },
  {
    slug: "le-chateaubriand",
    name: "Le Chateaubriand",
    category: "restaurant",
    subcategory: "neo-bistro",
    city: "Paris",
    country: "France",
    address: "129 avenue Parmentier, 75011 Paris",
    lat: 48.8652,
    lng: 2.3810,
    description:
      "Néo-bistro pionnier du 11e signé Iñaki Aizpitarte. Cuisine instinctive, sans carte, sans compromis.",
    shortDescription: "Néo-bistro pionnier du 11e. Cuisine instinctive, sans carte, sans compromis.",
    rating: 4.6,
  },
  {
    slug: "clover-grill",
    name: "Clover Grill",
    category: "restaurant",
    subcategory: "grillades",
    city: "Paris",
    country: "France",
    address: "6 rue Bailleul, 75001 Paris",
    lat: 48.8601,
    lng: 2.3416,
    description:
      "Grillades nobles face au Louvre par Jean-François Piège. Élégance carnivore dans un décor signature.",
    shortDescription: "Grillades nobles face au Louvre par Jean-François Piège. Élégance carnivore.",
    rating: 4.5,
  },
  {
    slug: "pink-mamma",
    name: "Pink Mamma",
    category: "restaurant",
    subcategory: "trattoria",
    city: "Paris",
    country: "France",
    address: "20bis rue de Douai, 75009 Paris",
    lat: 48.8817,
    lng: 2.3339,
    description:
      "Trattoria géante sur 4 étages avec terrasse secrète. L'Italie en grand, au pied de Pigalle.",
    shortDescription: "Trattoria géante sur 4 étages avec terrasse secrète. L'Italie en grand.",
    rating: 4.4,
  },
  {
    slug: "frenchie",
    name: "Frenchie",
    category: "restaurant",
    subcategory: "bistronomie",
    city: "Paris",
    country: "France",
    address: "5 rue du Nil, 75002 Paris",
    lat: 48.8653,
    lng: 2.3474,
    description:
      "Le restaurant qui a réinventé la rue du Nil. Bistronomie précise et conviviale par Gregory Marchand.",
    shortDescription: "Le restaurant qui a réinventé la rue du Nil. Bistronomie précise et conviviale.",
    rating: 4.7,
  },

  // ─── PARIS — Hôtels ──────────────────────────────────────────────
  {
    slug: "hotel-costes",
    name: "Hôtel Costes",
    category: "hotel",
    subcategory: "palace",
    city: "Paris",
    country: "France",
    address: "239 rue Saint-Honoré, 75001 Paris",
    lat: 48.8656,
    lng: 2.3285,
    description:
      "Palace confidentiel au cœur de Paris. Décor Napoleon III, cour intérieure mythique et bande-son culte.",
    shortDescription: "Palace confidentiel au cœur de Paris. Décor Napoleon III, cour intérieure mythique.",
    rating: 4.6,
  },
  {
    slug: "le-brach",
    name: "Le Brach",
    category: "hotel",
    subcategory: "design",
    city: "Paris",
    country: "France",
    address: "1-7 rue Jean Richepin, 75016 Paris",
    lat: 48.8630,
    lng: 2.2750,
    description:
      "Hôtel design signé Philippe Starck dans le 16e. Rooftop, piscine, et esprit club privé de la Maison Evok.",
    shortDescription: "Hôtel design signé Starck dans le 16e. Rooftop, piscine, et esprit club privé.",
    rating: 4.8,
  },
  {
    slug: "hotel-providence",
    name: "Hôtel Providence",
    category: "hotel",
    subcategory: "boutique",
    city: "Paris",
    country: "France",
    address: "90 rue René Boulanger, 75010 Paris",
    lat: 48.8714,
    lng: 2.3617,
    description:
      "Boutique-hôtel rock'n'roll du 10e. Cocktails en chambre et décor théâtral, l'adresse des insiders.",
    shortDescription: "Boutique-hôtel rock'n'roll du 10e. Cocktails en chambre et décor théâtral.",
    rating: 4.5,
  },

  // ─── PARIS — Expériences ─────────────────────────────────────────
  {
    slug: "le-comptoir-general",
    name: "Le Comptoir Général",
    category: "experience",
    subcategory: "lieu hybride",
    city: "Paris",
    country: "France",
    address: "80 quai de Jemmapes, 75010 Paris",
    lat: 48.8726,
    lng: 2.3644,
    description:
      "Lieu hybride au bord du canal Saint-Martin. Bar, expos, marché vintage — l'inattendu permanent, la curiosité comme règle.",
    shortDescription: "Lieu hybride au bord du canal. Bar, expos, marché vintage — l'inattendu permanent.",
    rating: 4.3,
  },
  {
    slug: "les-etincelles-palais-decouverte",
    name: "Les Étincelles du Palais de la Découverte",
    category: "experience",
    subcategory: "sciences",
    city: "Paris",
    country: "France",
    address: "Avenue Franklin D. Roosevelt, 75008 Paris",
    lat: 48.8665,
    lng: 2.3100,
    description:
      "Sciences et émerveillement en plein cœur de Paris. L'expérience qui éveille la curiosité, pour tous les âges.",
    shortDescription: "Sciences et émerveillement en plein cœur de Paris. L'expérience qui éveille.",
    rating: 4.4,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[seed] DATABASE_URL is required");
    process.exit(1);
  }

  const isTiDB = url.includes("tidbcloud");
  console.log(`[seed] Connecting to ${isTiDB ? "TiDB Cloud (SSL)" : "MySQL"}…`);

  const conn = await mysql.createConnection({
    uri: url,
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
  });

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const e of ESTABLISHMENTS) {
    try {
      const [rows] = (await conn.execute(
        "SELECT id FROM establishments WHERE slug = ? LIMIT 1",
        [e.slug]
      )) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        skipped++;
        console.log(`[seed] ⊘ ${e.slug} already exists`);
        continue;
      }

      await conn.execute(
        `INSERT INTO establishments
          (slug, name, category, subcategory, city, country, address, lat, lng,
           description, shortDescription, rating, status, generatedBy, source, verified, createdBy, publishedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'manual', 'seed', 1, 'seed', NOW())`,
        [
          e.slug,
          e.name,
          e.category,
          e.subcategory ?? null,
          e.city,
          e.country,
          e.address,
          e.lat,
          e.lng,
          e.description,
          e.shortDescription,
          e.rating,
        ]
      );
      inserted++;
      console.log(`[seed] ✓ ${e.city.padEnd(10)} · ${e.category.padEnd(10)} · ${e.slug}`);
    } catch (err: any) {
      errors++;
      console.error(`[seed] ✗ ${e.slug}: ${err.message}`);
    }
  }

  await conn.end();
  console.log(`\n[seed] Done: ${inserted} inserted, ${skipped} skipped, ${errors} errors (total ${ESTABLISHMENTS.length})`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
