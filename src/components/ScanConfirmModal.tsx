"use client";

import { useState } from "react";
import { X, Minus, Plus, Loader2 } from "lucide-react";
import type { ScanAnyResult } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import clsx from "clsx";

interface ScanConfirmModalProps {
  scanResult: ScanAnyResult;
  onConfirm: (quantity: number) => void;
  onDismiss: () => void;
  isAdding: boolean;
}

// ──────────────────────────────────────────────────────────
// Componente: ScanConfirmModal
//
// Modal intermediário que aparece após o scanner IA identificar
// um produto NÃO presente na lista. Permite ao usuário definir
// a QUANTIDADE desejada antes da inserção no banco, evitando
// retrabalho de edição posterior.
// ──────────────────────────────────────────────────────────
export default function ScanConfirmModal({
  scanResult,
  onConfirm,
  onDismiss,
  isAdding,
}: ScanConfirmModalProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState<number>(1);

  const handleIncrement = () => setQuantity((prev) => Math.min(prev + 1, 999));
  const handleDecrement = () => setQuantity((prev) => Math.max(prev - 1, 1));
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 999) {
      setQuantity(val);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/80 animate-fade-in"
        onClick={isAdding ? undefined : onDismiss}
      />

      {/* Modal central */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
        <div className="w-full max-w-sm bg-[#111] border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-slide-up">
          {/* Ícone */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#deff9a]/10 border border-[#deff9a]/20 mx-auto mb-5">
            <span className="text-2xl">📦</span>
          </div>

          {/* Título */}
          <h2 className="text-lg font-bold text-white text-center mb-3">
            {t.list.scanNewProduct}
          </h2>

          {/* Card do produto identificado */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-4 mb-5 space-y-3">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                {t.list.scannedProduct}
              </p>
              <p className="text-lg font-bold text-white">
                &ldquo;{scanResult.product}&rdquo;
              </p>
            </div>

            {scanResult.price != null && (
              <>
                <div className="h-px bg-zinc-800" />
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    {t.list.scannedPrice}
                  </p>
                  <p className="text-xl font-bold text-[#deff9a]">
                    €{scanResult.price.toFixed(2)}
                  </p>
                </div>
              </>
            )}

            <div className="h-px bg-zinc-800" />

            <p className="text-xs text-zinc-500 italic leading-relaxed">
              {scanResult.explanation || t.list.scanExplanation.replace("{explanation}", "")}
            </p>

            {scanResult.ocr_raw && (
              <p className="text-xs text-zinc-600 font-mono">
                {t.list.scanOcr.replace("{text}", scanResult.ocr_raw)}
              </p>
            )}
          </div>

          {/* Seletor de Quantidade */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide text-center">
              {t.list.quantityLabel.replace("{unit}", "pz")}
            </label>
            <div className="flex items-center justify-center gap-4">
              {/* Botão Decrementar */}
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1 || isAdding}
                className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                  quantity > 1
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                )}
                aria-label={t.list.cancel}
              >
                <Minus size={20} />
              </button>

              {/* Input numérico */}
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isAdding}
                className="w-20 text-center bg-transparent text-3xl font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              {/* Botão Incrementar */}
              <button
                onClick={handleIncrement}
                disabled={quantity >= 999 || isAdding}
                className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                  quantity < 999
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                )}
                aria-label={t.list.cancel}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Mensagem de confirmação */}
          <p className="text-sm text-zinc-400 text-center mb-6 leading-relaxed">
            {t.list.scanConfirmQuantity
              .replace("{name}", scanResult.product)
              .replace("{quantity}", String(quantity))
              .replace(
                "{priceMsg}",
                scanResult.price != null
                  ? t.list.scanWithPrice.replace("{price}", scanResult.price.toFixed(2))
                  : t.list.scanWithoutPrice
              )}
          </p>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              disabled={isAdding}
              className="flex-1 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-sm font-semibold text-white transition-colors"
            >
              {t.list.cancel}
            </button>
            <button
              onClick={() => onConfirm(quantity)}
              disabled={isAdding || quantity < 1}
              className="flex-1 py-3.5 rounded-2xl bg-[#deff9a] disabled:opacity-50 text-sm font-bold text-black transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                t.list.scanAddWithQty.replace("{quantity}", String(quantity))
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}