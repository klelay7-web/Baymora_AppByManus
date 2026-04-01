/**
 * STORAGE SERVICE — Upload photos/vidéos via Supabase Storage
 *
 * Buckets :
 * - atlas-photos : photos des fiches Atlas (venues, guides, parcours)
 * - atlas-videos : vidéos des fiches Atlas
 * - partner-photos : photos des partenaires
 * - user-avatars : avatars utilisateurs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[STORAGE] SUPABASE_URL ou SUPABASE_SECRET_KEY manquant — uploads désactivés');
      return null;
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// ─── Ensurer bucket exists ──────────────────────────────────────────────────

const ensuredBuckets = new Set<string>();

async function ensureBucket(bucket: string): Promise<boolean> {
  if (ensuredBuckets.has(bucket)) return true;
  const client = getClient();
  if (!client) return false;

  try {
    const { data } = await client.storage.getBucket(bucket);
    if (!data) {
      await client.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50 MB max
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/quicktime', 'video/webm'],
      });
      console.log(`[STORAGE] Bucket créé: ${bucket}`);
    }
    ensuredBuckets.add(bucket);
    return true;
  } catch (e: any) {
    // Bucket might already exist
    if (e.message?.includes('already exists')) {
      ensuredBuckets.add(bucket);
      return true;
    }
    console.error(`[STORAGE] Erreur bucket ${bucket}:`, e.message);
    return false;
  }
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  path: string;
  bucket: string;
}

/**
 * Upload un fichier dans Supabase Storage
 * @param bucket - nom du bucket (atlas-photos, atlas-videos, etc.)
 * @param fileName - nom du fichier (sera préfixé avec un timestamp)
 * @param fileBuffer - contenu du fichier
 * @param mimeType - type MIME (image/jpeg, video/mp4, etc.)
 */
export async function uploadFile(
  bucket: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<UploadResult | null> {
  const client = getClient();
  if (!client) return null;

  const ok = await ensureBucket(bucket);
  if (!ok) return null;

  // Nom unique : timestamp + nom original nettoyé
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const path = `${Date.now()}_${safeName}`;

  const { error } = await client.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error(`[STORAGE] Upload error (${bucket}/${path}):`, error.message);
    return null;
  }

  // Construire l'URL publique
  const { data: { publicUrl } } = client.storage.from(bucket).getPublicUrl(path);

  console.log(`[STORAGE] Upload réussi: ${bucket}/${path} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  return { url: publicUrl, path, bucket };
}

/**
 * Supprimer un fichier de Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) {
    console.error(`[STORAGE] Delete error (${bucket}/${path}):`, error.message);
    return false;
  }
  return true;
}

/**
 * Vérifier si le storage est configuré
 */
export function isStorageConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}
