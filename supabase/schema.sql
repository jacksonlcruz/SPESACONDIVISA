-- ============================================================
--  SPESA CONDIVISA — Schema Supabase/PostgreSQL
--  Execute no SQL Editor do painel Supabase
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 0. EXTENSÕES
-- ──────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- busca fuzzy nos nomes de itens

-- ──────────────────────────────────────────────────────────
-- 1. PROFILES
--    Criado automaticamente via trigger quando um usuário
--    se cadastra no Supabase Auth.
-- ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  email       text unique not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Trigger: cria profile automaticamente após novo usuário Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- 2. LISTS
-- ──────────────────────────────────────────────────────────
create table if not exists public.lists (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null default 'Lista della spesa',
  emoji       text default '🛒',
  -- token público para compartilhamento via link
  share_token uuid unique default uuid_generate_v4(),
  is_archived boolean default false,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists idx_lists_owner on public.lists(owner_id);

-- ──────────────────────────────────────────────────────────
-- 3. LIST_SHARES  (convite por e-mail ou link)
-- ──────────────────────────────────────────────────────────
do $$ begin
  create type share_role as enum ('viewer', 'editor');
exception when duplicate_object then null;
end $$;

create table if not exists public.list_shares (
  id          uuid primary key default uuid_generate_v4(),
  list_id     uuid not null references public.lists(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  -- e-mail pendente (quando o convidado ainda não tem conta)
  invited_email text,
  role        share_role default 'editor',
  accepted_at timestamptz,
  created_at  timestamptz default now() not null,
  -- garante que a mesma pessoa não seja convidada duas vezes
  unique (list_id, user_id),
  unique (list_id, invited_email),
  -- pelo menos um dos dois deve ser preenchido
  constraint chk_user_or_email check (user_id is not null or invited_email is not null)
);

create index if not exists idx_list_shares_list   on public.list_shares(list_id);
create index if not exists idx_list_shares_user   on public.list_shares(user_id);
create index if not exists idx_list_shares_email  on public.list_shares(invited_email);

-- ──────────────────────────────────────────────────────────
-- 4. LIST_ITEMS
-- ──────────────────────────────────────────────────────────
create table if not exists public.list_items (
  id              uuid primary key default uuid_generate_v4(),
  list_id         uuid not null references public.lists(id) on delete cascade,
  -- quem adicionou o item
  created_by      uuid references public.profiles(id) on delete set null,
  name            text not null,
  quantity        numeric(10, 3) default 1,
  unit            text default 'pz',          -- pz, kg, g, L, ml, conf…
  unit_price      numeric(10, 2),             -- preenchido manualmente ou por OCR
  -- true = item já colocado no carrinho (marcado como comprado)
  is_checked      boolean default false,
  -- snapshot do subtotal no momento do check (qty * unit_price)
  subtotal        numeric(10, 2) generated always as (
                    case when is_checked then quantity * coalesce(unit_price, 0)
                    else 0 end
                  ) stored,
  -- dado extra retornado pela IA
  ai_matched_label text,
  ocr_raw_price    text,
  sort_order       integer default 0,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

create index if not exists idx_list_items_list    on public.list_items(list_id);
create index if not exists idx_list_items_name    on public.list_items using gin (name gin_trgm_ops);

-- Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_list_items_updated_at on public.list_items;
create trigger trg_list_items_updated_at
  before update on public.list_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_lists_updated_at on public.lists;
create trigger trg_lists_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 5. VIEW AUXILIAR — totais por lista
-- ──────────────────────────────────────────────────────────
create or replace view public.list_totals as
select
  list_id,
  count(*)                                    as total_items,
  count(*) filter (where is_checked = true)   as checked_items,
  coalesce(sum(subtotal), 0)                  as total_spent,
  coalesce(
    sum(quantity * coalesce(unit_price, 0))
    filter (where unit_price is not null), 0
  )                                           as estimated_total
from public.list_items
group by list_id;

-- ──────────────────────────────────────────────────────────
-- 6. RLS — Row Level Security
-- ──────────────────────────────────────────────────────────

-- ── 6a. profiles ──────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "Usuário vê o próprio perfil" on public.profiles;
create policy "Usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Usuário atualiza o próprio perfil" on public.profiles;
create policy "Usuário atualiza o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Usuários autenticados veem perfis públicos" on public.profiles;
create policy "Usuários autenticados veem perfis públicos"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- ── 6b. lists ─────────────────────────────────────────────
alter table public.lists enable row level security;

-- Função auxiliar: verifica se o usuário logado tem acesso à lista
create or replace function public.user_has_list_access(p_list_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.lists         where id = p_list_id and owner_id = auth.uid()
    union all
    select 1 from public.list_shares   where list_id = p_list_id and user_id = auth.uid()
  );
$$;

drop policy if exists "Dono vê suas listas" on public.lists;
create policy "Dono vê suas listas"
  on public.lists for select
  using (owner_id = auth.uid());

drop policy if exists "Colaborador vê listas compartilhadas" on public.lists;
create policy "Colaborador vê listas compartilhadas"
  on public.lists for select
  using (public.user_has_list_access(id));

drop policy if exists "Apenas dono cria lista" on public.lists;
create policy "Apenas dono cria lista"
  on public.lists for insert
  with check (owner_id = auth.uid());

drop policy if exists "Apenas dono atualiza lista" on public.lists;
create policy "Apenas dono atualiza lista"
  on public.lists for update
  using (owner_id = auth.uid());

drop policy if exists "Apenas dono deleta lista" on public.lists;
create policy "Apenas dono deleta lista"
  on public.lists for delete
  using (owner_id = auth.uid());

-- ── 6c. list_shares ───────────────────────────────────────
alter table public.list_shares enable row level security;

drop policy if exists "Dono gerencia convites" on public.list_shares;
create policy "Dono gerencia convites"
  on public.list_shares for all
  using (
    exists (select 1 from public.lists where id = list_id and owner_id = auth.uid())
  );

drop policy if exists "Convidado vê seu próprio convite" on public.list_shares;
create policy "Convidado vê seu próprio convite"
  on public.list_shares for select
  using (user_id = auth.uid() or invited_email = (
    select email from public.profiles where id = auth.uid()
  ));

drop policy if exists "Convidado aceita convite (update)" on public.list_shares;
create policy "Convidado aceita convite (update)"
  on public.list_shares for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 6d. list_items ────────────────────────────────────────
alter table public.list_items enable row level security;

drop policy if exists "Acesso a itens de listas permitidas" on public.list_items;
create policy "Acesso a itens de listas permitidas"
  on public.list_items for select
  using (public.user_has_list_access(list_id));

drop policy if exists "Editor insere itens" on public.list_items;
create policy "Editor insere itens"
  on public.list_items for insert
  with check (public.user_has_list_access(list_id));

drop policy if exists "Editor atualiza itens" on public.list_items;
create policy "Editor atualiza itens"
  on public.list_items for update
  using (public.user_has_list_access(list_id));

drop policy if exists "Editor deleta itens" on public.list_items;
create policy "Editor deleta itens"
  on public.list_items for delete
  using (public.user_has_list_access(list_id));

-- ──────────────────────────────────────────────────────────
-- 7. REALTIME — habilitar tabelas para broadcast
-- ──────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.list_items;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.lists;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.list_shares;
exception when duplicate_object then null;
end $$;

-- ──────────────────────────────────────────────────────────
-- 8. FUNÇÃO: aceitar convite via share_token (link público)
-- ──────────────────────────────────────────────────────────
-- ──────────────────────────────────────────────────────────
-- MIGRAÇÃO: status e purchased_at em list_items
-- Execute no SQL Editor do Supabase APÓS o schema inicial
-- ──────────────────────────────────────────────────────────
alter table public.list_items
  add column if not exists status text default 'pending'
    check (status in ('pending', 'purchased')),
  add column if not exists purchased_at timestamptz;

create index if not exists idx_list_items_status
  on public.list_items(list_id, status);

create index if not exists idx_list_items_purchased_at
  on public.list_items(purchased_at desc)
  where purchased_at is not null;

-- Retrocompatibilidade: itens antigos ficam como 'pending'
update public.list_items set status = 'pending' where status is null;

-- ──────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────
-- 8. FUNÇÃO: aceitar convite via share_token (link público)
-- ──────────────────────────────────────────────────────────
create or replace function public.join_list_by_token(p_token uuid)
returns json language plpgsql security definer as $$
declare
  v_list_id   uuid;
  v_user_id   uuid := auth.uid();
  v_user_email text;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select id into v_list_id from public.lists where share_token = p_token;

  if v_list_id is null then
    raise exception 'Link inválido ou expirado';
  end if;

  -- Já é dono — retorna sucesso sem duplicar
  if exists (select 1 from public.lists where id = v_list_id and owner_id = v_user_id) then
    return json_build_object('list_id', v_list_id, 'status', 'owner');
  end if;

  select email into v_user_email from public.profiles where id = v_user_id;

  -- Insere ou atualiza convite existente por e-mail
  insert into public.list_shares (list_id, user_id, invited_email, role, accepted_at)
  values (v_list_id, v_user_id, v_user_email, 'editor', now())
  on conflict (list_id, user_id) do update
    set accepted_at = now();

  -- Aceita convite por e-mail pendente
  update public.list_shares
  set user_id = v_user_id, accepted_at = now()
  where list_id = v_list_id and invited_email = v_user_email and user_id is null;

  return json_build_object('list_id', v_list_id, 'status', 'joined');
end;
$$;
