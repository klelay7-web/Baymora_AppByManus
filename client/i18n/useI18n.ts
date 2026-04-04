import { useState, useCallback, useMemo } from "react";
import { translations, type Lang } from "./translations";

const STORAGE_KEY = "baymora_lang";
const SUPPORTED: Lang[] = ["fr", "en"];

/** Detect initial language: localStorage → browser → default "fr" */
function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored as Lang)) return stored as Lang;
  } catch {
    // SSR or blocked localStorage — fall through
  }
  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language?.slice(0, 2);
    if (SUPPORTED.includes(browserLang as Lang)) return browserLang as Lang;
  }
  return "fr";
}

/**
 * Resolve a dot-notated key ("nav.home") against the translations object.
 * Returns the string for the given language, or the key itself as fallback.
 */
function resolve(key: string, lang: Lang): string {
  const parts = key.split(".");
  let node: unknown = translations;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key; // key not found — return as-is for easy debugging
    }
  }
  // At leaf: expect { fr: "...", en: "..." }
  if (node && typeof node === "object" && lang in (node as Record<string, string>)) {
    return (node as Record<string, string>)[lang];
  }
  return key;
}

/**
 * React hook for internationalisation.
 *
 * ```tsx
 * const { t, lang, setLang } = useI18n();
 * <span>{t("nav.home")}</span>
 * <button onClick={() => setLang("en")}>EN</button>
 * ```
 */
export function useI18n() {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // silently ignore if storage is unavailable
    }
  }, []);

  const t = useCallback(
    (key: string): string => resolve(key, lang),
    [lang],
  );

  return useMemo(() => ({ t, lang, setLang }), [t, lang, setLang]);
}
