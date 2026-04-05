/**
 * Tests unitaires — Détection de profil IA
 *
 * Couvre :
 * - Détection des 6 modes de voyage
 * - Détection des 4 styles d'interaction
 * - Mode express
 */

import { describe, it, expect } from 'vitest';
import { detectTravelMode, detectInteractionStyle, detectExpressMode } from '../services/ai/profileDetector';
import type { LLMMessage } from '../services/ai/personas';

function msgs(...texts: string[]): LLMMessage[] {
  return texts.map(content => ({ role: 'user' as const, content }));
}

// ─── Modes de voyage ─────────────────────────────────────────────────────────

describe('detectTravelMode', () => {
  it('business : réunion, séminaire', () => {
    expect(detectTravelMode(msgs('Organise-moi un séminaire à Barcelone'))).toBe('business');
    expect(detectTravelMode(msgs('J\'ai une réunion à Paris mardi'))).toBe('business');
  });

  it('hybrid_work : coworking, remote', () => {
    expect(detectTravelMode(msgs('Je bosse en remote, où aller ?'))).toBe('hybrid_work');
    expect(detectTravelMode(msgs('Cherche un spot avec bon wifi et coworking'))).toBe('hybrid_work');
  });

  it('local : chez moi, ma ville', () => {
    expect(detectTravelMode(msgs('Qu\'est-ce que je fais chez moi ce week-end ?'))).toBe('local');
    expect(detectTravelMode(msgs('Je veux des bons plans dans ma ville'))).toBe('local');
  });

  it('lifestyle : ce soir, bon plan', () => {
    expect(detectTravelMode(msgs('Où sortir ce soir à Lyon ?'))).toBe('lifestyle');
    expect(detectTravelMode(msgs('Un bon plan apéro rooftop ?'))).toBe('lifestyle');
  });

  it('discovery : première fois, explorer', () => {
    expect(detectTravelMode(msgs('Je n\'ai jamais allé au Japon, par où commencer ?'))).toBe('discovery');
    expect(detectTravelMode(msgs('Je veux découvrir la Grèce'))).toBe('discovery');
  });

  it('leisure : par défaut', () => {
    expect(detectTravelMode(msgs('Je veux partir en vacances'))).toBe('leisure');
    expect(detectTravelMode(msgs('Bonjour'))).toBe('leisure');
  });
});

// ─── Styles d'interaction ────────────────────────────────────────────────────

describe('detectInteractionStyle', () => {
  it('express : message court et direct', () => {
    expect(detectInteractionStyle(msgs('Prix Ritz Paris ?'))).toBe('express');
    expect(detectInteractionStyle(msgs('Combien le vol ?'))).toBe('express');
    expect(detectInteractionStyle(msgs('Go, réserve'))).toBe('express');
  });

  it('improviser : au feeling, pas de programme', () => {
    expect(detectInteractionStyle(msgs('On verra sur place, pas de programme'))).toBe('improviser');
    expect(detectInteractionStyle(msgs('Je veux de la surprise, au feeling'))).toBe('improviser');
  });

  it('organizer : planifier, jour par jour', () => {
    expect(detectInteractionStyle(msgs('Je veux planifier mon voyage jour par jour'))).toBe('organizer');
    expect(detectInteractionStyle(msgs('Fais-moi un programme détaillé avec horaires et checklist'))).toBe('organizer');
  });

  it('organizer : message long = veut du détail', () => {
    const longMsg = 'a'.repeat(250);
    expect(detectInteractionStyle(msgs(longMsg))).toBe('organizer');
  });

  it('explorer : par défaut (curieux, ouvert)', () => {
    expect(detectInteractionStyle(msgs('Qu\'est-ce que tu recommandes ?'))).toBe('explorer');
    expect(detectInteractionStyle(msgs('Inspire-moi pour cet été'))).toBe('explorer');
  });
});

// ─── Mode express ────────────────────────────────────────────────────────────

describe('detectExpressMode', () => {
  it('détecte les mots-clés express', () => {
    expect(detectExpressMode(msgs('Réserve maintenant'))).toBe(true);
    expect(detectExpressMode(msgs('Le meilleur hôtel, vite'))).toBe(true);
    expect(detectExpressMode(msgs('Go !'))).toBe(true);
  });

  it('ne détecte pas l\'express dans un message normal', () => {
    expect(detectExpressMode(msgs('Je cherche un hôtel sympa à Nice'))).toBe(false);
    expect(detectExpressMode(msgs('Qu\'est-ce que tu recommandes pour un week-end ?'))).toBe(false);
  });
});
