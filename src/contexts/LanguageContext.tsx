"use client";

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import it from "@/locales/it";
import pt from "@/locales/pt";
import en from "@/locales/en";
import type { TranslationSchema } from "@/locales/types";

// ──────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────
export type SupportedLocale = "it" | "pt" | "en";

const STORAGE_KEY = "spesa-locale";

const dictionaries: Record<SupportedLocale, TranslationSchema> = {
  it,
  pt,
  en,
};

// ── Parsing seguro do locale do localStorage (SSR-safe) ──
function getInitialLocale(): SupportedLocale {
  if (typeof window === "undefined") return "it";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "it" || stored === "pt" || stored === "en") return stored;
  } catch {
    // localStorage indisponível (SSR)
  }
  return "it";
}

// ── Interface do contexto ─────────────────────────────────
interface LanguageContextValue {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  t: TranslationSchema;
}

// ── Contexto ──────────────────────────────────────────────
export const LanguageContext = createContext<LanguageContextValue>({
  locale: "it",
  setLocale: () => {},
  t: dictionaries.it,
});

// ── Provider ──────────────────────────────────────────────
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("it");

  // Hydrate no cliente
  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    document.documentElement.lang = initial === "pt" ? "pt-BR" : initial;
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // safe
    }
    document.documentElement.lang = newLocale === "pt" ? "pt-BR" : newLocale;
  }, []);

  const t = dictionaries[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}