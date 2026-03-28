import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BaymoraUser {
  id: string;
  pseudo: string;
  prenom?: string;
  email?: string;
  mode: 'fantome' | 'signature';
  circle: 'decouverte' | 'essentiel' | 'elite' | 'prive' | 'fondateur';
  messagesUsed: number;
  messagesLimit: number;
  preferences: Record<string, any>;
  travelCompanions: any[];
  importantDates: any[];
  createdAt: string;
}

interface AuthState {
  user: BaymoraUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_KEY = 'baymora_token';
const GUEST_MSG_KEY = 'baymora_guest_msgs';
export const FREE_MESSAGES_LIMIT = 5;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Charger le token au démarrage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetchMe(token);
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const fetchMe = async (token: string) => {
    try {
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setState({ user: data.user, token, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const register = useCallback(async (params: {
    pseudo: string;
    prenom?: string;
    email?: string;
    password?: string;
    mode: 'fantome' | 'signature';
    conversationId?: string; // Pour absorber le profil pré-rempli
  }) => {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur inscription');

    localStorage.setItem(TOKEN_KEY, data.token);
    // Réinitialiser le compteur de messages invité
    localStorage.removeItem(GUEST_MSG_KEY);
    setState({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
    return data.user;
  }, []);

  const login = useCallback(async (params: {
    email?: string;
    pseudo?: string;
    password?: string;
  }) => {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur connexion');

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.removeItem(GUEST_MSG_KEY);
    setState({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const updateUser = useCallback((updates: Partial<BaymoraUser>) => {
    setState(s => s.user ? { ...s, user: { ...s.user, ...updates } } : s);
  }, []);

  return {
    ...state,
    register,
    login,
    logout,
    updateUser,
    authHeader: state.token ? { Authorization: `Bearer ${state.token}` } : {},
  };
}

// ─── Gestion messages invité ─────────────────────────────────────────────────

export function getGuestMessageCount(): number {
  return parseInt(localStorage.getItem(GUEST_MSG_KEY) || '0', 10);
}

export function incrementGuestMessageCount(): number {
  const current = getGuestMessageCount() + 1;
  localStorage.setItem(GUEST_MSG_KEY, String(current));
  return current;
}

export function resetGuestMessageCount(): void {
  localStorage.removeItem(GUEST_MSG_KEY);
}
