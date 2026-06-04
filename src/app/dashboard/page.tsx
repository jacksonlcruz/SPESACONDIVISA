import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import ListsDashboard from "./ListsDashboard";
import type { Database } from "@/lib/database.types";
import CreateListButton from "./CreateListButton";
import StoricoDashboard from "./StoricoDashboard";

// ── Tipo auxiliar para o histórico agrupado ──────────────────────────────
type SpesaGroup = {
  key: string;
  dateLabel: string;
  listId: string;
  listTitle: string;
  listEmoji: string;
  itemCount: number;
  total: number;
};

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

  // ── Histórico: itens finalizados (purchased) ─────────────────────────
  const { data: purchasedItems } = await supabase
    .from("list_items")
    .select("id, name, unit, quantity, unit_price, purchased_at, list_id")
    .eq("status", "purchased")
    .not("purchased_at", "is", null)
    .order("purchased_at", { ascending: false })
    .limit(300);

  // Busca títulos/emojis das listas que aparecem no histórico
  const purchasedListIds = Array.from(new Set((purchasedItems ?? []).map((i) => i.list_id)));
  const { data: purchasedListDetails } = purchasedListIds.length > 0
    ? await supabase.from("lists").select("id, title, emoji").in("id", purchasedListIds)
    : { data: [] as { id: string; title: string; emoji: string }[] };

  // Agrupa por (data, lista)
  const listMap = new Map((purchasedListDetails ?? []).map((l) => [l.id, l]));
  const groupMap = new Map<string, SpesaGroup>();
  for (const item of purchasedItems ?? []) {
    const dateKey = item.purchased_at!.split("T")[0];
    const key = `${dateKey}_${item.list_id}`;
    const list = listMap.get(item.list_id);
    if (!list) continue;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        dateLabel: new Date(item.purchased_at!).toLocaleDateString("it-IT", {
          day: "2-digit", month: "long", year: "numeric",
        }),
        listId: item.list_id,
        listTitle: list.title,
        listEmoji: list.emoji,
        itemCount: 0,
        total: 0,
      });
    }
    const g = groupMap.get(key)!;
    g.itemCount++;
    g.total += (item.quantity ?? 1) * (item.unit_price ?? 0);
  }
  const spesaGroups = Array.from(groupMap.values());

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
        {/* Listas (Client Component com estado local + Realtime) */}
        <ListsDashboard
          initialOwnLists={ownLists ?? []}
          initialSharedLists={(sharedLists ?? []).map((share) => ({
            list_id: share.list_id,
            role: share.role,
            lists: share.lists as { id: string; title: string; emoji: string; updated_at: string } | null,
          }))}
        />

        {/* ── Storico Spese (Client Component com modal + clone) ── */}
        <StoricoDashboard
          groups={spesaGroups}
          allItems={(purchasedItems ?? []).map((i) => ({
            id: i.id,
            name: i.name,
            unit: (i as { unit?: string | null }).unit ?? null,
            quantity: i.quantity,
            unit_price: i.unit_price,
            purchased_at: i.purchased_at as string,
            list_id: i.list_id,
          }))}
        />
      </main>

      {/* FAB — cria nova lista */}
      <div className="fixed bottom-6 right-6 max-w-[430px]">
        <CreateListButton userId={user.id} />
      </div>
    </div>
  );
}
