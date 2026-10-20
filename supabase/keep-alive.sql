-- ============================================================
--  SPESA CONDIVISA — Keep-Alive do projeto Supabase Free
--
--  Execute este arquivo no SQL Editor do Supabase
--  (Dashboard → SQL Editor → New query → Run).
--
--  MOTIVO
--  O plano Free do Supabase pausa o projeto após 7 dias sem
--  atividade de banco. Um "batimento" que apenas consulta um
--  endpoint HTTP (ex: /auth/v1/health) não é confiável para
--  resetar esse contador — o que conta é uma operação real
--  no Postgres. Por isso a função abaixo faz INSERT/UPDATE
--  em uma tabela de controle (gerando WAL e query de verdade).
--
--  CONSUMIDO POR
--  GET|POST /api/keep-alive  (chamado por cron — vercel.json
--  ou .github/workflows/supabase-keep-alive.yml)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TABELA DE CONTROLE — sempre uma única linha (id = 1)
-- ──────────────────────────────────────────────────────────
create table if not exists public.keep_alive_pings (
  id          smallint    primary key default 1,
  last_ping   timestamptz not null default now(),
  ping_count  bigint      not null default 0,
  constraint keep_alive_pings_single_row check (id = 1)
);

-- Ninguém acessa a tabela diretamente: RLS ativa e sem policies.
-- O acesso acontece somente pela função SECURITY DEFINER abaixo
-- (o owner da função, `postgres`, ignora RLS).
alter table public.keep_alive_pings enable row level security;

-- ──────────────────────────────────────────────────────────
-- 2. FUNÇÃO RPC — registra o batimento e devolve o estado
-- ──────────────────────────────────────────────────────────
create or replace function public.keep_alive()
returns table (last_ping_at timestamptz, ping_total bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_last_ping  timestamptz;
  v_ping_total bigint;
begin
  insert into public.keep_alive_pings as p (id, last_ping, ping_count)
  values (1, now(), 1)
  on conflict (id) do update
    set last_ping  = now(),
        ping_count = p.ping_count + 1
  returning p.last_ping, p.ping_count
  into v_last_ping, v_ping_total;

  return query select v_last_ping, v_ping_total;
end;
$$;

-- Apenas a execução da função é exposta às chaves públicas.
-- A anon key (usada em /api/keep-alive) precisa deste GRANT.
revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;

-- ──────────────────────────────────────────────────────────
-- 3. VERIFICAÇÃO MANUAL (opcional)
-- ──────────────────────────────────────────────────────────
-- select * from public.keep_alive();
-- select * from public.keep_alive_pings;
