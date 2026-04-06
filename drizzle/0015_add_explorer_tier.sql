ALTER TABLE `users` MODIFY COLUMN `subscriptionTier` enum('free','explorer','premium','elite') NOT NULL DEFAULT 'free';
