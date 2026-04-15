-- Migration 0028: Add enrichStatus to establishments
ALTER TABLE `establishments` ADD COLUMN `enrichStatus` varchar(20) DEFAULT 'pending';
