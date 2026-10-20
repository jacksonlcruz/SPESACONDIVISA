import { useMemo } from "react";
import type { ListItem } from "@/types";
import { isFoodItem } from "@/lib/foodCategory";

// ──────────────────────────────────────────────────────────
// Hook: useShoppingCalculator
//
// Calcula, de forma reativa, todos os totais derivados da
// lista de itens. Usa useMemo para re-calcular apenas quando
// o array `items` mudar — evita cálculos desnecessários.
//
// Além do total geral, separa o carrinho em:
//   • alimentícios      (foodTotal)
//   • não alimentícios  (nonFoodTotal) — inclui os itens ainda
//     sem categoria, garantindo foodTotal + nonFoodTotal === totalSpent
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

    const subtotalOf = (item: ListItem) => item.quantity * (item.unit_price ?? 0);

    // ── Total gasto = soma dos subtotais dos itens com preço
    const totalSpent = checkedWithPrice.reduce(
      (acc, item) => acc + subtotalOf(item),
      0
    );

    // ── Divisão alimentício x restante (mesma regra da UI)
    const foodItems = checkedWithPrice.filter((i) => isFoodItem(i));
    const nonFoodItems = checkedWithPrice.filter((i) => !isFoodItem(i));

    const foodTotal = foodItems.reduce((acc, item) => acc + subtotalOf(item), 0);
    const nonFoodTotal = nonFoodItems.reduce((acc, item) => acc + subtotalOf(item), 0);

    // ── Estimativa total (itens não marcados com preço já definido)
    const estimatedPending = items
      .filter((i) => !i.is_checked && i.unit_price !== null)
      .reduce((acc, item) => acc + subtotalOf(item), 0);

    // ── Progresso (percentual de itens marcados)
    const progress =
      items.length > 0
        ? Math.round((items.filter((i) => i.is_checked).length / items.length) * 100)
        : 0;

    return {
      /** Total em dinheiro já gasto (itens no carrinho com preço) */
      totalSpent,
      /** Subtotal dos itens alimentícios no carrinho */
      foodTotal,
      /** Subtotal dos itens não alimentícios (inclui os sem categoria) */
      nonFoodTotal,
      /** Estimativa dos itens restantes com preço definido */
      estimatedPending,
      /** Previsão total (gasto + estimativa pendente) */
      grandTotal: totalSpent + estimatedPending,
      /** Número de itens já marcados */
      checkedCount: items.filter((i) => i.is_checked).length,
      /** Itens no carrinho com preço informado (usado no resumo de totais) */
      pricedCount: checkedWithPrice.length,
      /** Itens alimentícios no carrinho */
      foodCount: foodItems.length,
      /** Itens não alimentícios no carrinho */
      nonFoodCount: nonFoodItems.length,
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
