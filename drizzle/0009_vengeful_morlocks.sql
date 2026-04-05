ALTER TABLE `seoCards` MODIFY COLUMN `generatedBy` enum('ai','manual','lena') NOT NULL DEFAULT 'ai';--> statement-breakpoint
ALTER TABLE `bundles` ADD `isVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bundles` ADD `lenaCreated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bundles` ADD `seoCardIds` text;--> statement-breakpoint
ALTER TABLE `bundles` ADD `fieldReportIds` text;--> statement-breakpoint
ALTER TABLE `bundles` ADD `sourceType` enum('manual','lena_chat','lena_generate','field_report','ai_auto') DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `seoCards` ADD `isVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `seoCards` ADD `lenaCreated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `seoCards` ADD `fieldReportId` int;--> statement-breakpoint
ALTER TABLE `seoCards` ADD `sourceType` enum('manual','lena_chat','lena_generate','field_report','ai_auto') DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `userDestinations` ADD `isLenaGenerated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `userDestinations` ADD `lenaSessionId` varchar(64);--> statement-breakpoint
ALTER TABLE `userDestinations` ADD `sourceFieldReportId` int;--> statement-breakpoint
ALTER TABLE `userDestinations` ADD `sourceConversationId` int;--> statement-breakpoint
ALTER TABLE `userDestinations` ADD `lenaDecision` enum('pending','keep','delete','convert_bundle','convert_seocard') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `userDestinations` ADD `lenaDecisionAt` timestamp;--> statement-breakpoint
ALTER TABLE `userDestinations` ADD `lenaDecisionNotes` text;