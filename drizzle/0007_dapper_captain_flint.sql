CREATE TABLE `pilotageMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`actionType` enum('chat','order_team','modify_app','analyze','report','alert') DEFAULT 'chat',
	`targetDepartment` varchar(64),
	`orderStatus` enum('pending','in_progress','done','cancelled') DEFAULT 'pending',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilotageMessages_id` PRIMARY KEY(`id`)
);
