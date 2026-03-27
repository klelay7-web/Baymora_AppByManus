import { useState, useCallback, useEffect } from 'react';

export interface ClientPreferences {
  travelStyle?: 'adventurous' | 'relaxed' | 'cultural' | 'luxury' | 'budget';
  budget?: {
    min?: number;
    max?: number;
    currency?: 'EUR' | 'USD' | 'GBP';
  };
  favoriteDestinations?: string[];
  cuisine?: string[];
  activities?: string[];
  pace?: 'slow' | 'moderate' | 'fast';
  petFriendly?: boolean;
  accessibility?: string[];
  languages?: string[];
  travelsWithChildren?: boolean;
  childrenAges?: number[];
  travelCompanions?: string[];
}

export interface ClientProfile {
  userId: string;
  preferences: ClientPreferences;
  lastUpdated: string;
  confidenceScores: Record<string, number>;
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger le profil du client
   */
  const loadProfile = useCallback(
    async (id?: string) => {
      if (!id && !userId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/profile/${id || userId}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Profile doesn't exist yet
            return null;
          }
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        setProfile(data);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Mettre à jour les préférences
   */
  const updatePreferences = useCallback(
    async (preferences: Partial<ClientPreferences>) => {
      if (!userId) {
        setError('No user ID');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/profile/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences),
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        const data = await response.json();
        setProfile(data);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Ajouter une destination préférée
   */
  const addFavoriteDestination = useCallback(
    async (destination: string) => {
      if (!profile) return null;

      const updated = {
        ...profile.preferences,
        favoriteDestinations: [
          ...(profile.preferences.favoriteDestinations || []),
          destination,
        ],
      };

      return updatePreferences(updated);
    },
    [profile, updatePreferences]
  );

  /**
   * Retirer une destination préférée
   */
  const removeFavoriteDestination = useCallback(
    async (destination: string) => {
      if (!profile) return null;

      const updated = {
        ...profile.preferences,
        favoriteDestinations:
          profile.preferences.favoriteDestinations?.filter(
            (d) => d !== destination
          ) || [],
      };

      return updatePreferences(updated);
    },
    [profile, updatePreferences]
  );

  /**
   * Exporter le profil
   */
  const exportProfile = useCallback(async () => {
    if (!userId) {
      setError('No user ID');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile/${userId}/export`);

      if (!response.ok) {
        throw new Error('Failed to export profile');
      }

      const data = await response.blob();
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Réinitialiser le profil (GDPR)
   */
  const resetProfile = useCallback(async () => {
    if (!userId) {
      setError('No user ID');
      return false;
    }

    if (
      !confirm(
        'Are you sure? This will delete all your preferences and cannot be undone.'
      )
    ) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reset profile');
      }

      setProfile(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Obtenir un résumé des préférences
   */
  const getPreferenceSummary = useCallback((): string => {
    if (!profile) {
      return 'Aucun profil. Commencez à discuter avec Baymora !';
    }

    const { preferences } = profile;
    const parts: string[] = [];

    if (preferences.travelStyle) {
      parts.push(`Style: ${preferences.travelStyle}`);
    }

    if (preferences.budget?.min || preferences.budget?.max) {
      const min = preferences.budget?.min || '?';
      const max = preferences.budget?.max || '?';
      const currency = preferences.budget?.currency || 'EUR';
      parts.push(`Budget: ${min}-${max} ${currency}`);
    }

    if (preferences.favoriteDestinations?.length) {
      parts.push(
        `Destinations: ${preferences.favoriteDestinations.join(', ')}`
      );
    }

    if (preferences.activities?.length) {
      parts.push(`Activités: ${preferences.activities.join(', ')}`);
    }

    if (preferences.travelsWithChildren) {
      parts.push('Voyage en famille');
    }

    if (preferences.petFriendly) {
      parts.push('Animal de compagnie');
    }

    return parts.length > 0
      ? parts.join(' | ')
      : 'Profil en construction...';
  }, [profile]);

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updatePreferences,
    addFavoriteDestination,
    removeFavoriteDestination,
    exportProfile,
    resetProfile,
    getPreferenceSummary,
  };
}
