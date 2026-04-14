-- Migration 0025: Member profiles (profil dynamique enrichi par Maya)
CREATE TABLE IF NOT EXISTS `member_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `preferences` json DEFAULT (JSON_OBJECT()),
  `habits` json DEFAULT (JSON_OBJECT()),
  `companions` json DEFAULT (JSON_ARRAY()),
  `visitedSlugs` json DEFAULT (JSON_ARRAY()),
  `favoriteCities` json DEFAULT (JSON_ARRAY()),
  `conversationCount` int DEFAULT 0,
  `lastConversationAt` timestamp NULL,
  `creatorStatus` enum('member','creator','eclaireur') DEFAULT 'member',
  `walletCredits` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_profiles_userId_unique` (`userId`),
  KEY `idx_user` (`userId`)
);
