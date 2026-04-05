/**
 * Google OAuth 2.0
 * GET /api/auth/google          → redirige vers Google
 * GET /api/auth/google/callback → reçoit le code, crée/trouve l'user, redirige avec token
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { generateUserToken } from './users';
import { sendWelcomeEmail } from '../services/email';
import { PLANS } from '../types';
import { addPoints, generateInviteCode } from './club';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

function getCallbackUrl(): string {
  const base = process.env.APP_URL || 'https://baymora.com';
  return `${base}/api/auth/google/callback`;
}

// ─── Step 1 : redirection vers Google ────────────────────────────────────────

export const handleGoogleLogin: RequestHandler = (_req, res) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getCallbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

// ─── Step 2 : callback Google ─────────────────────────────────────────────────

export const handleGoogleCallback: RequestHandler = async (req, res) => {
  const { code, error } = req.query as Record<string, string>;
  const frontendBase = process.env.APP_URL || 'https://baymora.com';

  if (error || !code) {
    res.redirect(`${frontendBase}/auth?error=google_denied`);
    return;
  }

  try {
    // 1. Échanger le code contre un access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: getCallbackUrl(),
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      console.error('[GOOGLE] Token exchange failed:', tokenData);
      res.redirect(`${frontendBase}/auth?error=google_token`);
      return;
    }

    // 2. Récupérer les infos utilisateur
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json() as {
      id: string;
      email: string;
      given_name?: string;
      name?: string;
      picture?: string;
    };

    if (!googleUser.id || !googleUser.email) {
      res.redirect(`${frontendBase}/auth?error=google_userinfo`);
      return;
    }

    // 3. Trouver ou créer l'utilisateur
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: googleUser.email.toLowerCase() },
        ],
      },
      include: { companions: true, dates: true },
    });

    const isNewUser = !user;

    if (!user) {
      const prenom = googleUser.given_name || googleUser.name?.split(' ')[0] || '';
      const plan = PLANS.decouverte;
      user = await prisma.user.create({
        data: {
          googleId: googleUser.id,
          email: googleUser.email.toLowerCase(),
          prenom: prenom || null,
          pseudo: prenom || googleUser.email.split('@')[0],
          mode: 'signature',
          preferences: {},
          // Initialisation crédits (plan Découverte)
          creditsUsed: 0,
          creditsLimit: plan.creditsLimit,
          perplexityUsed: 0,
          perplexityLimit: plan.perplexityLimit,
          creditsResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
        include: { companions: true, dates: true },
      });

      // Code d'invitation + points Club
      try {
        let code = generateInviteCode(user.pseudo);
        while (await prisma.inviteCode.findUnique({ where: { code } })) {
          code = generateInviteCode(user.pseudo);
        }
        await prisma.inviteCode.create({ data: { userId: user.id, code } });
        await addPoints(user.id, 'registration', 50, 'Bienvenue au Baymora Club !');
      } catch {}

      console.log(`[GOOGLE] Nouveau compte: ${user.pseudo} (${user.email})`);
    } else if (!user.googleId) {
      // Lier le compte existant à Google
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id },
      });
      console.log(`[GOOGLE] Compte lié: ${user.pseudo}`);
    }

    // 4. Email de bienvenue pour les nouveaux
    if (isNewUser && user.email) {
      sendWelcomeEmail(user.email, user.prenom ?? undefined).catch(() => {});
    }

    // 5. Générer le token JWT et rediriger vers le frontend
    const token = generateUserToken(user.id, user.circle);
    res.redirect(`${frontendBase}/auth/google/success?token=${token}`);

  } catch (err) {
    console.error('[GOOGLE] Callback error:', err);
    res.redirect(`${frontendBase}/auth?error=google_server`);
  }
};

router.get('/', handleGoogleLogin);
router.get('/callback', handleGoogleCallback);

export default router;
