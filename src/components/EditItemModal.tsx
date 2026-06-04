"use client";

import { useState } from "react";
import { X, Euro, Trash2, ShoppingCart } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { ListItem } from "@/types";
import { formatCurrency } from "@/hooks/useShoppingCalculator";
import clsx from "clsx";

interface EditItemModalProps {
  item: ListItem;
  onSave: (itemId: string, quantity: number, unitPrice: number | null) => Promise<void>;
  onUncheck?: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => void;
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────
// Componente: EditItemModal
//
// Modal de edição de item. Permite:
//  • Alterar quantidade (PZ) e preço unitário
//  • Salvar alterações no Supabase
//  • Remover do carrinho (se is_checked)
//  • Excluir o item permanentemente
// ──────────────────────────────────────────────────────────
export default function EditItemModal({
  item,
  onSave,
  onUncheck,
  onDelete,
  onClose,
}: EditItemModalProps) {
  const [quantity, setQuantity] = useState<string>(String(item.quantity));
  const [unitPrice, setUnitPrice] = useState<string>(
    item.unit_price != null ? String(item.unit_price) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUnchecking, setIsUnchecking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const qty = parseFloat(quantity) || 0;
  const price = unitPrice ? parseFloat(unitPrice) || 0 : null;
  const subtotal = qty && price ? qty * price : null;

  // ── Salvar ─────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving || qty <= 0) return;
    setIsSaving(true);
    try {
      await onSave(item.id, qty, price);
      onClose();
    } catch {
      // erro tratado pelo pai
    } finally {
      setIsSaving(false);
    }
  };

  // ── Remover do carrinho ────────────────────────────────
  const handleUncheck = async () => {
    if (isUnchecking || !onUncheck) return;
    setIsUnchecking(true);
    try {
      await onUncheck(item.id);
      onClose();
    } catch {
      // erro tratado pelo pai
    } finally {
      setIsUnchecking(false);
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
                Modifica articolo
              </p>
              <h2 className="text-xl font-bold text-white leading-tight">
                {item.name}
              </h2>
              {item.is_checked && (
                <span className="inline-block mt-1 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  Nel carrello
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              aria-label="Chiudi"
            >
              <X size={20} className="text-zinc-400" />
            </button>
          </div>

          {/* Campos */}
          <div className="space-y-4 mb-5">
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

            {/* Preview subtotal */}
            {subtotal != null && subtotal > 0 && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Subtotale</span>
                <span className="text-base font-bold text-[#deff9a]">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            {/* Salvar */}
            <button
              onClick={handleSave}
              disabled={isSaving || qty <= 0}
              className={clsx(
                "w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2",
                qty > 0
                  ? "bg-[#deff9a] text-black active:scale-95"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "💾 Salva modifiche"
              )}
            </button>

            {/* Remover do carrinho (apenas se is_checked) */}
            {item.is_checked && onUncheck && (
              <button
                onClick={handleUncheck}
                disabled={isUnchecking}
                className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold text-zinc-300 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isUnchecking ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Rimuovi dal carrello
                  </>
                )}
              </button>
            )}

            {/* Excluir */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Trash2 size={16} />
                Elimina articolo
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 space-y-3">
                <p className="text-sm text-red-400 text-center">
                  Eliminare &ldquo;{item.name}&rdquo;?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-sm font-semibold text-zinc-400 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => {
                      onDelete(item.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-bold text-white transition-colors active:scale-[0.98] flex items-center justify-center gap-1"
                  >
                    <Trash2 size={13} />
                    Sì, elimina
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