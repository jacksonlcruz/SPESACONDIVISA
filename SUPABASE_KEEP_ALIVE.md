# ⏰ Keep-Alive do Supabase Free

> **Problema:** o plano Free do Supabase **pausa o projeto após 7 dias sem atividade de banco**.
> Como o Spesa Condivisa é usado ~1 vez por mês, o projeto ficava pausado e precisava ser
> reativado manualmente no dashboard.
>
> **Solução:** um "batimento" automático que **escreve de verdade no Postgres** a cada 1–2 dias.

---

## 1. Como funciona

```
┌──────────────────────────┐
│  Agendador externo       │   Vercel Cron (vercel.json)
│  (1x por dia / 2 dias)   │   GitHub Actions (workflow)
└────────────┬─────────────┘   cron-job.org, UptimeRobot...
             │ HTTPS GET
┌────────────▼─────────────────────────────────────────────┐
│  Next.js  GET|POST /api/keep-alive                       │
│  • valida KEEP_ALIVE_SECRET (opcional)                   │
│  • createClient(anon) → supabase.rpc("keep_alive")       │
└────────────┬─────────────────────────────────────────────┘
             │ POST /rest/v1/rpc/keep_alive
┌────────────▼─────────────────────────────────────────────┐
│  Postgres  public.keep_alive()                           │
│  INSERT ... ON CONFLICT DO UPDATE em keep_alive_pings    │
│  → query real + WAL = atividade contabilizada            │
└──────────────────────────────────────────────────────────┘
```

**Por que não basta chamar `https://<projeto>.supabase.co/auth/v1/health`?**
Esse endpoint responde pelo gateway e **não garante** uma operação no Postgres. O critério usado
pelo Supabase é atividade de banco — por isso a rota executa uma **escrita** (INSERT/UPDATE) na
tabela `public.keep_alive_pings`. É barato: 1 linha, 1 update por chamada.

Arquivos envolvidos:

| Arquivo | Papel |
|---|---|
| `supabase/keep-alive.sql` | Tabela `keep_alive_pings` + função RPC `keep_alive()` |
| `supabase/schema.sql` | Mesma seção 9 (para instalações novas) |
| `src/app/api/keep-alive/route.ts` | Endpoint `GET`/`POST /api/keep-alive` |
| `vercel.json` | Cron diário da Vercel |
| `.github/workflows/supabase-keep-alive.yml` | Cron a cada 2 dias no GitHub Actions (alternativa) |
| `src/lib/database.types.ts` | Tipagem da RPC `keep_alive` |

---

## 2. Configuração (5 minutos)

### Passo 1 — Criar a estrutura no banco

1. Abra o **Supabase Dashboard → SQL Editor → New query**
2. Cole o conteúdo de **`supabase/keep-alive.sql`**
3. **Run** (`Ctrl+Enter`)

Verifique:

```sql
select * from public.keep_alive();       -- cria o 1º batimento
select * from public.keep_alive_pings;   -- deve mostrar 1 linha
```

> Se você já roda o `supabase/schema.sql` completo em projetos novos, a seção 9 já cria tudo —
> não precisa rodar o `keep-alive.sql` separadamente.

### Passo 2 — Definir o segredo (recomendado)

Gere uma string aleatória:

```bash
# Linux / macOS
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (97..102) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
```

Adicione em `.env.local`:

```env
KEEP_ALIVE_SECRET=cole_a_string_gerada
```

E na Vercel (ou outro host):

```bash
vercel env add KEEP_ALIVE_SECRET production
vercel env add KEEP_ALIVE_SECRET preview
```

> Sem `KEEP_ALIVE_SECRET` a rota fica **pública** (qualquer um pode chamá-la). Não vaza dados,
> mas o endpoint pode ser usado por terceiros para inflar o contador. Em produção, defina o segredo.


### Passo 3 — Agendar a chamada

#### Opção A — Vercel Cron (recomendado se o app está na Vercel)

O arquivo `vercel.json` **já está no repositório**:

```json
{
  "crons": [
    { "path": "/api/keep-alive", "schedule": "0 6 * * *" }
  ]
}
```

Basta fazer o deploy. A Vercel executa **1x por dia às 06:00 UTC** (no plano Hobby o horário pode
variar dentro da hora). Se você também definir `CRON_SECRET` nas env vars da Vercel, ela envia
automaticamente `Authorization: Bearer <CRON_SECRET>` — a rota já aceita esse header.

Conferir: **Vercel → seu projeto → Settings → Cron Jobs** (mostra o histórico de execuções).

#### Opção B — GitHub Actions (funciona com qualquer host)

O workflow `.github/workflows/supabase-keep-alive.yml` roda **a cada 2 dias**.

1. Repositório → **Settings → Secrets and variables → Actions**
2. Aba **Variables** → `New repository variable`
   - `KEEP_ALIVE_URL` = `https://seuapp.vercel.app/api/keep-alive`
3. Aba **Secrets** → `New repository secret`
   - `KEEP_ALIVE_SECRET` = o mesmo valor da env var do app
4. Aba **Actions** → *Supabase Keep-Alive* → **Run workflow** (teste manual)

> ⚠️ O GitHub **desativa workflows agendados após 60 dias sem commits** no repositório.
> Se o projeto ficar muito tempo parado, use a Opção A ou um monitor externo em paralelo.

#### Opção C — Monitor externo (mais simples, sem deploy)

Cadastre a URL no [cron-job.org](https://cron-job.org), [UptimeRobot](https://uptimerobot.com) ou
[Better Stack](https://betterstack.com):

| Campo | Valor |
|---|---|
| URL | `https://seuapp.vercel.app/api/keep-alive` |
| Método | `GET` |
| Frequência | 1x por dia (ou a cada 3 dias) |
| Header (se usar segredo) | `Authorization: Bearer <KEEP_ALIVE_SECRET>` |

---

## 3. Verificar se está funcionando

Chamada manual:

```bash
curl "https://seuapp.vercel.app/api/keep-alive" \
  -H "Authorization: Bearer SEU_SEGREDO"
```

Resposta esperada:

```json
{
  "ok": true,
  "checkedAt": "2026-10-20T10:15:03.421Z",
  "latencyMs": 122,
  "project": "abcdefghijklm",
  "database": { "lastPingAt": "2026-10-20T10:15:03.389+00:00", "pingTotal": 42 },
  "nextPing": "Agendado por vercel.json (cron diário) ou .github/workflows/supabase-keep-alive.yml"
}
```

No banco:

```sql
select last_ping, ping_count from public.keep_alive_pings;
```

Se `ping_count` aumenta a cada dia → o projeto está recebendo atividade e **não será pausado**.

Erros comuns:

| Resposta | Causa | Solução |
|---|---|---|
| `401 Não autorizado` | Segredo ausente/errado no header | Envie `Authorization: Bearer <segredo>` exatamente igual à env var |
| `500 ... precisam estar configuradas` | Env vars do Supabase ausentes no host | Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `503 Supabase não respondeu` | Projeto pausado, RPC não criada ou schema diferente | Restaure o projeto no dashboard e rode `supabase/keep-alive.sql` |
| `404` | Deploy antigo, sem a rota | Faça novo deploy com este código |

---

## 4. Limitações e observações

- **Não reativa projeto pausado.** Se o projeto já estiver pausado, nenhuma requisição HTTP o
  reativa: entre em [supabase.com/dashboard](https://supabase.com/dashboard), abra o projeto e
  clique em **Restore project**. O keep-alive serve para que ele **nunca chegue** a pausar.
- **A Vercel Hobby permite cron 1x por dia** — suficiente (o limite do Supabase é 7 dias).
  Em planos pagos você pode aumentar a frequência em `vercel.json` (ex: `"0 */2 * * *"`).
- **Custo/quotas:** 1 escrita minúscula por dia é irrelevante no free tier.
- **Não substitui backup.** Antes de qualquer pausa forçada, exporte com
  `npx supabase db dump` ou pelo **Database → Backups**.
- **Realtime/Webhooks não contam** se o app estiver fechado — por isso o agendador externo é
  obrigatório. O keep-alive é a única parte do sistema que "se move" sem usuários online.
