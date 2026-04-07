-- Migration 0018: Notifications + Active Trip Sessions

-- Notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `type` enum('trip_reminder','trip_departure','trip_meal','trip_activity','discovery','new_offer','new_itinerary','system') NOT NULL DEFAULT 'system',
  `title` varchar(256) NOT NULL,
  `body` text NOT NULL,
  `data` text,
  `readAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_userId` (`userId`),
  KEY `idx_notifications_readAt` (`readAt`)
);

-- Notification Settings table
CREATE TABLE IF NOT EXISTS `notificationSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL UNIQUE,
  `activeTripNotifs` tinyint(1) NOT NULL DEFAULT 1,
  `discoveryNotifs` tinyint(1) NOT NULL DEFAULT 1,
  `emailNotifs` tinyint(1) NOT NULL DEFAULT 1,
  `emailFrequency` enum('instant','daily','weekly') NOT NULL DEFAULT 'daily',
  `quietHoursStart` varchar(5) DEFAULT '22:00',
  `quietHoursEnd` varchar(5) DEFAULT '08:00',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifSettings_userId` (`userId`)
);

-- Active Trip Sessions table
CREATE TABLE IF NOT EXISTS `activeTripSessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tripPlanId` int NOT NULL,
  `userId` int NOT NULL,
  `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `currentDayIndex` int NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `lastNotifSentAt` timestamp NULL,
  `completedAt` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activeTripSessions_userId` (`userId`),
  KEY `idx_activeTripSessions_tripPlanId` (`tripPlanId`)
);
