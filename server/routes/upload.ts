/**
 * UPLOAD ROUTES — Photos & vidéos pour Atlas, partenaires, profils
 *
 * POST /api/upload/photo   — Upload une photo (max 10 MB)
 * POST /api/upload/video   — Upload une vidéo (max 50 MB)
 * DELETE /api/upload        — Supprimer un fichier
 */

import { Router, RequestHandler } from 'express';
import multer from 'multer';
import { uploadFile, deleteFile, isStorageConfigured } from '../services/storage';

const router = Router();

// ─── Multer config (in-memory, pas de disque) ───────────────────────────────

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez JPG, PNG ou WebP.'));
    }
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez MP4, MOV ou WebM.'));
    }
  },
});

// ─── Middleware auth basique (team ou user authentifié) ──────────────────────

const requireAuth: RequestHandler = (req, res, next) => {
  const baymoraUser = (req as any).baymoraUser;
  if (!baymoraUser?.id) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }
  next();
};

// ─── POST /api/upload/photo ─────────────────────────────────────────────────

router.post('/photo', requireAuth, (req, res, next) => {
  photoUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'Photo trop volumineuse (max 10 MB)' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!isStorageConfigured()) {
      res.status(503).json({ error: 'Storage non configuré. Vérifiez SUPABASE_URL et SUPABASE_SECRET_KEY.' });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ error: 'Aucun fichier envoyé' });
      return;
    }

    // Déterminer le bucket selon le contexte
    const bucket = (req.query.bucket as string) || 'atlas-photos';
    const allowedBuckets = ['atlas-photos', 'partner-photos', 'user-avatars'];
    if (!allowedBuckets.includes(bucket)) {
      res.status(400).json({ error: 'Bucket invalide' });
      return;
    }

    const result = await uploadFile(bucket, file.originalname, file.buffer, file.mimetype);
    if (!result) {
      res.status(500).json({ error: 'Erreur upload' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[UPLOAD] Photo error:', error);
    res.status(500).json({ error: 'Erreur upload photo' });
  }
});

// ─── POST /api/upload/video ─────────────────────────────────────────────────

router.post('/video', requireAuth, (req, res, next) => {
  videoUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'Vidéo trop volumineuse (max 50 MB)' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!isStorageConfigured()) {
      res.status(503).json({ error: 'Storage non configuré' });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ error: 'Aucun fichier envoyé' });
      return;
    }

    const result = await uploadFile('atlas-videos', file.originalname, file.buffer, file.mimetype);
    if (!result) {
      res.status(500).json({ error: 'Erreur upload' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[UPLOAD] Video error:', error);
    res.status(500).json({ error: 'Erreur upload vidéo' });
  }
});

// ─── DELETE /api/upload ─────────────────────────────────────────────────────

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { bucket, path } = req.body;
    if (!bucket || !path) {
      res.status(400).json({ error: 'bucket et path requis' });
      return;
    }
    const ok = await deleteFile(bucket, path);
    res.json({ success: ok });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

export default router;
