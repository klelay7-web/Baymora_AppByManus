-- Migration 0026: Inspiration themes (pages thématiques immersives)
CREATE TABLE IF NOT EXISTS `inspiration_themes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(128) NOT NULL,
  `title` varchar(256) NOT NULL,
  `subtitle` varchar(256),
  `accroche` text,
  `city` varchar(128) NOT NULL,
  `country` varchar(128) NOT NULL,
  `cityAliases` json,
  `doorType` enum('beach','riad','palace','japanese','haussmann','temple','chalet','artdeco') NOT NULL,
  `heroImageUrl` text,
  `videoUrl` text,
  `displayOrder` int DEFAULT 0,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inspiration_themes_slug_unique` (`slug`),
  KEY `idx_active_order` (`active`, `displayOrder`)
);

INSERT INTO `inspiration_themes`
  (`slug`, `title`, `subtitle`, `accroche`, `city`, `country`, `cityAliases`, `doorType`, `heroImageUrl`, `videoUrl`, `displayOrder`)
VALUES
  ('saint-tropez', 'Saint-Tropez', 'L''éternel été du Sud', 'Les pieds dans le sable, le verre à la main. Ici, la nuit commence à midi et finit quand le soleil revient.', 'Saint-Tropez', 'France', NULL, 'beach', NULL, NULL, 10),
  ('paris', 'Paris', 'La capitale intime', 'Tout le monde connaît Paris. Presque personne ne connaît le Paris qui compte vraiment — celui qu''on se passe entre initiés.', 'Paris', 'France', NULL, 'haussmann', NULL, NULL, 20),
  ('bordeaux', 'Bordeaux', 'La pierre qui chante', 'Des quais qui respirent, des caves centenaires, et une ville qui a appris à se réinventer sans rien perdre de son âme.', 'Bordeaux', 'France', NULL, 'palace', NULL, NULL, 30),
  ('nice', 'Nice', 'La douceur magnétique', 'La Baie des Anges n''a pas volé son nom. Entre marché du Cours Saleya et sunsets sur la Prom, Nice t''ouvre les bras sans jamais t''imposer.', 'Nice', 'France', NULL, 'beach', NULL, NULL, 40),
  ('monaco', 'Monaco', 'Le rocher impérial', 'Deux kilomètres carrés et une concentration de désir qu''aucun autre endroit ne peut égaler. L''exception devenue règle.', 'Monaco', 'Monaco', NULL, 'palace', NULL, NULL, 50),
  ('marrakech', 'Marrakech', 'La ville rouge', 'Derrière chaque porte cloutée, un jardin. Derrière chaque silence, une histoire. Marrakech ne se visite pas — elle se traverse.', 'Marrakech', 'Morocco', NULL, 'riad', NULL, NULL, 60),
  ('tokyo', 'Tokyo', 'Le vertige parfait', 'Néons, silence, perfection. Tokyo ne ressemble à rien d''autre. C''est une ville qu''on apprend à lire — et qu''on ne finit jamais.', 'Tokyo', 'Japan', NULL, 'japanese', NULL, NULL, 70),
  ('new-york', 'New York', 'La ville qui décide', 'Le rythme, la lumière, la démesure. À New York, chaque adresse est une scène, chaque soir est un film.', 'New York', 'United States', NULL, 'artdeco', NULL, NULL, 80),
  ('bali', 'Bali', 'L''île qui respire', 'Des temples dans la jungle, des plages où le temps s''arrête, des villas suspendues au-dessus de l''océan. Bali est un état d''esprit.', 'Bali', 'Indonesia', JSON_ARRAY('Seminyak', 'Ubud', 'Uluwatu', 'Jimbaran'), 'temple', NULL, NULL, 90),
  ('dubai', 'Dubai', 'L''ambition faite ville', 'Rien n''y est impossible et rien n''est ordinaire. Dubai prend ce que le luxe international a de plus extrême et en fait son quotidien.', 'Dubai', 'United Arab Emirates', NULL, 'palace', NULL, NULL, 100),
  ('londres', 'Londres', 'Le club permanent', 'Derrière les façades georgiennes, une vie nocturne inépuisable, des clubs privés centenaires et une créativité qui ne dort jamais.', 'London', 'United Kingdom', NULL, 'haussmann', NULL, NULL, 110)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `subtitle` = VALUES(`subtitle`),
  `accroche` = VALUES(`accroche`),
  `city` = VALUES(`city`),
  `country` = VALUES(`country`),
  `cityAliases` = VALUES(`cityAliases`),
  `doorType` = VALUES(`doorType`),
  `displayOrder` = VALUES(`displayOrder`);
