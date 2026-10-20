"use client";

import { memo } from "react";
import { ShoppingCart, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/hooks/useShoppingCalculator";
import { useTranslation } from "@/hooks/useTranslation";

interface TotalDisplayProps {
  totalSpent: number;
  /** Subtotal dos itens alimentícios já no carrinho */
  foodTotal: number;
  /** Subtotal dos itens não alimentícios no carrinho */
  nonFoodTotal: number;
  /** Itens no carrinho com preço (controla a exibição da divisão) */
  pricedCount: number;
  grandTotal: number;
  checkedCount: number;
  totalCount: number;
  progress: number;
  pendingPriceCount: number;
}

// ──────────────────────────────────────────────────────────
// Componente: TotalDisplay
//
// Painel fixo no topo (sticky) que exibe:
//  • Divisão alimentícios x não alimentícios
//  • Total do carrinho (sempre visível)
//  • Barra de progresso
//  • Estimativa total
// ──────────────────────────────────────────────────────────
const TotalDisplay = memo(function TotalDisplay({
  totalSpent,
  foodTotal,
  nonFoodTotal,
  pricedCount,
  grandTotal,
  checkedCount,
  totalCount,
  progress,
  pendingPriceCount,
}: TotalDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface-800 border-b border-surface-700 px-4 py-3">
      {/* Linha principal: itens no carrinho + alerta de preço */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
            <ShoppingCart size={16} className="text-accent" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">{t.list.inCartCount}</p>
            <p className="text-sm font-semibold text-zinc-200">
              {checkedCount}/{totalCount}
            </p>
          </div>
        </div>

        {pendingPriceCount > 0 && (
          <p className="text-xs text-amber-400 font-medium">
            {t.list.noPriceWarning.replace("{count}", String(pendingPriceCount))}
          </p>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t.list.progressLabel.replace("{progress}", String(progress))}
        />
      </div>

      {/* Divisão alimentícios x restante + total */}
      <div className="mt-2.5">
        {pricedCount > 0 && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                <span aria-hidden>🍎</span>
                {t.list.foodTotal}
              </span>
              <span className="text-sm font-medium text-zinc-200 tabular-nums">
                {formatCurrency(foodTotal)}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-0.5">
              <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                <span aria-hidden>🧴</span>
                {t.list.nonFoodTotal}
              </span>
              <span className="text-sm font-medium text-zinc-200 tabular-nums">
                {formatCurrency(nonFoodTotal)}
              </span>
            </div>

            <div className="mt-1 border-t border-surface-700" />
          </>
        )}

        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-semibold text-zinc-300">
            {t.list.cartTotal}
          </span>
          <span className="text-2xl font-bold text-accent tabular-nums">
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {/* Linha secundária: estimativa */}
      <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1.5">
        <TrendingUp size={11} />
        <span>{t.list.estimateTotal.replace("{total}", formatCurrency(grandTotal))}</span>
      </div>
    </div>
  );
});

export default TotalDisplay;
