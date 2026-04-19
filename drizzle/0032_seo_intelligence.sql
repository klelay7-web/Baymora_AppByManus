-- Migration 0032: SEO Intelligence (renseignement concurrentiel)
CREATE TABLE IF NOT EXISTS `seo_intelligence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `source` varchar(100) NOT NULL,
  `sourceUrl` varchar(500),
  `pageUrl` varchar(500),
  `pageTitle` varchar(300),
  `city` varchar(100),
  `country` varchar(100) DEFAULT 'France',
  `category` varchar(50),
  `searchIntent` varchar(300),
  `establishmentsMentioned` json DEFAULT NULL,
  `contentPageGenerated` boolean DEFAULT FALSE,
  `scrapedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_city` (`city`),
  KEY `idx_source` (`source`)
);
