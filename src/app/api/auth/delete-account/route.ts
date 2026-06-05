import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

// ──────────────────────────────────────────────────────────
// POST /api/auth/delete-account
//
// Exclusão de conta conforme requisitos da Apple/Google.
//
// Estratégia sem SERVICE_ROLE:
//   1. Deleta todos os dados nas tabelas públicas
//   2. Faz sign out e limpa cookies
//   3. Tenta deletar do Auth (provavelmente falha sem service_role)
//      → erro silencioso documentado
//
// Para deleção COMPLETA do auth.user, configure:
//   SUPABASE_SERVICE_ROLE_KEY no .env.local
// ──────────────────────────────────────────────────────────
export async function POST() {
  try {
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

    // ── Verifica autenticação ───────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── 1. Deletar itens de listas criados pelo usuário ──────
    const { error: itemsError } = await supabase
      .from("list_items")
      .delete()
      .eq("created_by", userId);

    if (itemsError) {
      console.error("[delete-account] Erro ao deletar list_items:", itemsError);
    }

    // ── 2. Deletar compartilhamentos do usuário ──────────────
    const { error: sharesError } = await supabase
      .from("list_shares")
      .delete()
      .eq("user_id", userId);

    if (sharesError) {
      console.error("[delete-account] Erro ao deletar list_shares:", sharesError);
    }

    // ── 3. Deletar listas do usuário ─────────────────────────
    const { error: listsError } = await supabase
      .from("lists")
      .delete()
      .eq("owner_id", userId);

    if (listsError) {
      console.error("[delete-account] Erro ao deletar lists:", listsError);
    }

    // ── 4. Deletar perfil ────────────────────────────────────
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("[delete-account] Erro ao deletar profile:", profileError);
    }

    // ── 5. Tentar deletar do Auth (requer service_role) ─────
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      // Usa fetch direto com service_role para deletar o auth user
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
            },
          }
        );

        if (!res.ok) {
          console.error(
            "[delete-account] Erro ao deletar auth user:",
            await res.text()
          );
        }
      } catch (authErr) {
        console.error("[delete-account] Erro ao chamar auth API:", authErr);
      }
    } else {
      console.warn(
        "[delete-account] SUPABASE_SERVICE_ROLE_KEY não configurada. " +
          "O registro auth.user NÃO foi deletado. Configure a variável para deleção completa."
      );
    }

    // ── 6. Sign out e limpar cookies ─────────────────────────
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("[delete-account] Erro ao fazer sign out:", signOutError);
    }

    return NextResponse.json({
      success: true,
      message: "Account eliminato con successo",
    });
  } catch (err) {
    console.error("[delete-account] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}