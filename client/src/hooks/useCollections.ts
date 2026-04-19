import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "baymora_collections";

export interface SavedItem {
  type: "establishment" | "inspiration" | "parcours_maison";
  slug: string;
  name: string;
  photo?: string;
  savedAt: string;
  tags?: string[];
}

function readStorage(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: SavedItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearCollectionsStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getCollectionsForMigration(): SavedItem[] {
  return readStorage();
}

export function useCollections() {
  const [items, setItems] = useState<SavedItem[]>(() => readStorage());

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const saveItem = useCallback((item: SavedItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.slug === item.slug && p.type === item.type)) return prev;
      const next = [...prev, { ...item, savedAt: item.savedAt || new Date().toISOString() }];
      writeStorage(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((slug: string, type: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => !(p.slug === slug && p.type === type));
      writeStorage(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (slug: string, type: string) => items.some((p) => p.slug === slug && p.type === type),
    [items]
  );

  const count = items.length;

  const tagProfile = useMemo(() => {
    const profile: Record<string, number> = {};
    for (const item of items) {
      if (item.tags) {
        for (const tag of item.tags) {
          profile[tag] = (profile[tag] || 0) + 1;
        }
      }
    }
    return profile;
  }, [items]);

  return { savedItems: items, saveItem, removeItem, isSaved, count, tagProfile };
}
