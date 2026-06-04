// Página de entrada por link de convite: /join/[token]
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";

interface JoinPageProps {
  params: { token: string };
}

export default async function JoinPage({ params }: JoinPageProps) {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
          } catch {
            // Ignorar se chamado de um Server Component
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Usuário não logado → salva token e redireciona para login
  if (!user) {
    redirect(`/login?next=/join/${params.token}`);
  }

  // Chama a função SQL que aceita o convite
  const { data, error } = await supabase.rpc("join_list_by_token", {
    p_token: params.token,
  });

  if (error || !data?.list_id) {
    redirect("/dashboard?error=link_invalido");
  }

  redirect(`/lista/${data.list_id}`);
}
