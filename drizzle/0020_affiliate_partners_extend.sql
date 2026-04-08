-- Migration: Extend affiliatePartners with affiliateId, signupUrl, status
ALTER TABLE `affiliatePartners` ADD COLUMN `affiliateId` varchar(256);
ALTER TABLE `affiliatePartners` ADD COLUMN `signupUrl` text;
ALTER TABLE `affiliatePartners` ADD COLUMN `status` enum('pending','active','rejected') NOT NULL DEFAULT 'pending';
