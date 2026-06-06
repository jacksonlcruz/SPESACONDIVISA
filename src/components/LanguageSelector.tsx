"use client";

import { useTranslation, type SupportedLocale } from "@/hooks/useTranslation";
import clsx from "clsx";

// ──────────────────────────────────────────────────────────
// Componente: LanguageSelector
//
// Seletor de idioma com botões discretos para alternar entre
// Italiano, Português e Inglês.
// Usado dentro de SettingsModal.
// ──────────────────────────────────────────────────────────
const flags: Record<SupportedLocale, string> = {
  it: "🇮🇹",
  pt: "🇧🇷",
  en: "🇬🇧",
};

const localeCodes: SupportedLocale[] = ["it", "pt", "en"];

export default function LanguageSelector() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {t.settings.languageSection}
      </h3>
      <div className="flex flex-col gap-2">
        {localeCodes.map((code) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className={clsx(
              "flex items-center gap-3 w-full p-3.5 rounded-2xl border transition-all text-left",
              locale === code
                ? "bg-[#deff9a]/10 border-[#deff9a]/30 text-white"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span className="text-lg">{flags[code]}</span>
            <span
              className={clsx(
                "text-sm font-medium",
                locale === code && "text-[#deff9a]"
              )}
            >
              {code === "it"
                ? t.settings.italian
                : code === "pt"
                ? t.settings.portuguese
                : t.settings.english}
            </span>
            {locale === code && (
              <span className="ml-auto text-xs text-[#deff9a]">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}