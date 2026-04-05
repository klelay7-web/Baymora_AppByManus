CREATE TABLE `affiliateClicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`seoCardId` int,
	`userId` int,
	`clickedUrl` text NOT NULL,
	`referrer` text,
	`userAgent` text,
	`ipHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateClicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliateConversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clickId` int NOT NULL,
	`partnerId` int NOT NULL,
	`userId` int,
	`orderValue` decimal(10,2),
	`commission` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`status` enum('pending','confirmed','paid','rejected') NOT NULL DEFAULT 'pending',
	`externalOrderId` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `affiliateConversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliatePartners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`category` varchar(64) NOT NULL,
	`apiEndpoint` text,
	`apiKey` text,
	`commissionRate` decimal(5,2) NOT NULL,
	`trackingParam` varchar(64) DEFAULT 'ref',
	`baseUrl` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliatePartners_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliatePartners_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `agentTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`department` enum('acquisition','concierge','logistics','quality') NOT NULL,
	`agentType` varchar(64) NOT NULL,
	`taskType` varchar(64) NOT NULL,
	`input` text,
	`output` text,
	`status` enum('queued','processing','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`priority` int DEFAULT 5,
	`retryCount` int DEFAULT 0,
	`maxRetries` int DEFAULT 3,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) DEFAULT 'Nouvelle conversation',
	`status` enum('active','archived','closed') NOT NULL DEFAULT 'active',
	`context` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('subscription','recharge','usage','rollover','bonus','refund') NOT NULL,
	`description` text,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`isVoice` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seoCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(256) NOT NULL,
	`title` varchar(256) NOT NULL,
	`subtitle` varchar(256),
	`category` enum('restaurant','hotel','activity','bar','spa','guide','experience') NOT NULL,
	`city` varchar(128) NOT NULL,
	`country` varchar(128) NOT NULL,
	`region` varchar(128),
	`description` text NOT NULL,
	`highlights` text,
	`practicalInfo` text,
	`schemaOrg` text,
	`metaTitle` varchar(160),
	`metaDescription` varchar(320),
	`imageUrl` text,
	`imageAlt` varchar(256),
	`galleryUrls` text,
	`affiliateLinks` text,
	`rating` decimal(2,1),
	`priceLevel` enum('budget','moderate','upscale','luxury') DEFAULT 'upscale',
	`tags` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`viewCount` int DEFAULT 0,
	`generatedBy` enum('ai','manual') NOT NULL DEFAULT 'ai',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seoCards_id` PRIMARY KEY(`id`),
	CONSTRAINT `seoCards_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `socialMediaPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seoCardId` int,
	`platform` enum('instagram','tiktok','linkedin','twitter') NOT NULL,
	`contentType` enum('carousel','reel','story','post','script') NOT NULL,
	`title` varchar(256),
	`content` text NOT NULL,
	`hashtags` text,
	`mediaUrls` text,
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`status` enum('draft','scheduled','published','failed') NOT NULL DEFAULT 'draft',
	`engagement` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialMediaPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `travelCompanions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`relationship` varchar(64),
	`dietaryRestrictions` text,
	`preferences` text,
	`birthDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `travelCompanions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `travelItineraries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`title` varchar(256) NOT NULL,
	`destination` varchar(256),
	`startDate` varchar(10),
	`endDate` varchar(10),
	`travelers` int DEFAULT 1,
	`budget` varchar(64),
	`status` enum('planning','confirmed','completed','cancelled') NOT NULL DEFAULT 'planning',
	`itineraryData` text,
	`affiliateLinksUsed` text,
	`totalEstimatedCost` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `travelItineraries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(64) NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text NOT NULL,
	`confidence` decimal(3,2) DEFAULT '0.80',
	`source` enum('explicit','inferred','conversation') NOT NULL DEFAULT 'conversation',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','premium') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `credits` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `creditsRollover` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `freeMessagesUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(128);