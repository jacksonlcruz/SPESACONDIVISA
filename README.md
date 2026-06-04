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
13. [Troubleshooting](#-troubleshooting)

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
├── next.config.js              ← Configuração Next.js + PWA
├── tailwind.config.js          ← Design system (cores, animações)
├── tsconfig.json               ← TypeScript strict mode
├── package.json
│
├── public/
│   └── manifest.json           ← Manifesto PWA (ícones, tema)
│
├── supabase/
│   └── schema.sql              ← ⚠️ Execute PRIMEIRO no Supabase
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
    │       ├── auth/callback/route.ts
    │       └── auth/signout/route.ts
    │
    ├── components/
    │   ├── ShoppingList.tsx        ← Orquestrador principal
    │   ├── ShoppingListItem.tsx    ← Linha individual (React.memo)
    │   ├── PriceModal.tsx          ← Bottom sheet: manual + câmera
    │   ├── CameraCapture.tsx       ← Câmera nativa + chamada à IA
    │   └── TotalDisplay.tsx        ← Painel sticky: totais + progresso
    │
    ├── hooks/
    │   ├── useRealtimeList.ts
    │   └── useShoppingCalculator.ts
    │
    ├── lib/
    │   ├── supabaseClient.ts
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
```

| Variável | Desenvolvimento | Produção |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Mesma |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave `anon` | Mesma |
| `OPENAI_API_KEY` | Chave dev/teste | Chave produção |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://seudominio.com` |

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
```

Após o deploy, configure no painel do Supabase:
- **Authentication → URL Configuration → Site URL**: `https://seuapp.vercel.app`
- **Redirect URLs**: `https://seuapp.vercel.app/auth/callback`

---

## 🔧 Troubleshooting

| Problema | Solução |
|---|---|
| `Cannot find module '@supabase/ssr'` | `npm install @supabase/ssr @supabase/supabase-js` |
| `OPENAI_API_KEY is not set` | Verifique `.env.local` e reinicie o servidor |
| Realtime não sincroniza | Confirme que `supabase/schema.sql` foi executado; verifique **Database → Replication** |
| Câmera não abre no celular | Precisa de HTTPS — use `npx ngrok http 3000` |
| Erro de tipos TypeScript | `npx supabase gen types typescript --project-id ID > src/lib/database.types.ts` |
| `next-pwa` erro no Windows em dev | Normal — PWA desabilitado em dev automaticamente, não afeta funcionamento |

---

*Veja também: [MANUAL_DE_UTILIZZO.md](./MANUAL_DE_UTILIZZO.md) — Manual do usuário em italiano.*

