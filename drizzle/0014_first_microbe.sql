CREATE TABLE `agentTaskOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`agent` varchar(64) NOT NULL,
	`requestedBy` varchar(64) NOT NULL DEFAULT 'fondateur',
	`status` enum('pending','in_progress','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`progressPercent` int DEFAULT 0,
	`progressNotes` text,
	`result` text,
	`linkedMissionId` int,
	`linkedFieldReportId` int,
	`linkedSeoCardId` int,
	`dueAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentTaskOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lenaSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionKey` varchar(64) NOT NULL,
	`establishmentName` varchar(256),
	`city` varchar(128),
	`currentStep` varchar(64) NOT NULL DEFAULT 'ACCUEIL',
	`collectedData` text,
	`history` text,
	`scoutBriefing` text,
	`fieldReportId` int,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lenaSessions_id` PRIMARY KEY(`id`)
);
