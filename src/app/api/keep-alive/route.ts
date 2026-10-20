// ============================================================
//  API Route: GET | POST /api/keep-alive
//
//  Mantém o projeto Supabase Free "acordado".
//
//  O plano Free pausa o projeto após 7 dias sem atividade de
//  banco. Esta rota executa a RPC public.keep_alive(), que faz
//  um INSERT/UPDATE real no Postgres — o tipo de atividade que
//  o Supabase considera para NÃO pausar o projeto.
//
//  QUEM CHAMA (agendador externo — obrigatório):
//    • Vercel Cron              → vercel.json
//    • GitHub Actions           → .github/workflows/supabase-keep-alive.yml
//    • cron-job.org / UptimeRobot / Better Stack (alternativas)
//
//  SEGURANÇA (recomendado em produção):
//    KEEP_ALIVE_SECRET=<string aleatória longa>
//    A rota aceita o segredo em qualquer um dos formatos:
//      Authorization: Bearer <secret>      (Vercel Cron envia sozinho
//                                           quando CRON_SECRET existe)
//      x-keep-alive-secret: <secret>
//      ?token=<secret>
//    Sem a variável definida, a rota responde publicamente.
//
//  LIMITAÇÃO IMPORTANTE:
//    Se o projeto JÁ estiver pausado, nenhuma chamada HTTP o
//    reativa — é preciso clicar em "Restore project" no painel
//    do Supabase. Esta rotina serve para que ele nunca chegue
//    a pausar.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual as cryptoEqual } from "node:crypto";
import type { Database } from "@/lib/database.types";

// Nunca cachear: cada chamada precisa chegar ao banco.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vercel injeta CRON_SECRET no header Authorization das execuções de cron;
// KEEP_ALIVE_SECRET permite usar o mesmo endpoint em outros agendadores.
const KEEP_ALIVE_SECRET =
  process.env.KEEP_ALIVE_SECRET ?? process.env.CRON_SECRET ?? "";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

/** Comparação em tempo constante (evita vazar o segredo por timing). */
function secretsMatch(received: string, expected: string): boolean {
  if (!received || received.length !== expected.length) return false;
  return cryptoEqual(Buffer.from(received), Buffer.from(expected));
}

/** Valida o segredo recebido no header ou na query string. */
function isAuthorized(req: NextRequest): boolean {
  // Sem segredo configurado → endpoint público (útil em dev/local).
  if (!KEEP_ALIVE_SECRET) return true;

  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  return [
    bearer,
    req.headers.get("x-keep-alive-secret") ?? "",
    req.nextUrl.searchParams.get("token") ?? "",
  ].some((candidate) => secretsMatch(candidate, KEEP_ALIVE_SECRET));
}

/** Nome do projeto Supabase (sem o domínio) — não expõe nada sensível. */
function projectRef(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return "unknown";
  }
}

async function handleKeepAlive(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: "Não autorizado" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY precisam estar configuradas",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  const startedAt = Date.now();

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { "x-application-name": "spesa-condivisa-keep-alive" },
      },
    });

    // Escrita real no Postgres (INSERT ... ON CONFLICT DO UPDATE).
    const { data, error } = await supabase.rpc("keep_alive");
    const latencyMs = Date.now() - startedAt;

    if (error) {
      console.error("[keep-alive] RPC keep_alive falhou:", error.message);
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase não respondeu ao keep-alive",
          detail: error.message,
          latencyMs,
          hint:
            "Se o projeto estiver pausado, restaure em https://supabase.com/dashboard e rode supabase/keep-alive.sql",
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const ping = data?.[0] ?? null;

    return NextResponse.json(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        latencyMs,
        project: projectRef(SUPABASE_URL),
        database: ping
          ? { lastPingAt: ping.last_ping_at, pingTotal: ping.ping_total }
          : null,
        nextPing:
          "Agendado por vercel.json (cron diário) ou .github/workflows/supabase-keep-alive.yml",
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    console.error("[keep-alive]", err);
    return NextResponse.json(
      { ok: false, error: "Erro interno ao executar o keep-alive" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleKeepAlive(req);
}

export async function POST(req: NextRequest) {
  return handleKeepAlive(req);
}
