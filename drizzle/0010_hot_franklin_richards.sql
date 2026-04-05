ALTER TABLE `seoCards` MODIFY COLUMN `category` enum('restaurant','hotel','activity','bar','spa','guide','experience','transport','cityGuide','rooftop','vip','event','boutique','airport','spa_wellness','park_garden','beach','viewpoint','secret_spot','nightlife','shopping_luxury','concierge','villa','private_jet') NOT NULL;--> statement-breakpoint
ALTER TABLE `bundles` ADD `budgetTarget` enum('budget','moderate','premium','luxury') DEFAULT 'moderate';--> statement-breakpoint
ALTER TABLE `bundles` ADD `cityFocus` varchar(128);--> statement-breakpoint
ALTER TABLE `bundles` ADD `seoCardCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `contentCalendar` ADD `blogContent` text;--> statement-breakpoint
ALTER TABLE `contentCalendar` ADD `blogSeoCity` varchar(128);--> statement-breakpoint
ALTER TABLE `contentCalendar` ADD `blogKeywords` text;--> statement-breakpoint
ALTER TABLE `contentCalendar` ADD `blogSlug` varchar(256);--> statement-breakpoint
ALTER TABLE `contentCalendar` ADD `linkedSeoCardIds` text;--> statement-breakpoint
ALTER TABLE `seoCards` ADD `viralVideos` text;