"use client";

import { memo } from "react";
import { ShoppingCart, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/hooks/useShoppingCalculator";
import { useTranslation } from "@/contexts/LanguageContext";

interface TotalDisplayProps {
  totalSpent: number;
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
//  • Total acumulado (itens marcados com preço)
//  • Barra de progresso
//  • Estimativa total
// ──────────────────────────────────────────────────────────
const TotalDisplay = memo(function TotalDisplay({
  totalSpent,
  grandTotal,
  checkedCount,
  totalCount,
  progress,
  pendingPriceCount,
}: TotalDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface-800 border-b border-surface-700 px-4 py-3">
      {/* Linha principal */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
            <ShoppingCart size={16} className="text-accent" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">{t.list.inCart}</p>
            <p className="text-sm font-semibold text-zinc-200">
              {checkedCount}/{totalCount} articoli
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500 font-medium">{t.list.totalSpesa}</p>
          <p className="text-2xl font-bold text-accent tabular-nums">
            {formatCurrency(totalSpent)}
          </p>
        </div>
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
          aria-label={`${progress}% completato`}
        />
      </div>

      {/* Linha secundária: estimativa + alertas */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <TrendingUp size={11} />
          <span>{t.list.estimatedTotal}: {formatCurrency(grandTotal)}</span>
        </div>

        {pendingPriceCount > 0 && (
          <p className="text-xs text-amber-400 font-medium">
            ⚠️ {pendingPriceCount} {t.list.withoutPrice}
          </p>
        )}
      </div>
    </div>
  );
});

export default TotalDisplay;