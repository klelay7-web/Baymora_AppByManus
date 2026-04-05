CREATE TABLE `establishmentMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`type` enum('photo','video','tiktok','instagram_reel') NOT NULL,
	`url` text NOT NULL,
	`thumbnailUrl` text,
	`caption` varchar(256),
	`alt` varchar(256),
	`source` varchar(128),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `establishmentMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `establishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(256) NOT NULL,
	`name` varchar(256) NOT NULL,
	`subtitle` varchar(256),
	`category` enum('restaurant','hotel','bar','spa','museum','park','beach','nightclub','shopping','transport','activity','experience','wellness') NOT NULL,
	`subcategory` varchar(128),
	`city` varchar(128) NOT NULL,
	`country` varchar(128) NOT NULL,
	`region` varchar(128),
	`address` text,
	`lat` float,
	`lng` float,
	`heroImageUrl` text,
	`description` text NOT NULL,
	`shortDescription` varchar(500),
	`anecdotes` text,
	`thingsToKnow` text,
	`highlights` text,
	`phone` varchar(32),
	`website` text,
	`openingHours` text,
	`priceRange` varchar(64),
	`priceLevel` enum('budget','moderate','upscale','luxury') DEFAULT 'upscale',
	`cuisineType` varchar(128),
	`dressCode` varchar(128),
	`metaTitle` varchar(160),
	`metaDescription` varchar(320),
	`schemaOrg` text,
	`tags` text,
	`rating` decimal(2,1),
	`reviewCount` int DEFAULT 0,
	`reviews` text,
	`viralVideos` text,
	`affiliateLinks` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`viewCount` int DEFAULT 0,
	`generatedBy` enum('ai','manual') NOT NULL DEFAULT 'ai',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `establishments_id` PRIMARY KEY(`id`),
	CONSTRAINT `establishments_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tripDays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripPlanId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`title` varchar(256),
	`summary` text,
	`weatherForecast` text,
	`centerLat` float,
	`centerLng` float,
	`zoomLevel` int DEFAULT 13,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripDays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`title` varchar(256) NOT NULL,
	`tripType` enum('leisure','business','romantic','family','staycation','adventure','wellness') NOT NULL,
	`budgetLevel` enum('economy','moderate','premium','ultra_premium') NOT NULL,
	`originCity` varchar(128),
	`originCountry` varchar(128),
	`originLat` float,
	`originLng` float,
	`destinationCity` varchar(128) NOT NULL,
	`destinationCountry` varchar(128) NOT NULL,
	`destinationLat` float,
	`destinationLng` float,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`travelers` int DEFAULT 1,
	`companionIds` text,
	`estimatedTotal` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`outboundTransport` text,
	`returnTransport` text,
	`status` enum('draft','proposed','accepted','confirmed','completed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripDayId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`stepType` enum('transport_departure','flight','checkin','meal','activity','sightseeing','shopping','relaxation','meeting','transfer','checkout','transport_return','free_time','walk') NOT NULL,
	`establishmentId` int,
	`locationName` varchar(256),
	`address` text,
	`lat` float,
	`lng` float,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`durationMinutes` int,
	`transportMode` enum('walk','car','taxi','uber','chauffeur','bus','metro','train','flight','boat','bike','scooter'),
	`transportDurationMinutes` int,
	`transportDistanceKm` decimal(8,2),
	`transportNotes` text,
	`estimatedCost` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`affiliateLink` text,
	`tips` text,
	`photoUrl` text,
	`confirmed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `affiliateClicks` ADD `establishmentId` int;--> statement-breakpoint
ALTER TABLE `conversations` ADD `tripType` enum('leisure','business','romantic','family','staycation','adventure','wellness');--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentType` enum('none','trip_plan','establishment','map_route','offer') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentData` text;--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `establishmentId` int;--> statement-breakpoint
ALTER TABLE `travelCompanions` ADD `allergies` text;--> statement-breakpoint
ALTER TABLE `travelCompanions` ADD `passportCountry` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(8) DEFAULT 'fr';--> statement-breakpoint
ALTER TABLE `users` ADD `currency` varchar(3) DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE `users` ADD `homeCity` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `homeCountry` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `homeAddress` text;--> statement-breakpoint
ALTER TABLE `users` ADD `homeLat` float;--> statement-breakpoint
ALTER TABLE `users` ADD `homeLng` float;--> statement-breakpoint
ALTER TABLE `users` ADD `budgetPreference` enum('economy','moderate','premium','ultra_premium') DEFAULT 'moderate';--> statement-breakpoint
ALTER TABLE `users` ADD `travelStyle` enum('adventure','relaxation','cultural','business','romantic','family') DEFAULT 'cultural';