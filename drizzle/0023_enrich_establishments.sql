-- Migration 0023: Add editorial enrichment columns to establishments
ALTER TABLE `establishments` ADD COLUMN `editorialContent` text;
ALTER TABLE `establishments` ADD COLUMN `secretTip` text;
ALTER TABLE `establishments` ADD COLUMN `enrichedAt` timestamp NULL;
