/**
 * Utilitario: isMissingColumnError
 *
 * Detecta erros do PostgREST/Postgres que acontecem quando o banco
 * ainda nao recebeu a migracao de uma coluna nova. Serve para
 * degradar com elegancia: o app continua inserindo/atualizando o
 * item e apenas deixa de persistir aquele campo, em vez de travar o
 * usuario (ex.: "column list_items.is_food does not exist").
 *
 * Codigos tratados:
 *   42703    -> column "<tabela>.<coluna>" does not exist  (Postgres)
 *   PGRST204 -> Could not find the '<coluna>' column ... in the schema cache
 *
 * Ver supabase/schema.sql (bloco "MIGRACAO: categoria alimentar").
 */
export function isMissingColumnError(
  error: { code?: string | null; message?: string | null } | null | undefined,
  column: string
): boolean {
  if (!error) return false;

  const code = error.code ?? "";
  if (code !== "42703" && code !== "PGRST204") return false;

  const message = (error.message ?? "").toLowerCase();
  // O codigo ja e conclusivo; a mensagem so confirma qual coluna faltou.
  if (!message) return true;
  return message.includes(column.toLowerCase());
}
