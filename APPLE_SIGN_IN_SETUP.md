# 🍎 Guia de Configuração: Apple Sign-In no Supabase

Este guia explica passo a passo como configurar o **Sign in with Apple** no painel do Supabase para habilitar o login via Apple no app **Spesa Condivisa**.

---

## 📋 Pré-requisitos

- Conta Apple Developer Program (USD 99/ano) — obrigatório para gerar chaves
- Acesso ao [Apple Developer Portal](https://developer.apple.com/account)
- Acesso ao [Supabase Dashboard](https://app.supabase.com) do projeto

---

## Etapa 1: Criar um **App ID** no Apple Developer

1. Acesse [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers).
2. Clique em **"+"** → **App IDs** → **Continue**.
3. Selecione **"App"** como tipo.
4. Preencha:
   - **Description**: `Spesa Condivisa`
   - **Bundle ID**: `com.jacksonlcruz.spesacondivisa` (formato reverse-domain)
5. Em **Capabilities**, marque **"Sign in with Apple"**.
6. Clique **Continue** → **Register**.

---

## Etapa 2: Criar um **Services ID**

1. Acesse [developer.apple.com/account/resources/identifiers/service](https://developer.apple.com/account/resources/identifiers/service).
2. Clique em **"+"** → **Services IDs** → **Continue**.
3. Preencha:
   - **Description**: `Spesa Condivisa Web Auth`
   - **Identifier**: `com.jacksonlcruz.spesacondivisa.web`
4. Clique **Register**.

5. Após criado, clique no Services ID → marque **"Sign in with Apple"** → **Configure**.
6. Na tela de configuração:
   - **Primary App ID**: Selecione o App ID criado na Etapa 1.
   - **Web Domain**: `spesa.jacksonlcruz.com.br`
   - **Return URLs**: Adicione:
     ```
     https://<SEU_PROJETO>.supabase.co/auth/v1/callback
     ```
     > Substitua `<SEU_PROJETO>` pelo ID do seu projeto Supabase.
7. Clique **Save**.

---

## Etapa 3: Obter o **Team ID**

1. Acesse [developer.apple.com/account](https://developer.apple.com/account).
2. No topo da página, em **Membership**, copie o **Team ID** (ex: `ABC123XYZ`).

---

## Etapa 4: Criar a **Private Key (.p8)**

1. Acesse [developer.apple.com/account/resources/authkeys](https://developer.apple.com/account/resources/authkeys).
2. Clique em **"+"** → **Register a New Key**.
3. Preencha:
   - **Key Name**: `Spesa Condivisa Sign-In Key`
4. Marque **"Sign in with Apple"** → **Configure** → selecione o App ID da Etapa 1.
5. Clique **Continue** → **Register**.
6. **⚠️ IMPORTANTE**: Na tela de confirmação, clique em **Download** para baixar o arquivo `.p8`.
   > 🔴 Esta é a **única vez** que você poderá baixar a chave. Guarde o arquivo em local seguro.
7. Anote o **Key ID** exibido na tabela (ex: `ABCDE12345`).

---

## Etapa 5: Configurar o Supabase

1. Acesse [app.supabase.com](https://app.supabase.com) → selecione seu projeto.
2. Vá para **Authentication** → **Providers**.
3. Encontre **Apple** e expanda a seção.
4. Preencha os campos:

| Campo | Valor |
|---|---|
| **Enabled** | ✅ Ativado |
| **Client ID (Services ID)** | `com.jacksonlcruz.spesacondivisa.web` |
| **Team ID** | Seu Team ID (Etapa 3) |
| **Key ID** | Seu Key ID (Etapa 4) |
| **Private Key** | Conteúdo do arquivo `.p8` (abra com bloco de notas e cole o texto completo, incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`) |

5. Clique **Save**.

---

## Etapa 6: Adicionar URL de Callback

1. Na mesma seção do provider Apple, em **Additional Redirect URLs**, adicione:
   ```
   http://localhost:3001/auth/callback
   https://spesa.jacksonlcruz.com.br/auth/callback
   ```

2. Clique **Save** novamente.

---

## ✅ Verificação

1. Inicie o app localmente (`npm run dev`).
2. Na tela de login, clique em **"Continua con Apple"**.
3. O popup da Apple deve abrir. Faça login com seu Apple ID.
4. Você deve ser redirecionado para `/dashboard`.

Em caso de erro `Unsupported provider: provider is not enabled`, verifique:
- Se o toggle **Enabled** está ativado no Supabase
- Se o Services ID e a Private Key foram colados corretamente
- Se a URL de callback está na lista de **Additional Redirect URLs**

---

## 🔧 Troubleshooting

| Erro | Causa provável | Solução |
|---|---|---|
| `Unsupported provider` | Provider não ativado no Supabase | Vá em Auth → Providers → ative o toggle Apple |
| `invalid_client` | Services ID errado ou Private Key inválida | Verifique o Services ID e cole a chave `.p8` completa |
| `invalid_grant` | Código de autorização expirado | Usuário deve tentar login novamente |
| Nome não aparece no perfil | Apple só envia nome no **primeiro** login | O callback já usa fallback (prefixo do e-mail) |

---

## 📎 Referências

- [Supabase Docs — Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Developer — Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)