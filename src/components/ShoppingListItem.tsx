"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import type { ListItem } from "@/types";
import { formatCurrency } from "@/hooks/useShoppingCalculator";
import clsx from "clsx";

interface ShoppingListItemProps {
  item: ListItem;
  /** Usuário pode editar (editor) ou só visualizar (viewer) */
  canEdit: boolean;
  onCheck: (item: ListItem) => void;
  onUncheck: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

// ──────────────────────────────────────────────────────────
// Componente: ShoppingListItem
//
// Linha individual da lista. Usa memo para evitar re-renders
// quando itens não relacionados são atualizados via Realtime.
// ──────────────────────────────────────────────────────────
const ShoppingListItem = memo(function ShoppingListItem({
  item,
  canEdit,
  onCheck,
  onUncheck,
  onDelete,
}: ShoppingListItemProps) {
  const handleToggle = () => {
    if (!canEdit) return;
    if (item.is_checked) {
      onUncheck(item.id);
    } else {
      onCheck(item);
    }
  };

  return (
    <div
      className={clsx(
        "group flex items-center gap-3 px-4 py-4 mx-3 rounded-xl shadow-lg transition-colors",
        item.is_checked ? "bg-[#1c1c1c]/80" : "bg-[#1a1a1a]",
        "border border-zinc-800/60"
      )}
    >
      {/* Checkbox customizado */}
      <button
        onClick={handleToggle}
        disabled={!canEdit}
        aria-label={item.is_checked ? "Togli dal carrello" : "Aggiungi al carrello"}
        className={clsx(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all",
          item.is_checked
            ? "bg-accent border-accent flex items-center justify-center"
            : "border-zinc-600 hover:border-accent",
          !canEdit && "opacity-50 cursor-default"
        )}
      >
        {item.is_checked && (
          <svg viewBox="0 0 12 10" className="w-3 h-3 text-surface-900 fill-none stroke-surface-900 stroke-2">
            <polyline points="1,5 4,8 11,1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Nome e informações */}
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "text-base font-medium leading-tight truncate transition-all",
            item.is_checked ? "line-through text-zinc-600" : "text-zinc-100"
          )}
        >
          {item.name}
        </p>

        {/* Detalhe: quantidade e preço (apenas quando marcado) */}
        {item.is_checked && item.unit_price !== null ? (
          <p className="text-xs text-accent font-medium mt-0.5">
            {item.quantity} {item.unit} × {formatCurrency(item.unit_price)}{" "}
            <span className="text-accent font-semibold">
              = {formatCurrency(item.quantity * item.unit_price)}
            </span>
          </p>
        ) : item.unit_price !== null ? (
          <p className="text-xs text-zinc-500 mt-0.5">
            Stimato: {formatCurrency(item.unit_price)}/{item.unit}
          </p>
        ) : null}

        {/* Badge IA */}
        {item.ai_matched_label && (
          <p className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1">
            🤖 <span>{item.ai_matched_label}</span>
          </p>
        )}
      </div>

      {/* Subtotal badge (visível apenas quando marcado com preço) */}
      {item.is_checked && item.unit_price !== null && (
        <div className="flex-shrink-0 bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded-lg">
          {formatCurrency(item.quantity * item.unit_price)}
        </div>
      )}

      {/* Botão deletar — sempre visível no mobile, discreto até hover */}
      {canEdit && (
        <button
          onClick={() => onDelete(item.id)}
          className="flex-shrink-0 p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 active:text-red-400 transition-all"
          aria-label="Elimina articolo"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
});

export default ShoppingListItem;
