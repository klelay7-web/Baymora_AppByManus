/**
 * Tests unitaires — Système de crédits Baymora
 *
 * Couvre :
 * - Calcul du coût par action (Sonnet, Opus, Perplexity)
 * - Configuration des packs par plan
 * - Configuration des plans (marges ≥ 20%)
 * - Récompenses de partage
 * - Fingerprint guest
 */

import { describe, it, expect } from 'vitest';
import {
  PLANS, CREDIT_PACKS_BY_PLAN, CREDIT_COSTS, UNLOCK_TIERS,
  SHARING_REWARDS, ROLLOVER_MAX_MULTIPLIER, getPacksForPlan,
} from '../types';

// ─── Coûts par action ────────────────────────────────────────────────────────

describe('CREDIT_COSTS', () => {
  it('Sonnet coûte 1 crédit', () => {
    expect(CREDIT_COSTS.message_sonnet).toBe(1);
  });

  it('Opus coûte 3 crédits', () => {
    expect(CREDIT_COSTS.message_opus).toBe(3);
  });

  it('Perplexity coûte 1 crédit supplémentaire', () => {
    expect(CREDIT_COSTS.perplexity_search).toBe(1);
  });
});

// ─── Plans ───────────────────────────────────────────────────────────────────

describe('PLANS', () => {
  it('5 plans existent', () => {
    expect(Object.keys(PLANS)).toHaveLength(5);
  });

  it('Découverte est gratuit avec 15 crédits', () => {
    expect(PLANS.decouverte.priceEurCents).toBe(0);
    expect(PLANS.decouverte.creditsLimit).toBe(15);
  });

  it('Voyageur à 9.90€ avec 100 crédits', () => {
    expect(PLANS.voyageur.priceEurCents).toBe(990);
    expect(PLANS.voyageur.creditsLimit).toBe(100);
  });

  it('Fondateur à 199€ avec 4000 crédits', () => {
    expect(PLANS.fondateur.priceEurCents).toBe(19900);
    expect(PLANS.fondateur.creditsLimit).toBe(4000);
  });

  it('Tous les plans payants ont un prix > 0', () => {
    const paid = Object.values(PLANS).filter(p => p.circle !== 'decouverte');
    for (const plan of paid) {
      expect(plan.priceEurCents).toBeGreaterThan(0);
    }
  });

  it('Les crédits augmentent avec le prix', () => {
    const circles = ['decouverte', 'voyageur', 'explorateur', 'prive', 'fondateur'] as const;
    for (let i = 1; i < circles.length; i++) {
      expect(PLANS[circles[i]].creditsLimit).toBeGreaterThan(PLANS[circles[i - 1]].creditsLimit);
    }
  });
});

// ─── Packs de crédits par plan ───────────────────────────────────────────────

describe('CREDIT_PACKS_BY_PLAN', () => {
  it('4 plans ont des packs', () => {
    expect(Object.keys(CREDIT_PACKS_BY_PLAN)).toHaveLength(4);
  });

  it('Chaque plan a au moins 3 packs', () => {
    for (const [circle, packs] of Object.entries(CREDIT_PACKS_BY_PLAN)) {
      expect(packs.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('Tous les packs ont une marge ≥ 20%', () => {
    const API_COST_PER_CREDIT = 0.05; // €, mix Opus/Sonnet
    for (const [circle, packs] of Object.entries(CREDIT_PACKS_BY_PLAN)) {
      for (const pack of packs) {
        const cost = pack.credits * API_COST_PER_CREDIT;
        const price = pack.priceEurCents / 100;
        const margin = (price - cost) / price;
        expect(margin, `Pack ${pack.id} (${circle}) : marge ${(margin * 100).toFixed(1)}% < 20%`).toBeGreaterThanOrEqual(0.20);
      }
    }
  });

  it('Le prix par crédit diminue avec la taille du pack (réduction volume)', () => {
    for (const [circle, packs] of Object.entries(CREDIT_PACKS_BY_PLAN)) {
      for (let i = 1; i < packs.length; i++) {
        expect(
          packs[i].pricePerCredit,
          `${circle}: ${packs[i].id} devrait être moins cher/crédit que ${packs[i-1].id}`
        ).toBeLessThanOrEqual(packs[i - 1].pricePerCredit);
      }
    }
  });

  it('getPacksForPlan retourne les bons packs', () => {
    expect(getPacksForPlan('voyageur')).toBe(CREDIT_PACKS_BY_PLAN.voyageur);
    expect(getPacksForPlan('fondateur')).toBe(CREDIT_PACKS_BY_PLAN.fondateur);
    expect(getPacksForPlan('decouverte')).toHaveLength(0);
  });
});

// ─── Unlock tiers ────────────────────────────────────────────────────────────

describe('UNLOCK_TIERS', () => {
  it('3 paliers de déblocage', () => {
    expect(UNLOCK_TIERS).toHaveLength(3);
  });

  it('Le 1er palier est volontairement cher (même prix que Voyageur)', () => {
    // 5 crédits pour 9.90€ vs Voyageur = 100 crédits pour 9.90€/mois
    expect(UNLOCK_TIERS[0].priceEurCents).toBe(990);
    expect(UNLOCK_TIERS[0].credits).toBe(5);
    expect(PLANS.voyageur.priceEurCents).toBe(990);
    // Le ratio unlock/abo est > 10x
    const unlockPerCredit = UNLOCK_TIERS[0].priceEurCents / UNLOCK_TIERS[0].credits;
    const aboPerCredit = PLANS.voyageur.priceEurCents / PLANS.voyageur.creditsLimit;
    expect(unlockPerCredit / aboPerCredit).toBeGreaterThan(10);
  });

  it('Plus on achète, moins cher par crédit', () => {
    for (let i = 1; i < UNLOCK_TIERS.length; i++) {
      const prev = UNLOCK_TIERS[i - 1].priceEurCents / UNLOCK_TIERS[i - 1].credits;
      const curr = UNLOCK_TIERS[i].priceEurCents / UNLOCK_TIERS[i].credits;
      expect(curr).toBeLessThan(prev);
    }
  });
});

// ─── Partage ─────────────────────────────────────────────────────────────────

describe('SHARING_REWARDS', () => {
  it('Le parrainage rapporte plus que le coût de création', () => {
    // Créer un trip coûte ~5-15 crédits (3-5 messages Opus)
    const maxCreationCost = 15;
    expect(SHARING_REWARDS.signupCredits).toBeGreaterThan(maxCreationCost);
  });

  it('Les points club sont positifs', () => {
    expect(SHARING_REWARDS.signupPoints).toBeGreaterThan(0);
  });

  it('La commission booking est entre 1% et 10%', () => {
    expect(SHARING_REWARDS.bookingCommissionPercent).toBeGreaterThanOrEqual(1);
    expect(SHARING_REWARDS.bookingCommissionPercent).toBeLessThanOrEqual(10);
  });
});

// ─── Rollover ────────────────────────────────────────────────────────────────

describe('ROLLOVER', () => {
  it('Multiplicateur de 3x', () => {
    expect(ROLLOVER_MAX_MULTIPLIER).toBe(3);
  });

  it('Un Voyageur peut accumuler max 300 crédits', () => {
    const max = PLANS.voyageur.creditsLimit * ROLLOVER_MAX_MULTIPLIER;
    expect(max).toBe(300);
  });

  it('Un Fondateur peut accumuler max 12000 crédits', () => {
    const max = PLANS.fondateur.creditsLimit * ROLLOVER_MAX_MULTIPLIER;
    expect(max).toBe(12000);
  });
});
