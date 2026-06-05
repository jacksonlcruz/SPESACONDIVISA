// Callback OAuth — Supabase redireciona aqui após login social (Google / Apple)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Usa variável de ambiente como base URL.
  // Dentro do Docker, request.url resolve para localhost:80,
  // então NUNCA usar `origin` da requisição no servidor.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // ── Upsert do perfil (com fallback para Apple) ─────────
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fallback para o nome: Apple só envia full_name no PRIMEIRO login.
          // Em logins subsequentes, user_metadata.full_name vem vazio/ausente.
          const rawName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null;

          const fullName =
            rawName ||
            (user.email ? user.email.split("@")[0] : null) ||
            "Utente Apple";

          const avatarUrl = user.user_metadata?.avatar_url ?? null;

          await supabase.from("profiles").upsert(
            {
              id: user.id,
              full_name: fullName,
              avatar_url: avatarUrl,
              email: user.email!,
            },
            { onConflict: "id" }
          );
        }
      } catch (profileErr) {
        // Não bloqueia o fluxo — perfil é não-crítico
        console.error("[callback] Erro ao upsert do perfil:", profileErr);
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback`);
}