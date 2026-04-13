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

  // ─── BORDEAUX (10) ──────────────────────────────────────────────
  {
    slug: "symbiose-bordeaux",
    name: "Symbiose",
    category: "bar",
    subcategory: "cocktail",
    city: "Bordeaux",
    country: "France",
    address: "4 Quai des Chartrons, 33000 Bordeaux",
    lat: 44.8378,
    lng: -0.5792,
    description:
      "Cocktails d'auteur dans un écrin végétal. Le bar qui réinvente les nuits bordelaises avec un speakeasy caché à l'étage.",
    shortDescription: "Cocktails d'auteur dans un écrin végétal. Le bar qui réinvente les nuits bordelaises.",
    rating: 4.6,
  },
  {
    slug: "le-monkey-bordeaux",
    name: "Le Monkey",
    category: "bar",
    subcategory: "rooftop",
    city: "Bordeaux",
    country: "France",
    address: "Quartier des Chartrons, 33000 Bordeaux",
    lat: 44.8512,
    lng: -0.5695,
    description:
      "Rooftop avec vue sur les Chartrons. Sundowners et DJ sets au coucher du soleil, l'adresse estivale des insiders.",
    shortDescription: "Rooftop avec vue sur les Chartrons. Sundowners et DJ sets au coucher du soleil.",
    rating: 4.5,
  },
  {
    slug: "night-beach-bordeaux",
    name: "Night Beach",
    category: "nightclub",
    subcategory: "plage",
    city: "Bordeaux",
    country: "France",
    address: "Bord de Garonne, 33000 Bordeaux",
    lat: 44.8425,
    lng: -0.5648,
    description:
      "Club éphémère en bord de Garonne. Sable, son et nuits sans fin, l'esprit plage au cœur de la ville.",
    shortDescription: "Club éphémère en bord de Garonne. Sable, son et nuits sans fin.",
    rating: 4.3,
  },
  {
    slug: "iboat-bordeaux",
    name: "I.Boat",
    category: "nightclub",
    subcategory: "live & club",
    city: "Bordeaux",
    country: "France",
    address: "Bassin à Flot n°1, 33300 Bordeaux",
    lat: 44.8401,
    lng: -0.5583,
    description:
      "Salle de concert flottante et club underground. La culture alternative bordelaise dans une ancienne péniche.",
    shortDescription: "Salle de concert flottante et club underground. La culture alternative bordelaise.",
    rating: 4.7,
  },
  {
    slug: "la-comtesse-bordeaux",
    name: "La Comtesse",
    category: "bar",
    subcategory: "vins nature",
    city: "Bordeaux",
    country: "France",
    address: "25 Rue du Parlement Saint-Pierre, 33000 Bordeaux",
    lat: 44.8396,
    lng: -0.5743,
    description:
      "Bar à vins naturels dans une cave voûtée. Le meilleur du vignoble à deux pas, servi par des passionnés.",
    shortDescription: "Bar à vins naturels dans une cave voûtée. Le meilleur du vignoble à deux pas.",
    rating: 4.5,
  },
  {
    slug: "le-gabriel-bordeaux",
    name: "Le Gabriel",
    category: "restaurant",
    subcategory: "gastronomique",
    city: "Bordeaux",
    country: "France",
    address: "10 Place de la Bourse, 33000 Bordeaux",
    lat: 44.8414,
    lng: -0.5701,
    description:
      "Table gastronomique Place de la Bourse. Terrasse face au Miroir d'Eau, cuisine sudiste raffinée.",
    shortDescription: "Table gastronomique Place de la Bourse. Terrasse face au Miroir d'Eau.",
    rating: 4.6,
  },
  {
    slug: "intercontinental-bordeaux",
    name: "InterContinental Bordeaux",
    category: "hotel",
    subcategory: "palace",
    city: "Bordeaux",
    country: "France",
    address: "2-5 Place de la Comédie, 33000 Bordeaux",
    lat: 44.8435,
    lng: -0.5787,
    description:
      "Palace dans le Triangle d'Or. Spa, gastronomie et élégance bordelaise dans un décor XVIIIe d'exception.",
    shortDescription: "Palace dans le Triangle d'Or. Spa, gastronomie et élégance bordelaise.",
    rating: 4.8,
  },
  {
    slug: "le-boutique-hotel-bordeaux",
    name: "Le Boutique Hôtel",
    category: "hotel",
    subcategory: "boutique",
    city: "Bordeaux",
    country: "France",
    address: "3 Rue Lafaurie de Monbadon, 33000 Bordeaux",
    lat: 44.8381,
    lng: -0.5722,
    description:
      "Charme intimiste au cœur de Saint-Pierre. Design et raffinement discret dans un hôtel particulier restauré.",
    shortDescription: "Charme intimiste au cœur de Saint-Pierre. Design et raffinement discret.",
    rating: 4.4,
  },
  {
    slug: "la-cite-du-vin-bordeaux",
    name: "La Cité du Vin",
    category: "experience",
    subcategory: "culture",
    city: "Bordeaux",
    country: "France",
    address: "134 Quai de Bacalan, 33300 Bordeaux",
    lat: 44.8625,
    lng: -0.5499,
    description:
      "Architecture iconique et voyage sensoriel à travers les civilisations du vin. Le temple moderne de la viticulture.",
    shortDescription: "Architecture iconique et voyage sensoriel à travers les civilisations du vin.",
    rating: 4.7,
  },
  {
    slug: "mama-shelter-bordeaux",
    name: "Mama Shelter Bordeaux",
    category: "bar",
    subcategory: "rooftop",
    city: "Bordeaux",
    country: "France",
    address: "19 Rue Poquelin Molière, 33000 Bordeaux",
    lat: 44.8307,
    lng: -0.5685,
    description:
      "Rooftop festif et décalé avec vue sur les toits. Brunch, cocktails et bonne humeur signés Mama Shelter.",
    shortDescription: "Rooftop festif et décalé avec vue sur les toits. Brunch, cocktails et bonne humeur.",
    rating: 4.4,
  },

  // ─── LYON (10) ──────────────────────────────────────────────────
  {
    slug: "le-sucre-lyon",
    name: "Le Sucre",
    category: "nightclub",
    subcategory: "rooftop club",
    city: "Lyon",
    country: "France",
    address: "50 Quai Rambaud, 69002 Lyon",
    lat: 45.7387,
    lng: 4.8178,
    description:
      "Club sur le toit de La Sucrière à Confluence. Techno, house et panorama industriel, la scène électro lyonnaise.",
    shortDescription: "Club sur le toit de La Sucrière à Confluence. Techno, house et panorama industriel.",
    rating: 4.6,
  },
  {
    slug: "ninkasi-gerland-lyon",
    name: "Ninkasi Gerland",
    category: "bar",
    subcategory: "live",
    city: "Lyon",
    country: "France",
    address: "267 Rue Marcel Mérieux, 69007 Lyon",
    lat: 45.7276,
    lng: 4.8263,
    description:
      "Brasserie artisanale et scène live. Bière maison, concerts et énergie lyonnaise dans un ancien entrepôt.",
    shortDescription: "Brasserie artisanale et scène live. Bière maison, concerts et énergie lyonnaise.",
    rating: 4.4,
  },
  {
    slug: "azar-club-lyon",
    name: "Azar Club",
    category: "nightclub",
    subcategory: "club",
    city: "Lyon",
    country: "France",
    address: "1 Quai Augagneur, 69003 Lyon",
    lat: 45.7676,
    lng: 4.8339,
    description:
      "Club select des Terreaux. Ambiance VIP et DJ sets internationaux sur les quais du Rhône.",
    shortDescription: "Club select des Terreaux. Ambiance VIP et DJ sets internationaux.",
    rating: 4.3,
  },
  {
    slug: "le-boudoir-lyon",
    name: "Le Boudoir",
    category: "bar",
    subcategory: "speakeasy",
    city: "Lyon",
    country: "France",
    address: "13 Place Jules Ferry, 69006 Lyon",
    lat: 45.7634,
    lng: 4.8345,
    description:
      "Bar à cocktails intimiste derrière une porte dérobée. L'art du secret dans un décor baroque.",
    shortDescription: "Bar à cocktails intimiste derrière une porte dérobée. L'art du secret.",
    rating: 4.5,
  },
  {
    slug: "tetedoie-lyon",
    name: "Têtedoie",
    category: "restaurant",
    subcategory: "gastronomique",
    city: "Lyon",
    country: "France",
    address: "Montée du Chemin Neuf, 69005 Lyon",
    lat: 45.7596,
    lng: 4.8236,
    description:
      "Table panoramique sur Fourvière. Lyon à vos pieds, gastronomie au sommet signée Christian Têtedoie.",
    shortDescription: "Table panoramique sur Fourvière. Lyon à vos pieds, gastronomie au sommet.",
    rating: 4.7,
  },
  {
    slug: "la-mere-brazier-lyon",
    name: "La Mère Brazier",
    category: "restaurant",
    subcategory: "gastronomique",
    city: "Lyon",
    country: "France",
    address: "12 Rue Royale, 69001 Lyon",
    lat: 45.7706,
    lng: 4.8341,
    description:
      "Institution étoilée depuis 1921. L'héritage culinaire lyonnais sublimé par Mathieu Viannay.",
    shortDescription: "Institution étoilée depuis 1921. L'héritage culinaire lyonnais sublimé.",
    rating: 4.8,
  },
  {
    slug: "villa-florentine-lyon",
    name: "Villa Florentine",
    category: "hotel",
    subcategory: "palace",
    city: "Lyon",
    country: "France",
    address: "25 Montée Saint-Barthélemy, 69005 Lyon",
    lat: 45.7612,
    lng: 4.8254,
    description:
      "Ancien couvent Renaissance dominant Lyon. Piscine, vue époustouflante et charme monastique réinventé.",
    shortDescription: "Ancien couvent Renaissance dominant Lyon. Piscine, vue époustouflante.",
    rating: 4.7,
  },
  {
    slug: "cour-des-loges-lyon",
    name: "Cour des Loges",
    category: "hotel",
    subcategory: "palace",
    city: "Lyon",
    country: "France",
    address: "6 Rue du Boeuf, 69005 Lyon",
    lat: 45.7628,
    lng: 4.8281,
    description:
      "Hôtel 5 étoiles dans quatre maisons Renaissance du Vieux Lyon. Majestueux et préservé au cœur de l'histoire.",
    shortDescription: "Hôtel 5 étoiles dans quatre maisons Renaissance du Vieux Lyon. Majestueux.",
    rating: 4.7,
  },
  {
    slug: "halles-paul-bocuse-lyon",
    name: "Les Halles Paul Bocuse",
    category: "experience",
    subcategory: "gastronomie",
    city: "Lyon",
    country: "France",
    address: "102 Cours Lafayette, 69003 Lyon",
    lat: 45.7623,
    lng: 4.8548,
    description:
      "Cathédrale de la gastronomie lyonnaise. Les meilleurs artisans sous un même toit, le temple des saveurs.",
    shortDescription: "Cathédrale de la gastronomie lyonnaise. Les meilleurs artisans sous un même toit.",
    rating: 4.8,
  },
  {
    slug: "peniche-loupika-lyon",
    name: "Péniche Loupika",
    category: "bar",
    subcategory: "vins nature",
    city: "Lyon",
    country: "France",
    address: "Quai Rambaud, 69002 Lyon",
    lat: 45.7525,
    lng: 4.8225,
    description:
      "Bar flottant sur le Rhône. Vins nature, planches et quiétude au fil de l'eau, une parenthèse suspendue.",
    shortDescription: "Bar flottant sur le Rhône. Vins nature, planches et quiétude au fil de l'eau.",
    rating: 4.4,
  },

  // ─── NICE (10) ──────────────────────────────────────────────────
  {
    slug: "le-plongeoir-nice",
    name: "Le Plongeoir",
    category: "bar",
    subcategory: "rooftop",
    city: "Nice",
    country: "France",
    address: "60 Boulevard Franck Pilatte, 06300 Nice",
    lat: 43.6916,
    lng: 7.2853,
    description:
      "Perché sur un rocher face à la Baie des Anges. Cocktails les pieds dans le bleu, le coucher de soleil le plus iconique de Nice.",
    shortDescription: "Perché sur un rocher face à la Baie des Anges. Cocktails les pieds dans le bleu.",
    rating: 4.6,
  },
  {
    slug: "waynes-bar-nice",
    name: "Wayne's Bar",
    category: "bar",
    subcategory: "live",
    city: "Nice",
    country: "France",
    address: "15 Rue de la Préfecture, 06300 Nice",
    lat: 43.6971,
    lng: 7.2717,
    description:
      "Institution du Vieux Nice. Live music, ambiance internationale et nuits endiablées sur les tables.",
    shortDescription: "Institution du Vieux Nice. Live music, ambiance internationale et nuits endiablées.",
    rating: 4.3,
  },
  {
    slug: "high-club-nice",
    name: "High Club",
    category: "nightclub",
    subcategory: "club",
    city: "Nice",
    country: "France",
    address: "45 Promenade des Anglais, 06000 Nice",
    lat: 43.6954,
    lng: 7.2679,
    description:
      "Le plus grand club de la Côte d'Azur. DJ internationaux et nuits légendaires face à la mer.",
    shortDescription: "Le plus grand club de la Côte d'Azur. DJ internationaux et nuits légendaires.",
    rating: 4.4,
  },
  {
    slug: "hotel-negresco-nice",
    name: "Le Negresco",
    category: "hotel",
    subcategory: "palace",
    city: "Nice",
    country: "France",
    address: "37 Promenade des Anglais, 06000 Nice",
    lat: 43.6953,
    lng: 7.2566,
    description:
      "Palace mythique sur la Promenade des Anglais. Art, histoire et élégance absolue sous sa coupole rose.",
    shortDescription: "Palace mythique sur la Promenade des Anglais. Art, histoire et élégance absolue.",
    rating: 4.8,
  },
  {
    slug: "hotel-amour-nice",
    name: "Hôtel Amour Nice",
    category: "hotel",
    subcategory: "boutique",
    city: "Nice",
    country: "France",
    address: "3 Avenue des Fleurs, 06000 Nice",
    lat: 43.7012,
    lng: 7.2743,
    description:
      "Boutique-hôtel bohème avec jardin méditerranéen. La dolce vita niçoise dans un décor intime et arty.",
    shortDescription: "Boutique-hôtel bohème avec jardin méditerranéen. La dolce vita niçoise.",
    rating: 4.5,
  },
  {
    slug: "jan-restaurant-nice",
    name: "Jan",
    category: "restaurant",
    subcategory: "gastronomique",
    city: "Nice",
    country: "France",
    address: "12 Rue Lascaris, 06300 Nice",
    lat: 43.6955,
    lng: 7.2826,
    description:
      "Table sud-africaine étoilée face au port. Fusion audacieuse et flaveurs uniques signées Jan Hendrik van der Westhuizen.",
    shortDescription: "Table sud-africaine étoilée face au port. Fusion audacieuse et flaveurs uniques.",
    rating: 4.7,
  },
  {
    slug: "le-3e-nice",
    name: "Le 3e",
    category: "bar",
    subcategory: "rooftop",
    city: "Nice",
    country: "France",
    address: "Splendid Hôtel & Spa, 50 Boulevard Victor Hugo, 06000 Nice",
    lat: 43.6978,
    lng: 7.2756,
    description:
      "Rooftop du 3e étage avec vue sur les toits du Vieux Nice. Apéros solaires et piscine à débordement.",
    shortDescription: "Rooftop du 3e étage avec vue sur les toits du Vieux Nice. Apéros solaires.",
    rating: 4.4,
  },
  {
    slug: "la-reserve-de-nice",
    name: "La Réserve de Nice",
    category: "experience",
    subcategory: "plage",
    city: "Nice",
    country: "France",
    address: "60 Boulevard Franck Pilatte, 06300 Nice",
    lat: 43.6898,
    lng: 7.3012,
    description:
      "Plage secrète et restaurant les pieds dans l'eau. Le joyau caché de la Riviera, accessible aux initiés.",
    shortDescription: "Plage secrète et restaurant les pieds dans l'eau. Le joyau caché de la Riviera.",
    rating: 4.6,
  },
  {
    slug: "cave-wilson-nice",
    name: "Cave Wilson",
    category: "bar",
    subcategory: "cave à vins",
    city: "Nice",
    country: "France",
    address: "5 Place Wilson, 06000 Nice",
    lat: 43.6962,
    lng: 7.2818,
    description:
      "Bar à vins authentique du quartier du Port. Sélection pointue, ambiance conviviale et assiettes du terroir.",
    shortDescription: "Bar à vins authentique du quartier du Port. Sélection pointue, ambiance conviviale.",
    rating: 4.5,
  },
  {
    slug: "le-shapko-nice",
    name: "Le Shapko",
    category: "bar",
    subcategory: "jazz",
    city: "Nice",
    country: "France",
    address: "5 Rue Rossetti, 06300 Nice",
    lat: 43.6980,
    lng: 7.2732,
    description:
      "Bar live et culturel du Vieux Nice. Jazz, impro et découvertes musicales dans une ambiance feutrée.",
    shortDescription: "Bar live et culturel du Vieux Nice. Jazz, impro et découvertes musicales.",
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
