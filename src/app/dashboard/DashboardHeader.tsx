"use client";

import { useState } from "react";
import { LogOut, BarChart3, Settings } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";

// ──────────────────────────────────────────────────────────
// Client Component: Header do Dashboard
// Gerencia o estado do modal de configurações
// ──────────────────────────────────────────────────────────
export default function DashboardHeader() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="bg-surface-800 px-4 pt-12 pb-5 border-b border-surface-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
              Benvenuto/a
            </p>
            <h1 className="text-2xl font-bold text-zinc-100 mt-0.5">
              Le mie liste
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/dashboard/stats"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-surface-700 transition-colors text-zinc-400 text-sm font-medium"
              aria-label="Statistiche"
            >
              <BarChart3 size={16} />
              <span className="text-xs hidden sm:inline">Statistiche</span>
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-surface-700 transition-colors text-zinc-400 text-sm font-medium"
              aria-label="Impostazioni"
            >
              <Settings size={16} />
              <span className="text-xs hidden sm:inline">Impostazioni</span>
            </button>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-surface-700 transition-colors text-zinc-400 text-sm font-medium"
                aria-label="Esci"
              >
                <LogOut size={16} />
                <span className="text-xs">Esci</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Modal de configurações */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}