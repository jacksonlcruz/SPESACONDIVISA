"use client";

import { useState, useEffect, useCallback } from "react";
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

// ── Hook ──────────────────────────────────────────────────
export function useTranslation() {
  const [locale, setLocaleState] = useState<SupportedLocale>("it");

  // Hydrate no cliente
  useEffect(() => {
    setLocaleState(getInitialLocale());
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

  return { t, locale, setLocale };
}