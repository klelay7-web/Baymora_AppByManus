-- Migration 0031: Parcours Maison (parcours pré-faits éditoriaux)
CREATE TABLE IF NOT EXISTS `parcours_maison` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `title` varchar(200) NOT NULL,
  `subtitle` varchar(300),
  `city` varchar(100) NOT NULL,
  `coverPhoto` varchar(500),
  `duration` varchar(50),
  `budgetEstimate` varchar(50),
  `tags` json DEFAULT ('[]'),
  `steps` json NOT NULL,
  `isPublished` boolean DEFAULT TRUE,
  `viewCount` int DEFAULT 0,
  `saveCount` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `idx_city` (`city`)
);
