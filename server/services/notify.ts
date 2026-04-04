/**
 * Baymora — In-App Notification Helpers
 * Convenience functions to create typed notifications.
 */

import { createNotification } from '../routes/notificationsInbox';

// ─── Points earned ───────────────────────────────────────────────────────────

export async function notifyPointsEarned(
  userId: string,
  points: number,
  reason: string,
) {
  return createNotification(
    userId,
    'points_earned',
    `+${points} points gagnés`,
    `Tu as gagné ${points} points : ${reason}`,
    { points, reason },
  );
}

// ─── Trip copied ─────────────────────────────────────────────────────────────

export async function notifyTripCopied(
  userId: string,
  tripTitle: string,
  copierName: string,
) {
  return createNotification(
    userId,
    'trip_copied',
    'Ton voyage a été copié !',
    `${copierName} a copié ton voyage « ${tripTitle} »`,
    { tripTitle, copierName },
  );
}

// ─── Contribution accepted ───────────────────────────────────────────────────

export async function notifyContributionAccepted(
  userId: string,
  contributionTitle: string,
) {
  return createNotification(
    userId,
    'contribution_accepted',
    'Contribution acceptée',
    `Ta contribution « ${contributionTitle} » a été validée par l'équipe Baymora`,
    { contributionTitle },
  );
}
