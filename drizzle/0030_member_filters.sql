-- Migration 0030: Member filters (defaults + signatures pour filtres pré-Maya)
CREATE TABLE IF NOT EXISTS `member_defaults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `transportDoorDefault` enum('chauffeur_prive','vtc','taxi','transport_public','voiture_perso','marche','velo') DEFAULT 'vtc',
  `transportLongDefault` enum('train','avion','voiture_perso','chauffeur_longue_distance','bus','jet_prive') DEFAULT 'train',
  `contextSocialDefault` enum('solo','couple','famille','amis','pro') DEFAULT 'couple',
  `enviesDefault` json DEFAULT ('[]'),
  `energieDefault` enum('farniente','equilibre','actif','tres_actif') DEFAULT 'equilibre',
  `budgetMode` enum('illimite','haut_maitrise','equilibre','serre') DEFAULT 'equilibre',
  `budgetRepartition` json DEFAULT ('{"hebergement":30,"gastronomie":30,"activites":20,"transport":15,"shopping":5}'),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user` (`userId`)
);
