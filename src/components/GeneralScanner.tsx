c"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import type { ScanAnyResult, ListItem } from "@/types";

interface GeneralScannerProps {
  listItems: ListItem[];
  onScanResult: (result: ScanAnyResult) => void;
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────
// Componente: GeneralScanner
//
// Scanner Geral — abre a câmera, fotografa qualquer produto,
// envia para a API `/api/ai/scan-any` que identifica o
// produto e preço livremente (sem target_item obrigatório).
//
// O callback `onScanResult` é chamado com o resultado para
// que o componente pai faça a busca por similaridade e
// decida entre abrir modal existente ou perguntar se quer
// adicionar o novo item.
// ──────────────────────────────────────────────────────────
export default function GeneralScanner({ listItems: _listItems, onScanResult, onClose }: GeneralScannerProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // ── Compressão via Canvas ──────────────────────────
      const compressImage = (f: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(f);
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const MAX_WIDTH = 1200;
            const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas non disponibile"));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.75));
          };
          img.onerror = () => reject(new Error("Errore nel caricamento immagine"));
          img.src = objectUrl;
        });

      setStatus("processing");
      setErrorMsg(null);

      try {
        const base64 = await compressImage(file);
        setPreview(base64);

        const res = await fetch("/api/ai/scan-any", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Errore del server");
        }

        const result: ScanAnyResult = await res.json();
        setStatus("done");
        onScanResult(result);
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Errore sconosciuto");
      }
    },
    [onScanResult]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <h2 className="text-lg font-semibold">📷 Scanner Generale</h2>
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
            <p className="text-sm text-center max-w-xs">
              Scansiona qualsiasi prodotto per identificarlo e aggiungerlo alla lista
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
            capture="environment"
            className="sr-only"
            onChange={handleCapture}
            disabled={status === "processing"}
          />
        </label>

        {status === "error" && (
          <button
            onClick={() => {
              setStatus("idle");
              setPreview(null);
              setErrorMsg(null);
            }}
            className="text-white/60 text-sm text-center underline"
          >
            Chiudi
          </button>
        )}
      </div>
    </div>
  );
}