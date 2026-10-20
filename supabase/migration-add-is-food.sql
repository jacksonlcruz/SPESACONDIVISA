-- ----------------------------------------------------------
-- MIGRACAO: categoria alimentar dos itens (is_food)
--
-- Rode este arquivo no SQL Editor do Supabase sempre que o app
-- reclamar de "column list_items.is_food does not exist".
-- E idempotente: pode rodar quantas vezes precisar.
-- ----------------------------------------------------------
alter table public.list_items
  add column if not exists is_food boolean;

create index if not exists idx_list_items_food
  on public.list_items(list_id, is_food);
