-- Migration 0029: Saved parcours (parcours sauvegardés depuis Maya)
CREATE TABLE IF NOT EXISTS `saved_parcours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `steps` json NOT NULL,
  `totalBudget` int DEFAULT 0,
  `personCount` int DEFAULT 1,
  `scenarioLabel` varchar(100),
  `heroPhoto` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`userId`)
);
