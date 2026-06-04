"use client";

import { useState, useEffect } from "react";
import { X, Camera, Hash, Euro } from "lucide-react";
import type { AiMatchResult, ListItem } from "@/types";
import { formatCurrency } from "@/hooks/useShoppingCalculator";
import CameraCapture from "./CameraCapture";
import clsx from "clsx";

type PriceModalMode = "manual" | "camera";

interface PriceModalProps {
  item: ListItem;
  listItems: ListItem[];
  /** Total já gasto nos itens que estão no carrinho (em euros) */
  currentCartTotal: number;
  onConfirm: (quantity: number, unitPrice: number, aiData?: Partial<AiMatchResult>) => void;
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────
// Componente: PriceModal
//
// Modal "bottom sheet" que aparece quando o usuário clica
// no checkbox de um item. Oferece dois modos:
//   - Manual: digita quantidade e preço unitário
//   - Câmera: fotografa a etiqueta (IA/OCR)
// ──────────────────────────────────────────────────────────
export default function PriceModal({ item, listItems, currentCartTotal, onConfirm, onClose }: PriceModalProps) {
  const [mode, setMode]           = useState<PriceModalMode>("manual");
  const [quantity, setQuantity]   = useState<string>(String(item.quantity));
  const [unitPrice, setUnitPrice] = useState<string>(item.unit_price ? String(item.unit_price) : "");
  const [aiData, setAiData]       = useState<Partial<AiMatchResult> | undefined>();
  const [showCamera, setShowCamera] = useState(false);

  const qty   = parseFloat(quantity)   || 0;
  const price = parseFloat(unitPrice)  || 0;
  const subtotal      = qty * price;
  const predictedTotal = currentCartTotal + subtotal;

  // Preenche automaticamente preço sugerido pela IA
  useEffect(() => {
    if (aiData?.suggested_price) {
      setUnitPrice(aiData.suggested_price.toFixed(2));
    }
  }, [aiData]);

  const handleConfirm = () => {
    if (qty <= 0 || price <= 0) return;
    onConfirm(qty, price, aiData);
  };

  const handleAiMatch = (result: AiMatchResult) => {
    setAiData(result);
    setShowCamera(false);
    if (result.suggested_price) {
      setUnitPrice(result.suggested_price.toFixed(2));
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        listItems={listItems}
        onMatch={handleAiMatch}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Aggiunta al carrello
              </p>
              <h2 className="text-xl font-bold text-white leading-tight">
                {item.name}
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

          {/* Banner resultado IA */}
          {aiData && (
            <div className="mb-4 p-3 bg-green-950/40 border border-green-800/40 rounded-2xl">
              <p className="text-xs font-semibold text-green-400 mb-0.5">
                🤖 IA: {aiData.matched_label}
              </p>
              <p className="text-xs text-green-500">{aiData.explanation}</p>
              {aiData.ocr_raw && (
                <p className="text-xs text-green-600 mt-1">
                  OCR: <span className="font-mono">{aiData.ocr_raw}</span>
                </p>
              )}
            </div>
          )}

          {/* Seletor de modo */}
          <div className="flex bg-zinc-900 rounded-2xl p-1 mb-5">
            {(["manual", "camera"] as PriceModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  mode === m
                    ? "bg-zinc-800 shadow text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {m === "manual" ? (
                  <><Hash size={14} /> Manuale</>
                ) : (
                  <><Camera size={14} /> Fotocamera</>
                )}
              </button>
            ))}
          </div>

          {mode === "camera" ? (
            /* ── Modo câmera ── */
            <button
              onClick={() => setShowCamera(true)}
              className="w-full py-4 rounded-2xl bg-[#deff9a] text-black font-semibold text-base active:scale-95 transition-transform"
            >
              📷 Apri fotocamera
            </button>
          ) : (
            /* ── Modo manual ── */
            <div className="space-y-4">
              {/* Quantidade */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                  Quantità ({item.unit})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.001"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#deff9a]/30 focus:border-[#deff9a]/40 transition-colors"
                />
              </div>

              {/* Preço unitário */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                  Prezzo unitario (€)
                </label>
                <div className="relative">
                  <Euro
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-3.5 text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#deff9a]/30 focus:border-[#deff9a]/40 transition-colors"
                  />
                </div>
              </div>

              {/* Preview subtotal + total previsto */}
              {subtotal > 0 && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-3.5 space-y-3">
                  {/* Subtotale deste item */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Subtotale articolo</span>
                    <span className="text-base font-bold text-[#deff9a]">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div className="h-px bg-zinc-800" />

                  {/* Novo total previsto */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Totale spesa stimato</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Se aggiungi questo articolo</p>
                    </div>
                    <span className="text-xl font-bold text-[#deff9a]">
                      {formatCurrency(predictedTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botão confirmar */}
          {mode === "manual" && (
            <button
              onClick={handleConfirm}
              disabled={qty <= 0 || price <= 0}
              className={clsx(
                "mt-5 w-full py-4 rounded-2xl font-bold text-base transition-all",
                qty > 0 && price > 0
                  ? "bg-[#deff9a] text-black active:scale-95"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              ✓ Inserisci nel carrello
            </button>
          )}
        </div>
      </div>
    </>
  );
}
