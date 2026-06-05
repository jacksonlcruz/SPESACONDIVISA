"use client";

import { useState } from "react";
import { X, Settings, FileText, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import clsx from "clsx";

interface SettingsModalProps {
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────
// Componente: SettingsModal
//
// Modal de configurações do usuário. Oferece:
//  • Link para a política de privacidade
//  • Eliminação de conta com confirmação em 2 etapas
//    Etapa 1: Confirmação inicial
//    Etapa 2: Digitar "ELIMINA" para confirmar
// ──────────────────────────────────────────────────────────
export default function SettingsModal({ onClose }: SettingsModalProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "ELIMINA" || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");

      toast.success("Account eliminato. Arrivederci! 👋");
      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Errore";
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Account
              </p>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-zinc-400" />
                Impostazioni
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              aria-label="Chiudi"
            >
              <X size={20} className="text-zinc-400" />
            </button>
          </div>

          {/* Seção: Privacidade */}
          <div className="space-y-3 mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Privacy e Legale
            </h3>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#deff9a]/10 border border-[#deff9a]/20 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-[#deff9a]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white group-hover:text-[#deff9a] transition-colors">
                  Informativa sulla Privacy
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Leggi come trattiamo i tuoi dati
                </p>
              </div>
            </a>
          </div>

          {/* Separador */}
          <div className="h-px bg-zinc-800 mb-6" />

          {/* Seção: Elimina Account */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Zona Pericolosa
            </h3>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-3 w-full p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors">
                    Elimina Account
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Rimuovi permanentemente tutti i tuoi dati
                  </p>
                </div>
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-4">
                {/* Alerta */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-400">
                      Azione irreversibile
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Tutti i tuoi dati saranno eliminati permanentemente:
                      liste della spesa, storico acquisti, condivisioni e
                      profilo. Questa azione non può essere annullata.
                    </p>
                  </div>
                </div>

                {/* Input de confirmação */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                    Digita "ELIMINA" per confermare
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder='Scrivi "ELIMINA" qui'
                    autoComplete="off"
                    className="w-full rounded-2xl border border-red-500/30 bg-zinc-900 px-4 py-3 text-base font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-colors tracking-widest text-center"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmText("");
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-sm font-semibold text-zinc-300 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={confirmText !== "ELIMINA" || isDeleting}
                    className={clsx(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                      confirmText === "ELIMINA"
                        ? "bg-red-500 text-white active:scale-[0.97]"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    )}
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={14} />
                        Elimina tutto
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}