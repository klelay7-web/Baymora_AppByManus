CREATE TABLE `baymoraPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`lifetimeEarned` int NOT NULL DEFAULT 0,
	`lifetimeSpent` int NOT NULL DEFAULT 0,
	`lifetimeCashedOut` int NOT NULL DEFAULT 0,
	`tier` enum('bronze','silver','gold','platinum','diamond') NOT NULL DEFAULT 'bronze',
	`lastEarnedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `baymoraPoints_id` PRIMARY KEY(`id`),
	CONSTRAINT `baymoraPoints_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `pointsTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('subscription_reward','referral_bonus','booking_reward','review_reward','social_share','daily_login','spend_upgrade','spend_experience','spend_gift','cashout','admin_adjustment','welcome_bonus') NOT NULL,
	`description` text,
	`referenceType` varchar(64),
	`referenceId` int,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pointsTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPauses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSubscriptionId` varchar(128),
	`pauseStartDate` timestamp NOT NULL,
	`pauseEndDate` timestamp NOT NULL,
	`originalTier` enum('free','explorer','duo','premium','maison') NOT NULL,
	`reason` text,
	`status` enum('active','resumed','expired','cancelled') NOT NULL DEFAULT 'active',
	`autoResumeAt` timestamp,
	`resumedAt` timestamp,
	`maxPauseDays` int NOT NULL DEFAULT 90,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPauses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','explorer','duo','premium','maison') NOT NULL,
	`status` enum('active','paused','cancelled','past_due','trialing') NOT NULL DEFAULT 'active',
	`stripeSubscriptionId` varchar(128),
	`stripeCustomerId` varchar(128),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`monthlyPrice` decimal(6,2),
	`flexibilityOption` boolean DEFAULT false,
	`trialEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`memoryType` enum('fact','preference','experience','relationship','dislike','dream','habit','context') NOT NULL,
	`content` text NOT NULL,
	`confidence` decimal(3,2) DEFAULT '0.80',
	`source` enum('conversation','explicit','inferred','profile') NOT NULL DEFAULT 'conversation',
	`conversationId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMemory_id` PRIMARY KEY(`id`)
);
