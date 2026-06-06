import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import ShoppingList from "@/components/ShoppingList";

interface ListPageProps {
  params: { id: string };
}

export default async function ListPage({ params }: ListPageProps) {
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
  if (!user) redirect(`/login?next=/lista/${params.id}`);

  // Busca lista (RLS garante acesso apenas se permitido)
  const { data: list, error } = await supabase
    .from("lists")
    .select("id, title, emoji, share_token, owner_id")
    .eq("id", params.id)
    .single();

  if (error || !list) notFound();

  // Verifica papel do usuário
  const isOwner = list.owner_id === user.id;
  let canEdit = isOwner;

  if (!isOwner) {
    const { data: share } = await supabase
      .from("list_shares")
      .select("role")
      .eq("list_id", list.id)
      .eq("user_id", user.id)
      .single();

    canEdit = share?.role === "editor";
  }

  // Monta o título: se for o título padrão, deixa o cliente traduzir
  const titleWithEmoji = `${list.emoji} ${list.title}`;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ShoppingList
        listId={list.id}
        listTitle={titleWithEmoji}
        shareToken={list.share_token}
        canEdit={canEdit}
      />
    </div>
  );
}