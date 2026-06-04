import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, LogOut } from "lucide-react";
import type { Database } from "@/lib/database.types";
import CreateListButton from "./CreateListButton";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Listas do usuário (próprias + compartilhadas)
  const { data: ownLists } = await supabase
    .from("lists")
    .select("id, title, emoji, created_at, updated_at")
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  const { data: sharedLists } = await supabase
    .from("list_shares")
    .select("list_id, role, lists(id, title, emoji, updated_at)")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null);

  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      {/* Header */}
      <header className="bg-surface-800 px-4 pt-12 pb-5 border-b border-surface-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Benvenuto/a</p>
            <h1 className="text-2xl font-bold text-zinc-100 mt-0.5">Le mie liste</h1>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-surface-700 transition-colors text-zinc-400 text-sm font-medium"
              aria-label="Esci"
            >
              <LogOut size={16} />
              <span className="text-xs">Esci</span>
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 py-5 space-y-3 pb-28">
        {/* Listas próprias */}
        {(ownLists ?? []).length > 0 && (
          <>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
              Le mie liste ({(ownLists ?? []).length})
            </p>
            {(ownLists ?? []).map((list) => (
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
                    Aggiornata {new Date(list.updated_at).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <span className="text-zinc-600 text-lg">›</span>
              </Link>
            ))}
          </>
        )}

        {/* Listas compartilhadas */}
        {(sharedLists ?? []).length > 0 && (
          <>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-2 px-1">
              Condivise con me ({(sharedLists ?? []).length})
            </p>
            {(sharedLists ?? []).map((share) => {
              const list = share.lists as { id: string; title: string; emoji: string; updated_at: string } | null;
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
                      👥 Condivisa · {share.role === "editor" ? "Editor" : "Visualizzatore"}
                    </p>
                  </div>
                  <span className="text-zinc-600 text-lg">›</span>
                </Link>
              );
            })}
          </>
        )}

        {/* Lista vazia */}
        {(ownLists ?? []).length === 0 && (sharedLists ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-20 h-20 bg-surface-700 rounded-full flex items-center justify-center text-4xl">
              🛍️
            </div>
            <div>
              <p className="text-zinc-200 font-semibold">Nessuna lista ancora</p>
              <p className="text-zinc-500 text-sm mt-1">
                Tocca il pulsante + per crearne una!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FAB — cria nova lista */}
      <div className="fixed bottom-6 right-6 max-w-[430px]">
        <CreateListButton userId={user.id} />
      </div>
    </div>
  );
}
