import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import StatsDashboard from "./StatsDashboard";

// ──────────────────────────────────────────────────────────
// Tipo: Item comprado (purchased) vindo do Supabase
// ──────────────────────────────────────────────────────────
interface PurchasedItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number | null;
  purchased_at: string;
  list_id: string;
}

// ──────────────────────────────────────────────────────────
// Página: /dashboard/stats
// Server Component — busca dados e renderiza o Client Component
// ──────────────────────────────────────────────────────────
export default async function StatsPage() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Busca TODOS os itens purchased do usuário
  const { data: purchasedItems } = await supabase
    .from("list_items")
    .select("id, name, quantity, unit_price, purchased_at, list_id")
    .eq("status", "purchased")
    .not("purchased_at", "is", null)
    .order("purchased_at", { ascending: false });

  const items: PurchasedItem[] = (purchasedItems ?? []) as PurchasedItem[];

  return <StatsDashboard initialItems={items} />;
}