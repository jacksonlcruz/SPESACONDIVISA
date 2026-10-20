"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/async";
import { guessIsFoodFlag } from "@/lib/foodCategory";
import { isMissingColumnError } from "@/lib/supabaseErrors";
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
//   4. Atualiza a UI de forma OTIMISTA em toda mutação, para que
//      o app nunca dependa exclusivamente do WebSocket.
//   5. Reconecta o canal automaticamente e re-sincroniza ao
//      voltar do background / trocar de rede (mobile).
//
// Fluxo de dados:
//
//   Supabase DB ──(trigger)──► Realtime Server ──(WebSocket)──►
//   ► Channel listener ──► reducer local ──► setState ──► React re-render
//
//   Fallback (WebSocket morto / app suspenso):
//   setInterval + visibilitychange + online ──► fetchItems({ silent })
// ──────────────────────────────────────────────────────────

/** Estado da conexão Realtime exposto para a UI */
export type ListConnectionStatus = "connecting" | "online" | "offline";

/** Campos opcionais ao adicionar um item (usado pelo scanner IA) */
export interface AddItemExtras {
  quantity?: number;
  unitPrice?: number | null;
  isChecked?: boolean;
  aiMatchedLabel?: string | null;
  ocrRawPrice?: string | null;
  /** Categoria vinda da IA (true = alimentício, false = não) */
  isFood?: boolean | null;
}

/** Timeout de cada requisição REST (evita spinner infinito em rede ruim) */
const FETCH_TIMEOUT_MS = 12_000;
/** Reconciliação periódica com o banco (rede de segurança do Realtime) */
const SYNC_INTERVAL_MS = 20_000;
/** Intervalo mínimo entre duas reconciliações (evita rajadas) */
const RESYNC_MIN_GAP_MS = 3_000;
/** Backoff da reconexão do canal */
const RECONNECT_BASE_MS = 1_500;
const RECONNECT_MAX_MS = 15_000;
/** Somente itens ativos (não finalizados) aparecem na lista */
const ACTIVE_STATUS_FILTER = "status.is.null,status.eq.pending";

/** Ordena de forma estável: sort_order → created_at */
function sortItems(list: ListItem[]): ListItem[] {
  return [...list].sort((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}

/** Um item finalizado nunca deve ficar na lista ativa */
function isActive(item: ListItem): boolean {
  return item.status !== "purchased";
}

/**
 * UUID v4 gerado no cliente.
 * Permite inserir o item de forma otimista com o ID DEFINITIVO
 * (evita "ID temporário" e qualquer erro de UUID ao tocar rápido).
 */
function createUuid(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  // Fallback RFC 4122 v4 (Safari < 15.4 / contexto não seguro)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useRealtimeList(listId: string) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ListConnectionStatus>("connecting");

  // Espelho síncrono do estado: permite ler a lista atual dentro de
  // callbacks estáveis (sem recriá-los a cada render).
  const itemsRef = useRef<ListItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const lastSyncRef = useRef(0);

  // ── 1. Carregamento / reconciliação com o banco ───────────
  const fetchItems = useCallback(
    async (options: { silent?: boolean } = {}) => {
      const { silent = false } = options;
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const { data, error: dbError } = await supabase
          .from("list_items")
          .select("*")
          .eq("list_id", listId)
          .or(ACTIVE_STATUS_FILTER)   // exclui itens já finalizados
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
          .abortSignal(controller.signal);

        if (dbError) throw dbError;

        setItems(sortItems(((data as ListItem[]) ?? []).filter(isActive)));
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Em modo silencioso mantemos a lista atual (nunca "apaga" a tela)
        if (!silent) {
          setError(
            controller.signal.aborted
              ? "Connessione lenta. Riprova."
              : message
          );
        }
      } finally {
        clearTimeout(timeoutId);
        lastSyncRef.current = Date.now();
        if (!silent) setLoading(false);
      }
    },
    [listId]
  );

  /** Reconciliação "silenciosa" — nunca mexe em loading/error */
  const resync = useCallback(
    (options: { force?: boolean } = {}) => {
      const now = Date.now();
      if (!options.force && now - lastSyncRef.current < RESYNC_MIN_GAP_MS) return;
      lastSyncRef.current = now;
      void fetchItems({ silent: true });
    },
    [fetchItems]
  );

  // ── 2. Redutores de estado para cada evento ───────────────
  const applyInsert = useCallback((newItem: ListItem) => {
    if (!isActive(newItem)) return;
    setItems((prev) => {
      // Idempotente: não duplica se o evento chegar 2x ou se a
      // própria mutação otimista já inseriu o registro.
      if (prev.some((i) => i.id === newItem.id)) return prev;
      return sortItems([...prev, newItem]);
    });
  }, []);

  const applyUpdate = useCallback((updatedItem: ListItem) => {
    setItems((prev) => {
      // Se o item foi finalizado, remove da lista ativa
      if (!isActive(updatedItem)) {
        return prev.filter((i) => i.id !== updatedItem.id);
      }
      // Self-healing: se o INSERT foi perdido, o UPDATE recria o item
      if (!prev.some((i) => i.id === updatedItem.id)) {
        return sortItems([...prev, updatedItem]);
      }
      return sortItems(
        prev.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i))
      );
    });
  }, []);

  const applyDelete = useCallback((deletedItem: Partial<ListItem>) => {
    setItems((prev) => prev.filter((i) => i.id !== deletedItem.id));
  }, []);

  // ── 3. Carga inicial ─────────────────────────────────────
  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  // ── 4. Assinatura Realtime com reconexão automática ──────
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    type ChangePayload = {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new: Partial<ListItem>;
      old: Partial<ListItem>;
    };

    const handlePayload = (payload: ChangePayload) => {
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
    };

    const scheduleReconnect = () => {
      if (cancelled || retryTimer) return;
      attempts += 1;
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(2, attempts - 1),
        RECONNECT_MAX_MS
      );
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (cancelled) return;
        if (channel) {
          void supabase.removeChannel(channel);
          channel = null;
        }
        connect();
      }, delay);
    };

    function connect() {
      if (cancelled) return;

      const nextChannel = supabase
        .channel(`list-items:${listId}`)
        .on(
          "postgres_changes",
          {
            event: "*",                     // INSERT | UPDATE | DELETE
            schema: "public",
            table: "list_items",
            filter: `list_id=eq.${listId}`, // RLS + filtro de coluna
          },
          (payload) => handlePayload(payload as unknown as ChangePayload)
        )
        .subscribe((status) => {
          if (cancelled) return;

          if (status === "SUBSCRIBED") {
            attempts = 0;
            setConnection("online");
            // Reconcilia eventos perdidos enquanto o canal estava caído
            resync({ force: true });
            return;
          }

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            // NUNCA troca a lista por uma tela de erro: apenas sinaliza
            // a reconexão e mantém os dados já carregados na tela.
            setConnection("offline");
            scheduleReconnect();
          }
        });

      channel = nextChannel;
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [listId, applyInsert, applyUpdate, applyDelete, resync]);

  // ── 5. Reconciliação ao voltar do background / trocar rede ─
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") resync({ force: true });
    };
    const onOnline = () => {
      setConnection((prev) => (prev === "online" ? prev : "connecting"));
      resync({ force: true });
    };
    const onOffline = () => setConnection("offline");

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Rede de segurança: mesmo com o WebSocket "vivo" mas sem eventos
    // (comum no mobile), a lista se mantém atualizada.
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") resync();
    }, SYNC_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(intervalId);
    };
  }, [resync]);

  // ── 6. Mutações (otimistas + rollback em caso de erro) ────
  const addItem = useCallback(
    async (name: string, extras: AddItemExtras = {}) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const quantity = extras.quantity ?? 1;
      const unitPrice = extras.unitPrice ?? null;
      const isChecked = extras.isChecked ?? false;
      // Categoria: IA > dicionário local > null (desconhecido).
      // O palpite local evita itens "sem categoria" quando o
      // usuário digita o nome à mão (ou a IA não soube responder).
      const isFood =
        extras.isFood != null ? extras.isFood : guessIsFoodFlag(trimmed);

      const maxOrder = itemsRef.current.reduce(
        (m, i) => Math.max(m, i.sort_order ?? 0),
        0
      );
      const newId = createUuid();
      const now = new Date().toISOString();

      const optimistic: ListItem = {
        id: newId,
        list_id: listId,
        created_by: null,
        name: trimmed,
        quantity,
        unit: "pz",
        unit_price: unitPrice,
        is_checked: isChecked,
        subtotal: unitPrice !== null ? quantity * unitPrice : 0,
        ai_matched_label: extras.aiMatchedLabel ?? null,
        ocr_raw_price: extras.ocrRawPrice ?? null,
        sort_order: maxOrder + 1,
        status: "pending",
        purchased_at: null,
        is_food: isFood,
        created_at: now,
        updated_at: now,
      };

      // Aparece na tela imediatamente (não espera o WebSocket)
      setItems((prev) => sortItems([...prev, optimistic]));

      // Campos comuns a todas as tentativas de insert
      const itemFields = {
        id: newId,          // ID definitivo, gerado no cliente
        list_id: listId,
        name: trimmed,
        quantity,
        unit: "pz",
        unit_price: unitPrice,
        is_checked: isChecked,
        ai_matched_label: extras.aiMatchedLabel ?? null,
        ocr_raw_price: extras.ocrRawPrice ?? null,
        sort_order: maxOrder + 1,
      };

      let attempt = await withTimeout(
        supabase
          .from("list_items")
          .insert({ ...itemFields, is_food: isFood })
          .select("*")
          .single()
      );

      // Ambiente sem a migração de `is_food`: repete o insert sem a
      // coluna. O item entra normalmente e a categoria continua sendo
      // inferida localmente (guessIsFoodFlag) até a migração rodar.
      if (attempt.error && isMissingColumnError(attempt.error, "is_food")) {
        console.warn(
          "[list_items] Coluna is_food ausente no banco: insert refeito sem a categoria. " +
            "Rode a migração de supabase/schema.sql para persistir a categoria."
        );
        attempt = await withTimeout(
          supabase.from("list_items").insert(itemFields).select("*").single()
        );
      }

      const { data, error: dbError } = attempt;

      if (dbError || !data) {
        // Rollback: remove o item fantasma
        setItems((prev) => prev.filter((i) => i.id !== newId));
        throw new Error(dbError?.message ?? "Impossibile aggiungere l'articolo");
      }

      // Sem a coluna, o banco devolve is_food ausente: mantém o palpite local
      const saved: ListItem = {
        ...(data as ListItem),
        is_food: (data as ListItem).is_food ?? isFood,
      };
      // Substitui o registro otimista pela versão oficial do banco
      // (updated_at, subtotal, defaults). Se o Realtime já trouxe a
      // linha, o resultado é idêntico — a operação é idempotente.
      setItems((prev) => sortItems(prev.map((i) => (i.id === newId ? saved : i))));
    },
    [listId]
  );

  const checkItem = useCallback(
    async (itemId: string, quantity: number, unitPrice: number) => {
      const previous = itemsRef.current.find((i) => i.id === itemId);

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                is_checked: true,
                quantity,
                unit_price: unitPrice,
                subtotal: quantity * unitPrice,
              }
            : i
        )
      );

      const updateQuery = supabase
        .from("list_items")
        .update({ is_checked: true, quantity, unit_price: unitPrice })
        .eq("id", itemId);

      const { error: dbError } = await withTimeout(updateQuery);

      if (dbError) {
        if (previous) {
          setItems((prev) =>
            sortItems(prev.map((i) => (i.id === itemId ? previous : i)))
          );
        }
        throw new Error(dbError.message);
      }
    },
    []
  );

  const uncheckItem = useCallback(async (itemId: string) => {
    const previous = itemsRef.current.find((i) => i.id === itemId);

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, is_checked: false, unit_price: null, subtotal: 0 }
          : i
      )
    );

    const uncheckQuery = supabase
      .from("list_items")
      .update({ is_checked: false, unit_price: null })
      .eq("id", itemId);

    const { error: dbError } = await withTimeout(uncheckQuery);

    if (dbError) {
      if (previous) {
        setItems((prev) =>
          sortItems(prev.map((i) => (i.id === itemId ? previous : i)))
        );
      }
      throw new Error(dbError.message);
    }
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    const previous = itemsRef.current.find((i) => i.id === itemId);

    // Remove da tela imediatamente
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    const deleteQuery = supabase
      .from("list_items")
      .delete()
      .eq("id", itemId);

    const { error: dbError } = await withTimeout(deleteQuery);

    if (dbError) {
      if (previous) {
        setItems((prev) =>
          prev.some((i) => i.id === itemId) ? prev : sortItems([...prev, previous])
        );
      }
      throw new Error(dbError.message);
    }
  }, []);

  // Atualiza quantidade, preço unitário e/ou categoria de um item
  const updateItem = useCallback(
    async (
      itemId: string,
      updates: {
        quantity?: number;
        unit_price?: number | null;
        is_food?: boolean | null;
      }
    ) => {
      const patch: {
        quantity?: number;
        unit_price?: number | null;
        is_food?: boolean | null;
      } = {};
      if (updates.quantity !== undefined) patch.quantity = updates.quantity;
      if (updates.unit_price !== undefined) patch.unit_price = updates.unit_price;
      if (updates.is_food !== undefined) patch.is_food = updates.is_food;
      if (Object.keys(patch).length === 0) return;

      const previous = itemsRef.current.find((i) => i.id === itemId);

      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== itemId) return i;
          const quantity = patch.quantity ?? i.quantity;
          const unitPrice =
            patch.unit_price !== undefined ? patch.unit_price : i.unit_price;
          return {
            ...i,
            quantity,
            unit_price: unitPrice,
            subtotal: unitPrice !== null ? quantity * unitPrice : 0,
            is_food:
              patch.is_food !== undefined ? patch.is_food : i.is_food,
          };
        })
      );

      const runPatch = (body: typeof patch) =>
        withTimeout(supabase.from("list_items").update(body).eq("id", itemId));

      let { error: dbError } = await runPatch(patch);

      // Ambiente sem a migração de `is_food`: salva o restante do patch
      // (quantidade/preço) e mantém a categoria apenas no estado local.
      if (
        dbError &&
        patch.is_food !== undefined &&
        isMissingColumnError(dbError, "is_food")
      ) {
        console.warn(
          "[list_items] Coluna is_food ausente no banco: atualização refeita sem a categoria."
        );
        const patchWithoutFood = { ...patch };
        delete patchWithoutFood.is_food;
        ({ error: dbError } = await runPatch(patchWithoutFood));
      }

      if (dbError) {
        if (previous) {
          setItems((prev) =>
            sortItems(prev.map((i) => (i.id === itemId ? previous : i)))
          );
        }
        throw new Error(dbError.message);
      }
    },
    []
  );

  // Finaliza itens (muda status para 'purchased') — base do fluxo de compra
  const finalizeItems = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    const removed = itemsRef.current.filter((i) => itemIds.includes(i.id));
    setItems((prev) => prev.filter((i) => !itemIds.includes(i.id)));

    const now = new Date().toISOString();
    const finalizeQuery = supabase
      .from("list_items")
      .update({ status: "purchased", purchased_at: now })
      .in("id", itemIds);

    const { error: dbError } = await withTimeout(finalizeQuery);

    if (dbError) {
      setItems((prev) => {
        const missing = removed.filter((r) => !prev.some((i) => i.id === r.id));
        return sortItems([...prev, ...missing]);
      });
      throw new Error(dbError.message);
    }
  }, []);

  return {
    items,
    loading,
    error,
    /** Estado do canal Realtime — usado para o indicador de sincronização */
    connection,
    addItem,
    checkItem,
    uncheckItem,
    deleteItem,
    updateItem,
    finalizeItems,
    refetch: fetchItems,
  };
}
