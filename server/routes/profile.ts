import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  initializeClientMemory,
  getClientMemory,
  updateClientPreferences,
  generateMemorySummary,
  exportClientProfile,
  deleteClientMemory,
} from '../services/ai/memory';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/profile
 * Récupérer le profil du client actuel
 */
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).admin?.userId || 'guest-default';

    const memory = getClientMemory(userId);

    if (!memory) {
      res.status(404).json({
        error: 'Profil non trouvé',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      userId: memory.userId,
      preferences: memory.preferences,
      lastUpdated: memory.lastUpdated,
      confidenceScores: memory.confidenceScores,
      conversationCount: memory.conversationHistory.length,
    });
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du profil',
      code: 'PROFILE_ERROR',
    });
  }
};

/**
 * GET /api/profile/:userId
 * Récupérer le profil d'un utilisateur spécifique
 */
export const handleGetUserProfile: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const memory = getClientMemory(userId);

    if (!memory) {
      res.status(404).json({
        error: 'Profil non trouvé',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      userId: memory.userId,
      preferences: memory.preferences,
      lastUpdated: memory.lastUpdated,
      confidenceScores: memory.confidenceScores,
      conversationCount: memory.conversationHistory.length,
    });
  } catch (error) {
    console.error('Erreur getUserProfile:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du profil',
      code: 'PROFILE_ERROR',
    });
  }
};

/**
 * PATCH /api/profile/preferences
 * Mettre à jour les préférences
 */
export const handleUpdatePreferences: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).admin?.userId || 'guest-default';
    const { preferences, confidenceScores } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      res.status(400).json({
        error: 'Preferences objet requis',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    updateClientPreferences(
      userId,
      preferences,
      confidenceScores || {}
    );

    const memory = getClientMemory(userId);

    res.status(200).json({
      userId: memory?.userId,
      preferences: memory?.preferences,
      lastUpdated: memory?.lastUpdated,
      confidenceScores: memory?.confidenceScores,
    });
  } catch (error) {
    console.error('Erreur updatePreferences:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour',
      code: 'PROFILE_ERROR',
    });
  }
};

/**
 * GET /api/profile/summary
 * Obtenir un résumé des préférences
 */
export const handleGetPreferenceSummary: RequestHandler = async (
  req,
  res
) => {
  try {
    const userId = (req as any).admin?.userId || 'guest-default';

    const summary = generateMemorySummary(userId);

    res.status(200).json({
      userId,
      summary,
    });
  } catch (error) {
    console.error('Erreur getPreferenceSummary:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du résumé',
      code: 'PROFILE_ERROR',
    });
  }
};

/**
 * GET /api/profile/:userId/export
 * Exporter le profil en Markdown
 */
export const handleExportProfile: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const markdown = exportClientProfile(userId);

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="profil-baymora-${userId}.md"`
    );
    res.status(200).send(markdown);
  } catch (error) {
    console.error('Erreur exportProfile:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'export',
      code: 'PROFILE_ERROR',
    });
  }
};

/**
 * DELETE /api/profile/:userId
 * Supprimer le profil (GDPR)
 */
export const handleDeleteProfile: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).admin?.userId || 'guest-default';

    // Vérifier que l'utilisateur supprime son propre profil
    if (userId !== currentUserId) {
      res.status(403).json({
        error: 'Vous pouvez seulement supprimer votre propre profil',
        code: 'FORBIDDEN',
      });
      return;
    }

    const deleted = deleteClientMemory(userId);

    if (!deleted) {
      res.status(404).json({
        error: 'Profil non trouvé',
        code: 'NOT_FOUND',
      });
      return;
    }

    console.log(`[PROFILE] Profil supprimé: ${userId} (demande GDPR)`);

    res.status(200).json({
      message: 'Profil supprimé avec succès',
      userId,
    });
  } catch (error) {
    console.error('Erreur deleteProfile:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression',
      code: 'PROFILE_ERROR',
    });
  }
};

/**
 * POST /api/profile/initialize
 * Initialiser le profil d'un utilisateur
 */
export const handleInitializeProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).admin?.userId || 'guest-' + uuidv4();

    const memory = initializeClientMemory(userId);

    res.status(201).json({
      userId: memory.userId,
      preferences: memory.preferences,
      message: 'Profil initialisé',
    });
  } catch (error) {
    console.error('Erreur initializeProfile:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'initialisation',
      code: 'PROFILE_ERROR',
    });
  }
};

// Register routes
router.get('/', handleGetProfile);
router.get('/:userId', handleGetUserProfile);
router.get('/:userId/export', handleExportProfile);
router.patch('/preferences', handleUpdatePreferences);
router.get('/summary', handleGetPreferenceSummary);
router.delete('/:userId', handleDeleteProfile);
router.post('/initialize', handleInitializeProfile);

export default router;
