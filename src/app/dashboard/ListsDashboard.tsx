"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/contexts/LanguageContext";

// ── Tipos ────────────────────────────────────────────────────────────────
type OwnList = {
  id: string;
  title: string;
  emoji: string;
  created_at: string;
  updated_at: string;
};

type SharedListItem = {
  list_id: string;
  role: string;
  lists: { id: string; title: string; emoji: string; updated_at: string } | null;
};

interface Props {
  initialOwnLists: OwnList[];
  initialSharedLists: SharedListItem[];
}

// ─────────────────────────────────────────────────────────────────────────
// ListsDashboard — exibe as listas com estado reativo (Realtime + estado local)
// ─────────────────────────────────────────────────────────────────────────
export default function ListsDashboard({ initialOwnLists, initialSharedLists }: Props) {
  const { t, locale } = useTranslation();
  const [ownLists, setOwnLists] = useState<OwnList[]>(initialOwnLists);
  const [sharedLists, setSharedLists] = useState<SharedListItem[]>(initialSharedLists);

  // ── Supabase Realtime: escuta DELETE e UPDATE na tabela `lists` ──────
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-lists-realtime")
      // Atualização de estado local imediata ao deletar
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lists" },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setOwnLists((prev) => prev.filter((l) => l.id !== deletedId));
          setSharedLists((prev) => prev.filter((l) => l.list_id !== deletedId));
        }
      )
      // Nova lista criada (clone ou criação manual)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lists" },
        (payload) => {
          const newList = payload.new as OwnList & { is_archived?: boolean; owner_id?: string };
          if (newList.is_archived) return;
          setOwnLists((prev) => {
            if (prev.some((l) => l.id === newList.id)) return prev;
            return [newList, ...prev];
          });
        }
      )
      // Atualização de estado local imediata ao renomear/editar
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lists" },
        (payload) => {
          const updated = payload.new as OwnList;
          setOwnLists((prev) =>
            prev.map((l) =>
              l.id === updated.id
                ? { ...l, title: updated.title, emoji: updated.emoji, updated_at: updated.updated_at }
                : l
            )
          );
          setSharedLists((prev) =>
            prev.map((share) =>
              share.list_id === updated.id && share.lists
                ? {
                    ...share,
                    lists: {
                      ...share.lists,
                      title: updated.title,
                      emoji: updated.emoji,
                      updated_at: updated.updated_at,
                    },
                  }
                : share
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const hasNoLists = ownLists.length === 0 && sharedLists.length === 0;

  return (
    <>
      {/* Listas próprias */}
      {ownLists.length > 0 && (
        <>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            {t.dashboard.myLists} ({ownLists.length})
          </p>
          {ownLists.map((list) => (
            <Link
              key={list.id}
              href={`/lista/${list.id}`}
              className="flex items-center gap-4 bg-surface-800 rounded-2xl px-4 py-4 border border-surface-700 active:scale-[0.98] transition-all hover:border-accent/30"
            >
              <div className="w-12 h-12 bg-surface-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {list.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-100 truncate text-base">{list.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {t.dashboard.updated}{" "}
                  {new Date(list.updated_at).toLocaleDateString(locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : "it-IT")}
                </p>
              </div>
              <span className="text-zinc-600 text-lg">›</span>
            </Link>
          ))}
        </>
      )}

      {/* Listas compartilhadas */}
      {sharedLists.length > 0 && (
        <>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-2 px-1">
            {t.dashboard.sharedWithMe} ({sharedLists.length})
          </p>
          {sharedLists.map((share) => {
            const list = share.lists;
            if (!list) return null;
            return (
              <Link
                key={share.list_id}
                href={`/lista/${share.list_id}`}
                className="flex items-center gap-4 bg-surface-800 rounded-2xl px-4 py-4 border border-accent/20 active:scale-[0.98] transition-all hover:border-accent/40"
              >
                <div className="w-12 h-12 bg-surface-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {list.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-100 truncate text-base">{list.title}</p>
                  <p className="text-xs text-accent font-medium mt-0.5">
                    👥 {t.dashboard.shared} · {share.role === "editor" ? t.dashboard.editor : t.dashboard.viewer}
                  </p>
                </div>
                <span className="text-zinc-600 text-lg">›</span>
              </Link>
            );
          })}
        </>
      )}

      {/* Estado vazio */}
      {hasNoLists && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-20 h-20 bg-surface-700 rounded-full flex items-center justify-center text-4xl">
            🛍️
          </div>
          <div>
            <p className="text-zinc-200 font-semibold">{t.dashboard.noListsYet}</p>
            <p className="text-zinc-500 text-sm mt-1">
              {t.dashboard.tapPlusToCreate}
            </p>
          </div>
        </div>
      )}
    </>
  );
}