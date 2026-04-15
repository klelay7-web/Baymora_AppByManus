-- Migration 0027: Add homeCity to member_profiles
ALTER TABLE `member_profiles` ADD COLUMN `homeCity` varchar(100) NULL AFTER `userId`;
