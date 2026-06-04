"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ListItem } from "@/types";

// ──────────────────────────────────────────────────────────
// Hook: useRealtimeList
//
// Responsabilidade:
//   1. Carrega os itens iniciais da lista no mount.
//   2. Assina um canal Realtime do Supabase (postgres_changes).
//   3. Aplica patches INSERT / UPDATE / DELETE localmente sem
//      re-fetch completo — mantendo a lista sempre sincronizada
//      entre todos os dispositivos conectados.
//
// Fluxo de dados:
//
//   Supabase DB ──(trigger)──► Realtime Server ──(WebSocket)──►
//   ► Channel listener ──► reducer local ──► setState ──► React re-render
//
// ──────────────────────────────────────────────────────────
export function useRealtimeList(listId: string) {
  const [items, setItems]     = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Usamos ref para o canal para poder fazer cleanup mesmo se listId mudar
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── 1. Carregamento inicial ───────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase
      .from("list_items")
      .select("*")
      .eq("list_id", listId)
      .or("status.is.null,status.eq.pending")   // exclui itens já finalizados
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (dbError) {
      setError(dbError.message);
    } else {
      setItems((data as ListItem[]) ?? []);
    }
    setLoading(false);
  }, [listId]);

  // ── 2. Redutores de estado para cada evento ───────────────
  const applyInsert = useCallback((newItem: ListItem) => {
    setItems((prev) => {
      // Evita duplicatas (idempotente)
      if (prev.some((i) => i.id === newItem.id)) return prev;
      return [...prev, newItem].sort((a, b) => a.sort_order - b.sort_order);
    });
  }, []);

  const applyUpdate = useCallback((updatedItem: ListItem) => {
    setItems((prev) => {
      // Se o item foi finalizado, remove da lista ativa
      if (updatedItem.status === "purchased") {
        return prev.filter((i) => i.id !== updatedItem.id);
      }
      return prev.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i));
    });
  }, []);

  const applyDelete = useCallback((deletedItem: Partial<ListItem>) => {
    setItems((prev) => prev.filter((i) => i.id !== deletedItem.id));
  }, []);

  // ── 3. Assinatura Realtime ────────────────────────────────
  useEffect(() => {
    fetchItems();

    // Canal com filtro por list_id para receber apenas eventos desta lista
    const channel = supabase
      .channel(`list-items:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",                     // INSERT | UPDATE | DELETE
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${listId}`, // RLS + filtro de coluna
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          switch (payload.eventType) {
            case "INSERT":
              applyInsert(payload.new as ListItem);
              break;
            case "UPDATE":
              applyUpdate(payload.new as ListItem);
              break;
            case "DELETE":
              applyDelete(payload.old as Partial<ListItem>);
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError("Errore di connessione. Ricarica la pagina.");
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, fetchItems, applyInsert, applyUpdate, applyDelete]);

  // ── 4. Mutações (escrevem no DB; o Realtime propaga) ─────
  const addItem = useCallback(
    async (name: string) => {
      const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
      const { error: dbError } = await supabase.from("list_items").insert({
        list_id: listId,
        name: name.trim(),
        quantity: 1,
        unit: "pz",
        sort_order: maxOrder + 1,
      });
      if (dbError) throw new Error(dbError.message);
    },
    [listId, items]
  );

  const checkItem = useCallback(
    async (
      itemId: string,
      quantity: number,
      unitPrice: number
    ) => {
      const { error: dbError } = await supabase
        .from("list_items")
        .update({ is_checked: true, quantity, unit_price: unitPrice })
        .eq("id", itemId);
      if (dbError) throw new Error(dbError.message);
    },
    []
  );

  const uncheckItem = useCallback(async (itemId: string) => {
    const { error: dbError } = await supabase
      .from("list_items")
      .update({ is_checked: false, unit_price: null })
      .eq("id", itemId);
    if (dbError) throw new Error(dbError.message);
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    const { error: dbError } = await supabase
      .from("list_items")
      .delete()
      .eq("id", itemId);
    if (dbError) throw new Error(dbError.message);
  }, []);

  // Atualiza quantidade e/ou preço unitário de um item
  const updateItem = useCallback(
    async (
      itemId: string,
      updates: { quantity?: number; unit_price?: number | null }
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const patch: any = {};
      if (updates.quantity !== undefined) patch.quantity = updates.quantity;
      if (updates.unit_price !== undefined) patch.unit_price = updates.unit_price;
      if (Object.keys(patch).length === 0) return;
      const { error: dbError } = await supabase
        .from("list_items")
        .update(patch)
        .eq("id", itemId);
      if (dbError) throw new Error(dbError.message);
    },
    []
  );

  // Finaliza itens (muda status para 'purchased') — base do fluxo de compra
  const finalizeItems = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    const now = new Date().toISOString();
    const { error: dbError } = await supabase
      .from("list_items")
      .update({ status: "purchased", purchased_at: now })
      .in("id", itemIds);
    if (dbError) throw new Error(dbError.message);
    // Remove otimisticamente do estado local (realtime vai confirmar)
    setItems((prev) => prev.filter((i) => !itemIds.includes(i.id)));
  }, []);

  return {
    items,
    loading,
    error,
    addItem,
    checkItem,
    uncheckItem,
    deleteItem,
    updateItem,
    finalizeItems,
    refetch: fetchItems,
  };
}
