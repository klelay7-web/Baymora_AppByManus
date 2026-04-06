-- Migration: Enrichir clientProfiles avec 50+ champs
-- Sprint 0.6 — Fiche Client Ultra-Complète

-- Identité
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS birthDate varchar(10);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS age int;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS gender varchar(32);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS nationality varchar(64);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS locale varchar(8) DEFAULT 'fr';

-- Morphologie & Tailles
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS height int;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS weight int;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS clothingSizeTop varchar(16);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS clothingSizeBottom varchar(16);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS clothingSizeDress varchar(16);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS clothingSizeSuit varchar(16);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS ringSize varchar(8);

-- Permis & Conduite
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS drivingLicenses text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS drivingSide enum('droite','gauche','les_deux') DEFAULT 'droite';
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS transmissionPref enum('auto','manuel','indifferent') DEFAULT 'auto';
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS carPrefLuxury text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS carPrefDaily text;

-- Logement & Hébergement
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS lodgingTypes text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS lodgingSettings text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS lodgingAmenities text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS lodgingLocation text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS transportPref text;

-- Aéroport & Voyage
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS passportCountry varchar(64);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS frequentFlyerPrograms text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS seatPreference varchar(32);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS cabinClass varchar(32);

-- Style & Goûts
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteColors text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteBrands text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteShops text;

-- Gastronomie
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteCuisines text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteDishes text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteAlcohol text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteWines text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS coffeeTea varchar(64);

-- Santé & Bien-être
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS visionStatus varchar(64);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS visionDetails text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS healthConditions text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS handicap text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS wellnessPrefs text;

-- Animaux
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS pets text;

-- Famille & Proches
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS relationshipStatus varchar(32);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS partnerGender varchar(32);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS partnerName varchar(128);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS partnerBirthDate varchar(10);
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS children text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS closeFriends text;

-- Religion & Croyances
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS religiousConsiderations varchar(128);

-- Clubs & VIP
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS clubMemberships text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS privateAviation text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS yachtBoat text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS conciergePreference varchar(128);

-- Lieux & Préférences
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteCities text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoritePlaces text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS favoriteQuotes text;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS bucketList text;

-- Gamification
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS profileCompletionPct int DEFAULT 0;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS profilePointsEarned int DEFAULT 0;
ALTER TABLE clientProfiles ADD COLUMN IF NOT EXISTS lastFieldFilledAt timestamp NULL;

-- Renommer les colonnes existantes qui changent de nom
-- clothingSize → clothingSizeTop (si pas déjà fait)
-- pet → pets (si pas déjà fait)
-- favoriteCuisine → favoriteCuisines (si pas déjà fait)
-- On ne drop pas les anciennes colonnes pour ne pas perdre de données
