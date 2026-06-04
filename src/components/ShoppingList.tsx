"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertCircle, Users, X, Mail, Pencil, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeList } from "@/hooks/useRealtimeList";
import { useShoppingCalculator } from "@/hooks/useShoppingCalculator";
import ShoppingListItem from "./ShoppingListItem";
import TotalDisplay from "./TotalDisplay";
import PriceModal from "./PriceModal";
import type { ListItem, AiMatchResult } from "@/types";

interface ShoppingListProps {
  listId: string;
  listTitle: string;
  shareToken: string;
  /** true se o usuário logado for dono ou editor */
  canEdit?: boolean;
}

// ──────────────────────────────────────────────────────────
// Componente: ShoppingList
//
// Componente principal da tela de lista. Orquestra:
//  • Dados e Realtime  →  useRealtimeList
//  • Cálculos          →  useShoppingCalculator
//  • Modal de preço    →  PriceModal (manual + câmera/IA)
//  • Inserção de item  →  formulário inline
// ──────────────────────────────────────────────────────────
export default function ShoppingList({
  listId,
  listTitle,
  shareToken,
  canEdit = true,
}: ShoppingListProps) {
  const router = useRouter();

  const { items, loading, error, addItem, checkItem, uncheckItem, deleteItem, refetch } =
    useRealtimeList(listId);

  const totals = useShoppingCalculator(items);

  // Estado do modal de preço
  const [modalItem, setModalItem] = useState<ListItem | null>(null);

  // Estado do campo de novo item
  const [newItemName, setNewItemName]   = useState("");
  const [isAdding, setIsAdding]         = useState(false);
  const inputRef                        = useRef<HTMLInputElement>(null);

  // Estado do modal de compartilhamento
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail]         = useState("");
  const [isSharing, setIsSharing]           = useState(false);

  // Estado do inline editing do título
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue]         = useState(listTitle);
  const titleInputRef                       = useRef<HTMLInputElement>(null);

  // Sync título se prop mudar externamente
  useEffect(() => { setTitleValue(listTitle); }, [listTitle]);

  // ── Abre o modal quando usuário dá check ─────────────────
  const handleCheckClick = useCallback((item: ListItem) => {
    setModalItem(item);
  }, []);

  // ── Confirma valores do modal (manual ou IA) ─────────────
  const handleModalConfirm = useCallback(
    async (qty: number, price: number, aiData?: Partial<AiMatchResult>) => {
      if (!modalItem) return;
      try {
        await checkItem(modalItem.id, qty, price);

        // Persiste dados da IA se disponível
        if (aiData?.matched_label) {
          // fire-and-forget — não bloqueia a UX
          fetch("/api/lists/update-ai-data", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemId: modalItem.id,
              aiMatchedLabel: aiData.matched_label,
              ocrRawPrice: aiData.ocr_raw,
            }),
          }).catch(() => {/* silencia erros não críticos */});
        }

        toast.success("Aggiunto al carrello! 🛒");
      } catch {
        toast.error("Errore. Riprova.");
      } finally {
        setModalItem(null);
      }
    },
    [modalItem, checkItem]
  );

  // ── Adiciona novo item à lista ────────────────────────────
  const handleAddItem = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = newItemName.trim();
      if (!name || isAdding) return;
      setIsAdding(true);
      try {
        await addItem(name);
        setNewItemName("");
        inputRef.current?.focus();
      } catch {
        toast.error("Impossibile aggiungere l'articolo");
      } finally {
        setIsAdding(false);
      }
    },
    [newItemName, isAdding, addItem]
  );

  // ── Salva o novo título da lista ────────────────────────
  const handleSaveTitle = useCallback(async () => {
    const trimmed = titleValue.trim();
    setIsEditingTitle(false);
    if (!trimmed || trimmed === listTitle) {
      setTitleValue(listTitle);
      return;
    }
    try {
      const { error } = await supabase
        .from("lists")
        .update({ title: trimmed })
        .eq("id", listId);
      if (error) throw error;
      toast.success("Nome aggiornato ✓");
    } catch {
      toast.error("Errore nel salvataggio");
      setTitleValue(listTitle);
    }
  }, [titleValue, listTitle, listId]);

  // ── Copia link de compartilhamento ───────────────────────
  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/join/${shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiato! 📋");
  }, [shareToken]);

  // ── Envia convite por e-mail ─────────────────────────────
  const handleShare = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const email = shareEmail.trim().toLowerCase();
    if (!email || isSharing) return;
    setIsSharing(true);
    try {
      const { error } = await supabase
        .from("list_shares")
        .insert({ list_id: listId, invited_email: email, role: "editor" });
      if (error) throw error;
      toast.success(`Invito inviato a ${email}! ✉️`);
      setShareEmail("");
      setShowShareModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Errore";
      toast.error(msg.includes("unique") ? "Utente già invitato" : "Errore nell'invio");
    } finally {
      setIsSharing(false);
    }
  }, [shareEmail, isSharing, listId]);

  // ── Delete com confirmação leve (toast) ──────────────────
  const handleDelete = useCallback(
    (itemId: string) => {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Elimina articolo?</span>
            <button
              className="text-red-500 font-bold text-sm"
              onClick={() => {
                deleteItem(itemId).catch(() => toast.error("Errore"));
                toast.dismiss(t.id);
              }}
            >
              Sì
            </button>
            <button
              className="text-gray-500 text-sm"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </button>
          </div>
        ),
        { duration: 4000 }
      );
    },
    [deleteItem]
  );
  // ── Finaliza a compra: arquiva a lista e volta ao dashboard ──────────
  const handleFinalize = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("lists") as any)
        .update({ is_archived: true })
        .eq("id", listId);
      if (error) throw error;
      toast.success("🎉 Spesa completata! Ottimo lavoro!");
      router.push("/dashboard");
    } catch {
      toast.error("Errore nel finalizzare la spesa");
    }
  }, [listId, router]);
  // ── Separa itens: pendentes vs marcados ──────────────────
  const pendingItems  = items.filter((i) => !i.is_checked);
  const checkedItems  = items.filter((i) =>  i.is_checked);

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Cabeçalho de navegação */}
      <div className="bg-black sticky top-0 z-30 px-4 pt-11 pb-3 border-b border-zinc-900/80">
        <div className="flex items-center gap-2">
          {/* Botão Voltar */}
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Torna indietro"
            className="flex-shrink-0 flex items-center gap-1 pr-2 py-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Indietro</span>
          </button>

          {/* Divisore */}
          <div className="w-px h-5 bg-zinc-800 flex-shrink-0" />

          {/* Título (editável) */}
          <div className="flex-1 min-w-0">
            {canEdit && isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleSaveTitle(); }
                  if (e.key === "Escape") { setIsEditingTitle(false); setTitleValue(listTitle); }
                }}
                className="w-full text-base font-bold bg-transparent border-b border-[#deff9a] text-white focus:outline-none pb-0.5"
                maxLength={80}
                autoFocus
              />
            ) : (
              <button
                onClick={() => canEdit && setIsEditingTitle(true)}
                disabled={!canEdit}
                className="flex items-center gap-1.5 group/title w-full text-left"
              >
                <span className="text-base font-bold text-white truncate">{titleValue}</span>
                {canEdit && (
                  <Pencil
                    size={12}
                    className="text-zinc-600 opacity-60 group-hover/title:opacity-100 flex-shrink-0 transition-opacity"
                  />
                )}
              </button>
            )}
          </div>

          {/* Botão Compartilhar */}
          {canEdit && (
            <button
              onClick={() => setShowShareModal(true)}
              aria-label="Condividi lista"
              className="flex-shrink-0 p-2 rounded-xl hover:bg-zinc-900 transition-colors"
            >
              <Users size={18} className="text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* Painel de totais (sticky) */}
      <TotalDisplay {...totals} />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={refetch}
              className="text-sm text-accent underline"
            >
              Riprova
            </button>
          </div>
        ) : (
          <>
            {/* Itens pendentes */}
            {pendingItems.length > 0 && (
              <section>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Da comprare ({pendingItems.length})
                </p>
                <div className="space-y-2">
                  {pendingItems.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      onCheck={handleCheckClick}
                      onUncheck={uncheckItem}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Itens no carrinho */}
            {checkedItems.length > 0 && (
              <section>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Nel carrello ({checkedItems.length})
                </p>
                <div className="space-y-2">
                  {checkedItems.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      onCheck={handleCheckClick}
                      onUncheck={uncheckItem}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Lista vazia */}
            {items.length === 0 && (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="text-5xl">🛍️</span>
                <p className="text-zinc-500 text-sm">
                  La lista è vuota.<br />Aggiungi il primo articolo!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rodapé: Finalizza + Aggiungi */}
      {canEdit && (
        <div className="bg-black border-t border-zinc-900">
          {/* Botão Finalizza Spesa — aparece quando há itens no carrinho */}
          {checkedItems.length > 0 && (
            <div className="px-4 pt-3">
              <button
                onClick={handleFinalize}
                className="w-full bg-[#deff9a] text-black font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
              >
                🛒 Finalizza Spesa
              </button>
            </div>
          )}

          {/* Campo adicionar item */}
          <div className="px-4 py-3 pb-safe">
            <form onSubmit={handleAddItem} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Aggiungi articolo…"
                className="flex-1 bg-[#1a1a1a] border border-zinc-800 rounded-2xl px-4 py-3 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#deff9a]/30 focus:border-[#deff9a]/40 transition-colors"
                maxLength={120}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!newItemName.trim() || isAdding}
                className="flex-shrink-0 w-11 h-11 bg-[#deff9a] disabled:bg-zinc-800 disabled:opacity-50 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                aria-label="Aggiungi"
              >
                {isAdding ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <Plus size={20} className="text-black" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de preço */}
      {modalItem && (
        <PriceModal
          item={modalItem}
          listItems={items}
          onConfirm={handleModalConfirm}
          onClose={() => setModalItem(null)}
        />
      )}

      {/* Modal de compartilhamento */}
      {showShareModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 animate-fade-in"
            onClick={() => setShowShareModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d] border border-[#deff9a]/20 border-b-0 rounded-t-3xl shadow-2xl animate-slide-up px-5 pt-5 pb-10">
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">👥 Invita un collaboratore</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Inserisci l&apos;email per invitare</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Link de cópia */}
            <button
              onClick={handleCopyLink}
              className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-sm font-medium text-zinc-300 transition-colors"
            >
              🔗 Copia link di invito
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600 font-medium">oppure</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Form e-mail */}
            <form onSubmit={handleShare} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Inserisci l'email o l'ID dell'utente"
                  className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#deff9a]/40 focus:ring-2 focus:ring-[#deff9a]/20 transition-colors"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={!shareEmail.trim() || isSharing}
                className="w-full py-3.5 bg-[#deff9a] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "✉️ Invia Invito"
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
