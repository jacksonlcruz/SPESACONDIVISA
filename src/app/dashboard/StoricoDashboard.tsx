"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/hooks/useShoppingCalculator";
import { useTranslation } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

// ── Tipos ────────────────────────────────────────────────────────────────
type SpesaGroup = {
  key: string;
  dateLabel: string;
  listId: string;
  listTitle: string;
  listEmoji: string;
  itemCount: number;
  total: number;
};

type PurchasedItem = {
  id: string;
  name: string;
  unit: string | null;
  quantity: number;
  unit_price: number | null;
  purchased_at: string;
  list_id: string;
};

interface StoricoDashboardProps {
  groups: SpesaGroup[];
  allItems: PurchasedItem[];
}

// ──────────────────────────────────────────────────────────────────────────
// StoricoDashboard — renderiza cards clicáveis + bottom sheet de detalhes
// ──────────────────────────────────────────────────────────────────────────
export default function StoricoDashboard({ groups, allItems }: StoricoDashboardProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<SpesaGroup | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  // Filtra os itens do grupo selecionado usando a `key` como identificador único
  const groupItems: PurchasedItem[] = selectedGroup
    ? allItems.filter((i) => {
        const dateKey = i.purchased_at.split("T")[0];
        return `${dateKey}_${i.list_id}` === selectedGroup.key;
      })
    : [];

  // ── Clona o grupo como nova lista limpa ──────────────────────────────
  const handleClone = useCallback(async () => {
    if (!selectedGroup || isCloning) return;
    setIsCloning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t.dashboard.notAuthenticated);

      // 1. Cria nova lista com o título/emoji originais
      const { data: newList, error: listError } = await supabase
        .from("lists")
        .insert({
          owner_id: user.id,
          title: selectedGroup.listTitle,
          emoji: selectedGroup.listEmoji,
        })
        .select("id")
        .single();
      if (listError || !newList) throw listError ?? new Error(t.dashboard.errorCreatingList);

      // 2. Insere os itens na nova lista
      const itemsToInsert = groupItems.map((item, idx) => ({
        list_id: newList.id,
        name: item.name,
        quantity: 1,
        unit: item.unit ?? "pz",
        unit_price: null,
        is_checked: false,
        status: "pending",
        sort_order: idx,
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from("list_items")
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      toast.success(t.dashboard.cloneSuccess);
      router.push(`/lista/${newList.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.dashboard.unknownError;
      toast.error(`${t.dashboard.cloneError} ${msg}`);
      setIsCloning(false);
    }
  }, [selectedGroup, isCloning, groupItems, router, t]);

  if (groups.length === 0) return null;

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : "it-IT";

  return (
    <>
      {/* ── Cards do histórico (clicáveis) ──────────────────── */}
      <div className="flex items-center gap-2 pt-4 pb-1 px-1">
        <span className="text-lg">📜</span>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {t.dashboard.storicoSpese}
        </p>
      </div>

      {groups.map((group) => (
        <button
          key={group.key}
          onClick={() => setSelectedGroup(group)}
          className="w-full bg-surface-800 rounded-2xl px-4 py-4 border border-surface-700 hover:border-zinc-600 active:scale-[0.98] transition-all text-left"
        >
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">
            🗓 {group.dateLabel}
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-700 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              {group.listEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-200 truncate text-sm">{group.listTitle}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {group.itemCount}{" "}
                {group.itemCount === 1 ? t.dashboard.articlePurchased : t.dashboard.articlesPurchased}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-[#deff9a]">
                {group.total.toLocaleString(dateLocale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}€
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{t.dashboard.tapForDetails}</p>
            </div>
          </div>
        </button>
      ))}

      {/* ── Bottom Sheet de detalhes ─────────────────────────── */}
      {selectedGroup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/80 animate-fade-in"
            onClick={() => !isCloning && setSelectedGroup(null)}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#0d0d0d] border border-zinc-800 border-b-0 rounded-t-3xl shadow-2xl animate-slide-up max-h-[88vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Cabeçalho */}
            <div className="flex items-start justify-between px-5 pt-2 pb-3 flex-shrink-0">
              <div>
                <p className="text-xs text-zinc-500 font-medium mb-1">
                  📜 {t.dashboard.storicoSpese} · {selectedGroup.dateLabel}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedGroup.listEmoji}</span>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {selectedGroup.listTitle}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                disabled={isCloning}
                aria-label={t.dashboard.close}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors flex-shrink-0 mt-1"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Lista de itens (scrollável) */}
            <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-2">
              {groupItems.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-6">
                  {t.dashboard.noDetails}
                </p>
              ) : (
                groupItems.map((item) => {
                  const subtotal = item.quantity * (item.unit_price ?? 0);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-[#1a1a1a] border border-zinc-800/60 rounded-2xl px-4 py-3"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.quantity} {item.unit ?? "pz"} × {formatCurrency(item.unit_price ?? 0)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#deff9a] flex-shrink-0">
                        {formatCurrency(subtotal)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé: total + botão clonar */}
            <div className="flex-shrink-0 border-t border-zinc-800 px-5 pt-4 pb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-400">{t.dashboard.totalSpesa}</span>
                <span className="text-xl font-bold text-[#deff9a]">
                  {selectedGroup.total.toLocaleString(dateLocale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}€
                </span>
              </div>

              <button
                onClick={handleClone}
                disabled={isCloning}
                className="w-full py-4 bg-[#deff9a] disabled:opacity-60 text-black font-bold rounded-2xl text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {isCloning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t.dashboard.cloning}
                  </>
                ) : (
                  t.dashboard.copyAsNewList
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}