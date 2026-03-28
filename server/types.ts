/**
 * SHARED TYPES — Baymora
 * Shared between routes to avoid circular imports.
 */

export interface TravelCompanion {
  id: string;
  name: string;
  relationship: string;
  birthday?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  clothingSize?: string;
  shoeSize?: number;
  diet?: string;
  preferences?: Record<string, any>;
  notes?: string;
  firstMentionedAt?: Date;
  lastSeenWith?: string;
}

export interface ImportantDate {
  id: string;
  label: string;
  date: string;
  recurring: boolean;
  contactName?: string;
  notes?: string;
}

export interface BaymoraUser {
  id: string;
  pseudo: string;
  prenom?: string;
  email?: string;
  mode: 'fantome' | 'signature';
  circle: 'decouverte' | 'essentiel' | 'elite' | 'prive' | 'fondateur';
  messagesUsed: number;
  messagesLimit: number;
  passwordHash?: string;
  googleId?: string;
  preferences: Record<string, any>;
  travelCompanions: TravelCompanion[];
  importantDates: ImportantDate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  language: 'en' | 'fr';
  messages: Message[];
  pendingProfile: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
