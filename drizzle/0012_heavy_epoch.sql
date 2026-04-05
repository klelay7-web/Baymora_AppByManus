CREATE TABLE `ariaMissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`status` enum('active','completed','cancelled','expired') NOT NULL DEFAULT 'active',
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`authorId` int NOT NULL,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`ariaAck` text,
	`ariaAckAt` timestamp,
	`progressNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ariaMissions_id` PRIMARY KEY(`id`)
);
