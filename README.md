# 🛒 Spesa Condivisa

> **Lista della spesa collaborativa in tempo reale** — PWA mobile-first construída com Next.js 14, Supabase e OpenAI Vision.

---

## Índice

1. [Requisitos do Sistema](#-requisitos-do-sistema)
2. [Visão Geral da Arquitetura](#-visão-geral-da-arquitetura)
3. [Estrutura de Arquivos](#-estrutura-de-arquivos)
4. [Guia de Instalação Rápida](#-guia-de-instalação-rápida)
5. [Configuração do Supabase](#-configuração-do-supabase)
6. [Configuração das Variáveis de Ambiente](#-configuração-das-variáveis-de-ambiente)
7. [Comandos Disponíveis](#-comandos-disponíveis)
8. [Modelagem do Banco de Dados](#-modelagem-do-banco-de-dados)
9. [Fluxo Realtime](#-fluxo-realtime)
10. [Fluxo IA / OCR](#-fluxo-ia--ocr)
11. [Segurança — RLS](#-segurança--rls)
12. [Deploy em Produção](#-deploy-em-produção)
13. [Keep-Alive do Supabase Free](#-keep-alive-do-supabase-free)
14. [Resiliência no Celular (anti-travamento)](#-resiliência-no-celular-anti-travamento)
15. [Troubleshooting](#-troubleshooting)

---

## 📋 Requisitos do Sistema

### Software obrigatório

| Ferramenta | Versão mínima | Versão recomendada | Verificar |
|---|---|---|---|
| **Node.js** | 18.17.0 | 20.x LTS | `node -v` |
| **npm** | 9.x | 10.x | `npm -v` |
| **Git** | 2.x | qualquer | `git --version` |

### Contas de serviço obrigatórias

| Serviço | Plano necessário | URL |
|---|---|---|
| **Supabase** | Free (suficiente para dev) | https://supabase.com |
| **OpenAI** | Pay-as-you-go (GPT-4o Vision) | https://platform.openai.com |

### Opcional (para deploy)

| Ferramenta | Uso |
|---|---|
| **Vercel CLI** | Deploy do frontend Next.js |
| **Supabase CLI** | Gerenciar migrations localmente |
| **Docker Desktop** | Rodar Supabase local (alternativa à nuvem) |

---

## 🏗️ Visão Geral da Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENTE (PWA)                           │
│          Next.js 14 · React 18 · Tailwind CSS 3              │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  ShoppingList  │  │   PriceModal    │  │CameraCapture │  │
│  │  (checklist)   │  │ (manual / OCR)  │  │  (câmera)    │  │
│  └────────┬───────┘  └────────┬────────┘  └──────┬───────┘  │
│           │                   │                   │          │
│  ┌────────▼───────────────────▼───────────────────▼───────┐  │
│  │               useRealtimeList (hook)                    │  │
│  │   Carga inicial · WebSocket subscribe · Mutações CRUD   │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │           useShoppingCalculator (hook / useMemo)         │  │
│  │     totalSpent · estimatedPending · progress%            │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │ REST + WebSocket (RLS aplicado em todas as queries)
┌────────▼─────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL   │  │   Realtime    │  │      Auth        │  │
│  │  + RLS ativo  │  │  WAL → WS     │  │ Email / Google   │  │
│  └───────────────┘  └───────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │ (exclusivamente server-side — chave nunca no cliente)
┌────────▼─────────────────────────────────────────────────────┐
│               API ROUTES — Next.js App Router                │
│  POST /api/ai/match-item    →  GPT-4o Vision (OCR + match)   │
│  PATCH /api/lists/update-ai-data  →  Persiste dados de IA    │
│  GET  /api/keep-alive       →  Batimento no Postgres (cron)  │
│  GET  /auth/callback        →  OAuth exchange code           │
│  POST /auth/signout         →  Encerra sessão                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
SPESACONDIVISA/
│
├── .env.local.example          ← Modelo de variáveis de ambiente
├── SUPABASE_KEEP_ALIVE.md      ← Evita a pausa do projeto Supabase Free
├── vercel.json                 ← Cron da Vercel (keep-alive diário)
├── next.config.js              ← Configuração Next.js (headers + no-cache de navegação)
├── tailwind.config.js          ← Design system (cores, animações)
├── tsconfig.json               ← TypeScript strict mode
├── package.json
│
├── .github/
│   └── workflows/
│       └── supabase-keep-alive.yml ← Cron alternativo (a cada 2 dias)
│
├── public/
│   ├── manifest.json           ← Manifesto PWA (ícones, tema)
│   └── sw.js                   ← Service Worker network-only (sem cache de app)
│
├── supabase/
│   ├── schema.sql              ← ⚠️ Execute PRIMEIRO no Supabase
│   └── keep-alive.sql          ← Tabela + RPC do keep-alive
│
└── src/
    ├── app/                    ← Next.js App Router
    │   ├── layout.tsx          ← Layout raiz + PWA meta tags
    │   ├── globals.css         ← Tailwind base + safe-area iOS
    │   ├── page.tsx            ← Redirect inteligente
    │   ├── login/page.tsx      ← Auth UI (email + Google OAuth)
    │   ├── dashboard/
    │   │   ├── page.tsx        ← Lista de listas (Server Component)
    │   │   └── CreateListButton.tsx
    │   ├── lista/[id]/page.tsx ← Tela principal da lista
    │   ├── join/[token]/page.tsx ← Aceita convite por link
    │   └── api/
    │       ├── ai/match-item/route.ts
    │       ├── lists/update-ai-data/route.ts
    │       ├── keep-alive/route.ts   ← mantém o Supabase Free ativo
    │       ├── auth/callback/route.ts
    │       └── auth/signout/route.ts
    │
    ├── components/
    │   ├── ShoppingList.tsx        ← Orquestrador principal
    │   ├── ShoppingListItem.tsx    ← Linha individual (React.memo)
    │   ├── PriceModal.tsx          ← Bottom sheet: manual + câmera
    │   ├── CameraCapture.tsx       ← Câmera nativa + chamada à IA
    │   ├── AppHealth.tsx           ← SW + recuperação de chunk + toasts presos
    │   └── TotalDisplay.tsx        ← Painel sticky: totais + progresso
    │
    ├── hooks/
    │   ├── useRealtimeList.ts
    │   └── useShoppingCalculator.ts
    │
    ├── lib/
    │   ├── supabaseClient.ts
    │   ├── foodCategory.ts          ← Classificador alimentício x não alimentício
    │   └── database.types.ts
    │
    └── types/index.ts

```

---

## 🚀 Guia de Instalação Rápida

### Passo 1 — Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd SPESACONDIVISA
```

### Passo 2 — Verificar versão do Node.js

```bash
node -v   # deve mostrar v18.x.x ou superior
npm -v    # deve mostrar v9.x.x ou superior
```

Se precisar atualizar, use [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows) ou [nvm](https://github.com/nvm-sh/nvm) (Linux/macOS):

```bash
nvm install 20
nvm use 20
```

### Passo 3 — Instalar dependências

```bash
npm install
```

### Passo 4 — Configurar o Supabase

Veja a próxima seção completa abaixo.

### Passo 5 — Configurar variáveis de ambiente

```bash
# Windows (PowerShell)
copy .env.local.example .env.local

# Linux / macOS
cp .env.local.example .env.local
```

Edite `.env.local` com suas chaves.

### Passo 6 — Iniciar em modo de desenvolvimento

```bash
npm run dev
# Acesse: http://localhost:3000
```

> Para testar câmera e PWA no celular, o site precisa rodar em **HTTPS**. Use `npx ngrok http 3000` para criar um túnel seguro temporário.

---

## ⚙️ Configuração do Supabase

### 1. Criar projeto

1. Acesse https://supabase.com e faça login
2. Clique em **"New project"**
3. Escolha nome (ex: `spesa-condivisa`), senha do DB e região
4. Aguarde o provisionamento (~2 min)

### 2. Executar o schema SQL

1. No painel → **SQL Editor** → **New query**
2. Abra o arquivo `supabase/schema.sql` deste repositório
3. Cole todo o conteúdo e clique em **Run** (`Ctrl+Enter`)
4. Verifique as tabelas em **Table Editor**

> O script cria: tabelas, índices, triggers, policies RLS, view `list_totals` e habilita o Realtime automaticamente.

### 3. Habilitar provedor Google OAuth (opcional)

1. Painel → **Authentication** → **Providers** → **Google**
2. Ative e preencha **Client ID** e **Client Secret** do [Google Cloud Console](https://console.cloud.google.com)
3. Adicione `https://SEU_PROJETO.supabase.co/auth/v1/callback` nos **Authorized redirect URIs**

### 4. Obter as chaves de acesso

1. Painel → **Settings** → **API**
2. Copie **Project URL** e **anon public key**

---

## 🔑 Configuração das Variáveis de Ambiente

Arquivo: `.env.local` (nunca commitar — já está no `.gitignore`)

```env
# ─────────────────────────────────────────────────────
# SUPABASE  (Supabase → Settings → API)
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─────────────────────────────────────────────────────
# OPENAI  (platform.openai.com → API Keys)
# ⚠️ NUNCA use prefixo NEXT_PUBLIC_ — chave server-side!
# ─────────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─────────────────────────────────────────────────────
# KEEP-ALIVE  (protege GET/POST /api/keep-alive)
# Gere com: openssl rand -hex 32
# Se omitido, a rota fica pública.
# ─────────────────────────────────────────────────────
KEEP_ALIVE_SECRET=string_aleatoria_longa
```

| Variável | Desenvolvimento | Produção |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Mesma |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave `anon` | Mesma |
| `OPENAI_API_KEY` | Chave dev/teste | Chave produção |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://seudominio.com` |
| `KEEP_ALIVE_SECRET` | Opcional | **Recomendado** — ver [Keep-Alive](#-keep-alive-do-supabase-free) |

---

## 🖥️ Comandos Disponíveis

```bash
# ── DESENVOLVIMENTO ──────────────────────────────────────────
npm run dev
# Inicia o servidor Next.js em modo desenvolvimento com hot-reload.
# Acesso: http://localhost:3000

# ── BUILD ────────────────────────────────────────────────────
npm run build
# Compila o projeto otimizado para produção.
# Gera a pasta .next/ com todos os assets e rotas.

# ── PRODUÇÃO (após build) ────────────────────────────────────
npm run start
# Inicia o servidor de produção na porta 3000.
# Requer as variáveis de ambiente de produção configuradas.

# ── LINT ─────────────────────────────────────────────────────
npm run lint
# Executa o ESLint em todos os arquivos .ts e .tsx.
# Reporta erros de estilo e possíveis bugs.

# ── TIPOS SUPABASE (após alterar schema.sql) ─────────────────
npx supabase gen types typescript --project-id SEU_PROJECT_ID \
  > src/lib/database.types.ts
# Regenera os tipos TypeScript a partir do schema do Supabase.
# Execute sempre que modificar tabelas ou colunas.
```

### Comandos Supabase CLI (opcional)

```bash
npm install -g supabase   # Instala CLI globalmente

supabase login            # Autentica na conta Supabase
supabase link --project-ref SEU_PROJECT_ID   # Linka projeto local
supabase db push          # Aplica migrations pendentes
supabase start            # Sobe Supabase local com Docker
supabase stop             # Para o Supabase local
```

---

## 🗄️ Modelagem do Banco de Dados

### Diagrama ER

```
profiles                  lists
──────────────────        ─────────────────────────────
id (PK → auth.users)      id (PK)
full_name                 owner_id (FK → profiles)
avatar_url                title
email (unique)            emoji
created_at                share_token (UUID único)
updated_at                is_archived
                          created_at / updated_at
        │                         │
        │                  list_shares              list_items
        │                  ──────────────────       ─────────────────────────
        └────────────────► list_id (FK → lists)     id (PK)
                           user_id (FK → profiles)  list_id (FK → lists)
                           invited_email            created_by (FK → profiles)
                           role (viewer|editor)     name
                           accepted_at              quantity / unit
                           created_at               unit_price
                                                    is_checked
                                                    subtotal (GENERATED)
                                                    ai_matched_label
                                                    ocr_raw_price
                                                    sort_order
                                                    created_at / updated_at
```

### Tabelas

| Tabela | Responsabilidade |
|---|---|
| `profiles` | Criado via trigger `on_auth_user_created` no signup |
| `lists` | Cada lista; `share_token` gera o link de convite |
| `list_items` | Itens individuais; `subtotal` calculado pelo PostgreSQL |
| `list_shares` | Controla acesso: editor ou viewer |
| `list_totals` | View que agrega totais por lista (sem JOIN no frontend) |

---

## ⚡ Fluxo Realtime

```
Usuário A escreve               Supabase DB (PostgreSQL)
  │ INSERT / UPDATE / DELETE ──►  WAL (Write-Ahead Log)
                                       │
                               Supabase Realtime Server
                               (broadcast via WebSocket)
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
         Usuário B               Usuário C               Usuário D
      applyInsert()           applyUpdate()           applyDelete()
       setState(...)           setState(...)           setState(...)
      React re-render         React re-render         React re-render
```

**Princípio:** nenhum cliente faz refetch completo. Cada evento aplica apenas o patch mínimo no estado local — sincronização instantânea e sem tráfego desnecessário.

```typescript
supabase.channel(`list-items:${listId}`)
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "list_items",
    filter: `list_id=eq.${listId}`,
  }, (payload) => {
    switch (payload.eventType) {
      case "INSERT": applyInsert(payload.new); break;
      case "UPDATE": applyUpdate(payload.new); break;
      case "DELETE": applyDelete(payload.old); break;
    }
  })
  .subscribe();
```

---

## 🤖 Fluxo IA / OCR

```
1. Usuário tira foto da etiqueta  →  CameraCapture.tsx
2. Imagem convertida para base64  →  FileReader API
3. POST /api/ai/match-item        →  Server-side (OPENAI_API_KEY segura)
   • Valida tamanho ≤ 5 MB
   • Sanitiza nomes (anti-injection)
   • GPT-4o Vision:
       - OCR do preço na etiqueta
       - Identificação do produto na foto
       - Match semântico com lista ("Pomodoro Pachino" → "Tomate")
   • Valida JSON retornado
   • Verifica matched_item_id pertence à lista
4. AiMatchResult retornado ao cliente
5. PriceModal preenche preço automaticamente
6. Usuário confirma apenas a QUANTIDADE
7. checkItem() → UPDATE no Supabase
8. Realtime propaga para todos os colaboradores
```

**Exemplo de resposta da IA:**

```json
{
  "matched_item_id": "uuid-do-item-tomate",
  "matched_label": "Pomodoro Pachino",
  "suggested_price": 2.49,
  "ocr_raw": "Pomodorini Pachino\n€ 2,49 / kg",
  "confidence": 0.94,
  "explanation": "Il prodotto fotografato corrisponde semanticamente a 'Tomate' nella lista."
}
```

---

## 🍎 Categoria Alimentar (totais separados)

Cada item da lista pode ser classificado como **alimentício** (`is_food = true`) ou
**não alimentício** (`is_food = false`). Durante a compra, o painel de totais passa a
mostrar a soma de cada grupo e, embaixo, o total geral:

```
🍎 Alimentari        € 12,30
🧴 Non alimentari    €  7,45
─────────────────────────────
   Totale speso      € 19,75
```

### Como a categoria é definida (3 camadas)

| Ordem | Origem | Quando |
|-------|--------|--------|
| 1 | `list_items.is_food` (banco) | Sempre que já estiver definido — vence tudo |
| 2 | IA (GPT-4o Vision) | Ao escanear o produto; a IA devolve `is_food` no JSON |
| 3 | Dicionário local (`src/lib/foodCategory.ts`) | Palpite para itens digitados à mão |
| — | `null` | Sem classificação → entra em "não alimentícios" |

A regra é única para UI e totais (`isFoodItem()`), então
`alimentícios + não alimentícios = total` sempre fecha. O item vem com um chip
🍎/🧴 na linha e a correção é manual: toque no item → no modal de edição há o
toggle **🍎 Alimentare / 🧴 Non alimentare**.

### Bebidas: as alcoólicas ficam fora

A regra existe porque **ticket alimentari não cobre álcool**:

| Produto | Categoria |
|---------|-----------|
| Água, leite, café, chá, sucos, refrigerantes (Fanta, Coca-Cola, Sprite, Pepsi), energéticos, chinotto, cedrata, acqua tonica | 🍎 Alimentari |
| Vino, birra, spumante, prosecco, destilados (vodka, whisky, gin, rum, tequila…), licores (limoncello, grappa…), cocktails (spritz, mojito, caipirinha…) | 🧴 Non alimentari |
| "Birra analcolica", "vino senza alcol", "alcohol free" | 🍎 Alimentari (exceção) |

O dicionário cobre as marcas mais comuns de refrigerante e todos os tipos de
bebida alcoólica, e o prompt da IA recebe a mesma regra. Se algum item já
estiver com a categoria errada no banco (`is_food` vence tudo), abra o item →
**🍎 Alimentare** → salvar.

### Migração obrigatória

Se o banco já existia antes desta feature, rode no SQL Editor do Supabase:

```sql
alter table public.list_items add column if not exists is_food boolean;
create index if not exists idx_list_items_food on public.list_items(list_id, is_food);
```

Também deixei o SQL pronto em `supabase/migration-add-is-food.sql` (só abrir e colar).

> **Sintoma de migração não aplicada:** a lista é criada normalmente, mas qualquer
> tentativa de adicionar item falha com `column list_items.is_food does not exist`
> (código `42703`). O app trata isso: o insert é refeito sem a coluna (aviso no
> console do navegador) e o item é salvo normalmente, com a categoria apenas no
> palpite local. A categoria só passa a ser persistida de fato depois de rodar a
> migração acima.

Arquivos envolvidos: `src/lib/foodCategory.ts`, `src/lib/supabaseErrors.ts`,
`src/hooks/useShoppingCalculator.ts`,
`src/components/TotalDisplay.tsx`, `src/components/ShoppingListItem.tsx`,
`src/components/EditItemModal.tsx`, `src/components/ScanConfirmModal.tsx`,
`src/app/api/ai/scan-any/route.ts`.

---

## 🔐 Segurança — RLS

Todas as queries passam pelas políticas Row Level Security do PostgreSQL.

| Recurso | Política |
|---|---|
| `profiles` | Usuário lê/edita apenas o próprio perfil |
| `lists` | Dono: CRUD completo. Colaborador: somente SELECT |
| `list_items` | Acesso apenas em listas onde o usuário tem acesso confirmado |
| `list_shares` | Dono gerencia convites; convidado só vê e aceita o próprio |
| `OPENAI_API_KEY` | Variável server-side; nunca exposta ao browser |
| Imagens (OCR) | Transmitidas à OpenAI; **nunca armazenadas** no servidor |

---

## 🚢 Deploy em Produção

### Vercel (recomendado)

```bash
npm install -g vercel
vercel

# Configurar variáveis
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add KEEP_ALIVE_SECRET   # protege o cron de keep-alive
```

Após o deploy, configure no painel do Supabase:
- **Authentication → URL Configuration → Site URL**: `https://seuapp.vercel.app`
- **Redirect URLs**: `https://seuapp.vercel.app/auth/callback`

> O `vercel.json` já registra o cron diário `GET /api/keep-alive` no deploy — é o que impede o
> projeto Supabase Free de ser pausado por inatividade. Detalhes na seção
> [Keep-Alive](#-keep-alive-do-supabase-free).

---

## ⏰ Keep-Alive do Supabase Free

O plano Free do Supabase **pausa o projeto após 7 dias sem atividade de banco**. Como o app é usado
cerca de **1 vez por mês**, isso acontecia sempre e exigia reativar manualmente no dashboard.

Solução implementada:

```sql
-- supabase/keep-alive.sql
public.keep_alive_pings   -- tabela de controle (1 linha)
public.keep_alive()       -- RPC SECURITY DEFINER: INSERT ... ON CONFLICT DO UPDATE
                          -- (escrita real = atividade contabilizada pelo Supabase)
```

```ts
// src/app/api/keep-alive/route.ts  → GET | POST /api/keep-alive
supabase.rpc("keep_alive"); // executa o batimento e devolve last_ping_at / ping_total
```

```json
// vercel.json → cron diário (Hobby permite 1x/dia)
{ "crons": [{ "path": "/api/keep-alive", "schedule": "0 6 * * *" }] }
```

### Ativação (3 passos)

1. **SQL Editor do Supabase** → cole e rode `supabase/keep-alive.sql`
2. Defina `KEEP_ALIVE_SECRET` nas variáveis de ambiente (local + Vercel)
3. Faça o deploy — a Vercel já agenda a chamada diária

Teste manual:

```bash
curl "https://seuapp.vercel.app/api/keep-alive" -H "Authorization: Bearer SEU_SEGREDO"
# → { "ok": true, "latencyMs": 122, "database": { "pingTotal": 7, ... } }
```

### Alternativas de agendamento

| Opção | Frequência | Observação |
|---|---|---|
| **Vercel Cron** (`vercel.json`) | 1x/dia | Já configurado; exige deploy na Vercel |
| **GitHub Actions** (`.github/workflows/supabase-keep-alive.yml`) | a cada 2 dias | Funciona com qualquer host; desativa após 60 dias sem commits |
| **cron-job.org / UptimeRobot** | 1x/dia | Sem código; basta cadastrar a URL + header |

> ⚠️ **Limitação:** keep-alive **não reativa** projeto já pausado — nesse caso use
> "Restore project" no dashboard. Ele existe para que o projeto nunca chegue a pausar.
>
> 📖 Guia completo (variáveis, respostas de erro, quotas): **[SUPABASE_KEEP_ALIVE.md](./SUPABASE_KEEP_ALIVE.md)**

---

## 🩺 Resiliência no Celular (anti-travamento)

O app foi endurecido contra os três sintomas mais comuns de PWA no celular:

| Sintoma | Causa raiz | Correção aplicada |
|---|---|---|
| App "trava" e é preciso fechar o navegador | Service worker antigo (`next-pwa`/Workbox 4) com `StaleWhileRevalidate` em **tudo** — HTML, payloads RSC e `/api/*` — servindo bundle antigo depois do deploy | `next-pwa` removido; `public/sw.js` reescrito como **network-only**, que apaga todos os caches legados ao ativar; `/sw.js` servido com `no-store` |
| Adiciona/remove item e a página não atualiza | A UI dependia 100% do WebSocket: com o canal caído (tela bloqueada, troca Wi‑Fi↔4G) nada mudava até recarregar | `useRealtimeList` com **update otimista + rollback**, reconexão com backoff, resync ao voltar do background e reconciliação a cada 20s |
| Pop-up (toast) aparece e não desaparece | `react-hot-toast` pausa o timer no *hover*; no toque do celular esse "hover" fica preso | Confirmação de exclusão virou **modal real**; toasts com duração fixa e `toast.dismiss()` ao voltar ao app |
| Modal fica travado em "salvando" / spinner infinito | Escrita no Supabase sem limite de tempo (rede móvel que não responde) | `withTimeout` (15s) em **todas** as mutações: a UI é liberada com mensagem de erro em vez de congelar |

Camadas de proteção no código:

- **`src/components/AppHealth.tsx`** — registra o service worker, limpa toasts presos e recarrega uma única vez em caso de `ChunkLoadError` (bundle antigo).
- **`src/hooks/useRealtimeList.ts`** — mutações otimistas, reconexão automática do canal e reconciliação periódica. Um erro de conexão **nunca** substitui a lista por uma tela de erro.
- **`src/lib/async.ts`** — `withTimeout()`: nenhuma escrita deixa spinner/modal presos.
- **`next.config.js`** — `staleTimes: { dynamic: 0 }`: o App Router sempre busca dados frescos ao navegar.
- **`public/sw.js`** — network-only: nunca serve HTML/JS do cache.

> **Após o deploy desta versão:** na primeira abertura no celular, o app substitui o service worker antigo e recarrega sozinho **uma única vez**. Se ainda aparecer a tela antiga, feche o app e abra novamente.

---

## 🔧 Troubleshooting

| Problema | Solução |
|---|---|
| `Cannot find module '@supabase/ssr'` | `npm install @supabase/ssr @supabase/supabase-js` |
| `OPENAI_API_KEY is not set` | Verifique `.env.local` e reinicie o servidor |
| Realtime não sincroniza | Confirme que `supabase/schema.sql` foi executado; verifique **Database → Replication** |
| Câmera não abre no celular | Precisa de HTTPS — use `npx ngrok http 3000` |
| Erro de tipos TypeScript | `npx supabase gen types typescript --project-id ID > src/lib/database.types.ts` |
| `next-pwa` erro no Windows em dev | Não se aplica mais — o `next-pwa` foi removido; o SW é estático (`public/sw.js`) |
| App mostra versão antiga / tela travada após deploy | Feche e reabra o app: o SW network-only limpa o cache legado. Confirme que `/sw.js` responde com `Cache-Control: no-store` |
| Alterações não aparecem em outro celular | Verifique **Database → Replication** em `list_items`; o app reconcilia a cada 20s, mas sem replication o push em tempo real não funciona |
| Projeto Supabase pausado | Restaure em [supabase.com/dashboard](https://supabase.com/dashboard) e rode `supabase/keep-alive.sql`; veja [Keep-Alive](#-keep-alive-do-supabase-free) |
| `/api/keep-alive` retorna 401 | Header `Authorization: Bearer <KEEP_ALIVE_SECRET>` ausente ou diferente da env var |

---

*Veja também: [MANUAL_DE_UTILIZZO.md](./MANUAL_DE_UTILIZZO.md) — Manual do usuário em italiano.*

