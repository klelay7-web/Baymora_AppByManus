/**
 * SHARED STORES — Baymora
 *
 * Centralize in-memory stores to avoid circular imports between routes.
 * Phase 2: replace with PostgreSQL + Prisma.
 */

import type { BaymoraUser, Conversation } from './types';

export const conversationStore = new Map<string, Conversation>();
export const userConversations = new Map<string, string[]>();

export const userStore = new Map<string, BaymoraUser>();
export const emailIndex = new Map<string, string>();   // email → userId
export const pseudoIndex = new Map<string, string>();  // pseudo → userId
