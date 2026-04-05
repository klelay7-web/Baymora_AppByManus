CREATE TABLE `aiDepartmentReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`department` enum('seo','content','acquisition','concierge','analytics') NOT NULL,
	`reportDate` varchar(10) NOT NULL,
	`summary` text NOT NULL,
	`metrics` text,
	`alerts` text,
	`status` enum('healthy','attention','critical') NOT NULL DEFAULT 'healthy',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiDepartmentReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiDirectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`department` enum('seo','content','acquisition','concierge','analytics','all') NOT NULL,
	`directive` text NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('active','completed','cancelled','expired') NOT NULL DEFAULT 'active',
	`completedTasks` int DEFAULT 0,
	`totalTasks` int DEFAULT 0,
	`aiResponse` text,
	`completedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiDirectives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ambassadors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralCode` varchar(32) NOT NULL,
	`tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`totalReferrals` int DEFAULT 0,
	`activeReferrals` int DEFAULT 0,
	`totalEarnings` decimal(10,2) DEFAULT '0.00',
	`pendingEarnings` decimal(10,2) DEFAULT '0.00',
	`commissionRate` decimal(5,2) DEFAULT '10.00',
	`paypalEmail` varchar(320),
	`iban` varchar(64),
	`status` enum('active','suspended','pending') NOT NULL DEFAULT 'pending',
	`activatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ambassadors_id` PRIMARY KEY(`id`),
	CONSTRAINT `ambassadors_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(256) NOT NULL,
	`title` varchar(256) NOT NULL,
	`subtitle` varchar(256),
	`description` text NOT NULL,
	`coverImageUrl` text,
	`category` enum('weekend','honeymoon','gastronomie','aventure','wellness','culture','business','family','seasonal') NOT NULL,
	`destination` varchar(256),
	`duration` varchar(64),
	`priceFrom` decimal(10,2),
	`priceTo` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`includes` text,
	`establishmentIds` text,
	`accessLevel` enum('free','explorer','premium','elite') NOT NULL DEFAULT 'explorer',
	`isVip` boolean DEFAULT false,
	`isFeatured` boolean DEFAULT false,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`viewCount` int DEFAULT 0,
	`bookingCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bundles_id` PRIMARY KEY(`id`),
	CONSTRAINT `bundles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`coverImageUrl` text,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissionPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientType` enum('ambassador','partner','influencer','concierge') NOT NULL,
	`recipientId` int NOT NULL,
	`recipientName` varchar(256),
	`sourceType` enum('referral','booking','affiliation','subscription') NOT NULL,
	`sourceId` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`status` enum('pending','processing','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(64),
	`transactionRef` varchar(256),
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissionPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentCalendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`contentType` enum('blog_article','instagram_post','instagram_reel','tiktok_video','linkedin_post','youtube_video','twitter_post') NOT NULL,
	`topic` text,
	`brief` text,
	`generatedContent` text,
	`generatedMediaUrls` text,
	`scheduledDate` varchar(10) NOT NULL,
	`scheduledTime` varchar(5),
	`platform` enum('instagram','tiktok','linkedin','twitter','youtube','blog') NOT NULL,
	`status` enum('idea','generating','review','approved','scheduled','published','failed') NOT NULL DEFAULT 'idea',
	`performance` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentCalendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetType` enum('establishment','seoCard','tripPlan','bundle') NOT NULL,
	`targetId` int NOT NULL,
	`collectionId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ambassadorId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(32) NOT NULL,
	`status` enum('signed_up','subscribed','churned') NOT NULL DEFAULT 'signed_up',
	`subscriptionTier` varchar(32),
	`commissionEarned` decimal(10,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`convertedAt` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceProviders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`category` enum('hotel','restaurant','yacht','chauffeur','spa','concierge_local','concierge_international','real_estate','luxury_goods','experience','transport') NOT NULL,
	`contactName` varchar(256),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`city` varchar(128),
	`country` varchar(128),
	`website` text,
	`logoUrl` text,
	`description` text,
	`commissionRate` decimal(5,2) DEFAULT '10.00',
	`contractType` enum('standard','premium','exclusive') DEFAULT 'standard',
	`contractExpiry` varchar(10),
	`totalReservations` int DEFAULT 0,
	`totalRevenue` decimal(10,2) DEFAULT '0.00',
	`rating` decimal(2,1),
	`linkedEstablishments` int DEFAULT 0,
	`status` enum('active','pending','suspended','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceProviders_id` PRIMARY KEY(`id`),
	CONSTRAINT `serviceProviders_slug_unique` UNIQUE(`slug`)
);
