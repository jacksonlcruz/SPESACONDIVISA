"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Translations } from "@/locales/it";
import it from "@/locales/it";
import pt from "@/locales/pt";
import en from "@/locales/en";

// ── Tipos ────────────────────────────────────────────────────────────
export type Locale = "it" | "pt" | "en";

const dictionaries: Record<Locale, Translations> = { it, pt, en };

const STORAGE_KEY = "spesa-locale";

interface LanguageContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "it",
  t: it,
  setLocale: () => {},
});

// ── Provider ─────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");

  // Inicializa: localStorage → navigator.language → fallback "it"
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && ["it", "pt", "en"].includes(stored)) {
      setLocaleState(stored);
    } else {
      const browserLang = navigator.language?.split("-")[0] as Locale;
      const detected = ["it", "pt", "en"].includes(browserLang) ? browserLang : "it";
      setLocaleState(detected as Locale);
    }
  }, []);

  // Sincroniza lang do HTML e persiste no localStorage
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = dictionaries[locale];

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────
export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation deve ser usado dentro de <LanguageProvider>");
  }
  return ctx;
}