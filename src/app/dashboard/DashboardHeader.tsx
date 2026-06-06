"use client";

import { useState } from "react";
import { LogOut, BarChart3, Settings } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";
import { useTranslation, type Locale } from "@/contexts/LanguageContext";

// ──────────────────────────────────────────────────────────
// Client Component: Header do Dashboard
// Gerencia o estado do modal de configurações + seletor de idioma
// ──────────────────────────────────────────────────────────
export default function DashboardHeader() {
  const { t, locale, setLocale } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);

  const languages: { code: Locale; label: string }[] = [
    { code: "it", label: t.language.it },
    { code: "pt", label: t.language.pt },
    { code: "en", label: t.language.en },
  ];

  return (
    <>
      <header className="bg-surface-800 px-4 pt-12 pb-5 border-b border-surface-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
              {t.dashboard.welcome}
            </p>
            <h1 className="text-2xl font-bold text-zinc-100 mt-0.5">
              {t.dashboard.myLists}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/dashboard/stats"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-surface-700 transition-colors text-zinc-400 text-sm font-medium"
              aria-label={t.dashboard.stats}
            >
              <BarChart3 size={16} />
              <span className="text-xs hidden sm:inline">{t.dashboard.stats}</span>
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-surface-700 transition-colors text-zinc-400 text-sm font-medium"
              aria-label={t.dashboard.settings}
            >
              <Settings size={16} />
              <span className="text-xs hidden sm:inline">{t.dashboard.settings}</span>
            </button>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-surface-700 transition-colors text-zinc-400 text-sm font-medium"
                aria-label={t.dashboard.exit}
              >
                <LogOut size={16} />
                <span className="text-xs">{t.dashboard.exit}</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── Seletor de idioma elegante ────────────────────── */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {languages.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLocale(code)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                locale === code
                  ? "bg-[#deff9a] text-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-surface-700"
              }`}
              aria-label={label}
            >
              {locale === code && "✓ "}
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Modal de configurações */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}