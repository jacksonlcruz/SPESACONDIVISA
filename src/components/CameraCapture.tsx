"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import type { AiMatchResult, ListItem } from "@/types";
import clsx from "clsx";

interface CameraCaptureProps {
  listItems: ListItem[];
  onMatch: (result: AiMatchResult, imageBase64: string) => void;
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────
// Componente: CameraCapture
//
// Abre a câmera do celular para fotografar uma etiqueta
// de preço. Converte a imagem para base64 e envia para
// a API Route interna /api/ai/match-item, que por sua vez
// chama a OpenAI Vision API.
// ──────────────────────────────────────────────────────────
export default function CameraCapture({ listItems, onMatch, onClose }: CameraCaptureProps) {
  const [status, setStatus]         = useState<"idle" | "processing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Converte para base64
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setPreview(base64);
        setStatus("processing");
        setErrorMsg(null);

        try {
          const res = await fetch("/api/ai/match-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              // Enviamos apenas id + nome para não expor dados sensíveis
              listItems: listItems.map((i) => ({ id: i.id, name: i.name })),
            }),
          });

          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? "Errore del server");
          }

          const result: AiMatchResult = await res.json();
          setStatus("done");
          onMatch(result, base64);
        } catch (err) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : "Errore sconosciuto");
        }
      };
      reader.readAsDataURL(file);
    },
    [listItems, onMatch]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <h2 className="text-lg font-semibold">📷 Scansiona etichetta</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10 transition-colors"
          aria-label="Chiudi fotocamera"
        >
          <X size={22} />
        </button>
      </div>

      {/* Área de preview */}
      <div className="flex-1 flex items-center justify-center px-4">
        {preview ? (
          <img
            src={preview}
            alt="Foto capturada"
            className="max-h-64 w-full object-contain rounded-2xl shadow-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/60">
            <Camera size={64} strokeWidth={1} />
            <p className="text-sm text-center">
              Fai una foto all&apos;etichetta del prezzo o al prodotto
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="px-4 py-2 min-h-12 flex items-center justify-center">
        {status === "processing" && (
          <div className="flex items-center gap-2 text-yellow-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Analisi in corso…</span>
          </div>
        )}
        {status === "done" && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={18} />
            <span className="text-sm">Prodotto riconosciuto!</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Botão de captura */}
      <div className="px-4 pb-8 pt-2 flex flex-col gap-3">
        <label
          className={clsx(
            "flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base cursor-pointer transition-all",
            status === "processing"
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-[#deff9a] text-black active:scale-95 hover:bg-[#deff9a]/90"
          )}
        >
          <Camera size={20} />
          {status === "error" ? "Riprova" : "Scatta foto"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"  // câmera traseira
            className="sr-only"
            onChange={handleCapture}
            disabled={status === "processing"}
          />
        </label>

        {status === "error" && (
          <button
            onClick={() => { setStatus("idle"); setPreview(null); setErrorMsg(null); }}
            className="text-white/60 text-sm text-center underline"
          >
            Inserisci manualmente
          </button>
        )}
      </div>
    </div>
  );
}
