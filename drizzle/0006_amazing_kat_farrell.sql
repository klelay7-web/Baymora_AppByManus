ALTER TABLE `users` MODIFY COLUMN `subscriptionTier` enum('free','premium','elite') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `credits` int NOT NULL DEFAULT 15;--> statement-breakpoint
ALTER TABLE `users` ADD `points` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `pointsLifetime` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `featureVipExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `featureConciergeExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `featureOffMarketExpiry` timestamp;