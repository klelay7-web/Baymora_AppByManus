-- Migration: Add operatorMessages and operatorRoutes tables

CREATE TABLE IF NOT EXISTS `operatorMessages` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `fromUserId` int NOT NULL,
  `toUserId` int NOT NULL,
  `content` text NOT NULL,
  `isRead` boolean NOT NULL DEFAULT false,
  `attachmentUrl` text,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `operatorRoutes` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `createdByUserId` int NOT NULL,
  `title` varchar(256) NOT NULL,
  `description` text,
  `city` varchar(128) NOT NULL,
  `country` varchar(128) NOT NULL DEFAULT 'France',
  `category` enum('decouverte','gastronomie','plages','culture','shopping','nature','nightlife','wellness','business','famille','autre') NOT NULL DEFAULT 'decouverte',
  `durationMinutes` int,
  `status` enum('draft','submitted','approved','published') NOT NULL DEFAULT 'draft',
  `coverImageUrl` text,
  `establishmentIds` text,
  `steps` text,
  `notes` text,
  `adminFeedback` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
