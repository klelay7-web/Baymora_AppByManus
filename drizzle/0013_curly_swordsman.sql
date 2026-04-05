ALTER TABLE `ariaMissions` ADD `finalReport` text;--> statement-breakpoint
ALTER TABLE `ariaMissions` ADD `finalReportAt` timestamp;--> statement-breakpoint
ALTER TABLE `ariaMissions` ADD `successScore` int;--> statement-breakpoint
ALTER TABLE `ariaMissions` ADD `completedTasks` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `ariaMissions` ADD `totalTasks` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `ariaMissions` ADD `durationHours` int DEFAULT 24;