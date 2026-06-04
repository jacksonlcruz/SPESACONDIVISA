import { useMemo } from "react";
import type { ListItem } from "@/types";

// ──────────────────────────────────────────────────────────
// Hook: useShoppingCalculator
//
// Calcula, de forma reativa, todos os totais derivados da
// lista de itens. Usa useMemo para re-calcular apenas quando
// o array `items` mudar — evita cálculos desnecessários.
// ──────────────────────────────────────────────────────────
export function useShoppingCalculator(items: ListItem[]) {
  return useMemo(() => {
    // ── Itens no carrinho (is_checked = true COM preço inserido)
    const checkedWithPrice = items.filter(
      (i) => i.is_checked && i.unit_price !== null
    );

    // ── Itens marcados mas ainda sem preço (só check, sem valor)
    const checkedWithoutPrice = items.filter(
      (i) => i.is_checked && i.unit_price === null
    );

    // ── Total gasto = soma dos subtotais dos itens com preço
    const totalSpent = checkedWithPrice.reduce(
      (acc, item) => acc + item.quantity * (item.unit_price ?? 0),
      0
    );

    // ── Estimativa total (itens não marcados com preço já definido)
    const estimatedPending = items
      .filter((i) => !i.is_checked && i.unit_price !== null)
      .reduce((acc, item) => acc + item.quantity * (item.unit_price ?? 0), 0);

    // ── Progresso (percentual de itens marcados)
    const progress =
      items.length > 0
        ? Math.round((items.filter((i) => i.is_checked).length / items.length) * 100)
        : 0;

    return {
      /** Total em dinheiro já gasto (itens no carrinho com preço) */
      totalSpent,
      /** Estimativa dos itens restantes com preço definido */
      estimatedPending,
      /** Previsão total (gasto + estimativa pendente) */
      grandTotal: totalSpent + estimatedPending,
      /** Número de itens já marcados */
      checkedCount: items.filter((i) => i.is_checked).length,
      /** Itens marcados mas sem preço informado */
      pendingPriceCount: checkedWithoutPrice.length,
      /** Total de itens na lista */
      totalCount: items.length,
      /** 0–100 */
      progress,
    };
  }, [items]);
}

// ──────────────────────────────────────────────────────────
// Utilitário: formata valor monetário em estilo europeu (€)
// ──────────────────────────────────────────────────────────
export function formatCurrency(value: number, locale = "it-IT", currency = "EUR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
