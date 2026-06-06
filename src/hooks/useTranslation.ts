import { useContext } from "react";
import { LanguageContext, type SupportedLocale } from "@/contexts/LanguageContext";

// ──────────────────────────────────────────────────────────
// Hook: useTranslation
//
// Consome o LanguageContext reativo e retorna:
//  • locale  — "it" | "pt" | "en"
//  • setLocale — função para alterar o idioma (reativo)
//  • t       — objeto de tradução tipado (TranslationSchema)
// ──────────────────────────────────────────────────────────
export function useTranslation() {
  const ctx = useContext(LanguageContext);
  return ctx;
}

// Re-export para compatibilidade
export type { SupportedLocale };
