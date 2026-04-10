-- Migration V7.2b: Table events (Pivot Sortir)
CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` enum('soiree','concert','expo','degustation','spectacle','festival','sport','diner_secret','vip','afterwork','brunch','marche','autre') NOT NULL,
  `venue_name` varchar(255),
  `venue_address` varchar(500),
  `city` varchar(100) NOT NULL,
  `lat` decimal(10,7),
  `lng` decimal(10,7),
  `date` date NOT NULL,
  `time_start` varchar(10),
  `time_end` varchar(10),
  `price` varchar(100),
  `dress_code` varchar(100),
  `image_url` varchar(500),
  `booking_url` varchar(500),
  `is_vip` boolean DEFAULT false,
  `is_members_only` boolean DEFAULT false,
  `source` varchar(100),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
