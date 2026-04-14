-- Migration 0024: Outbound clicks tracking
CREATE TABLE IF NOT EXISTS `outbound_clicks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `establishmentId` int NOT NULL,
  `type` enum('website','phone','maps','reservation') NOT NULL,
  `url` text NOT NULL,
  `userId` int NULL,
  `clickedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_outbound_establishmentId` (`establishmentId`),
  KEY `idx_outbound_clickedAt` (`clickedAt`)
);
