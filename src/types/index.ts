// ============================================================
//  Tipos centrais do domínio — refletem o schema do Supabase
// ============================================================

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  owner_id: string;
  title: string;
  emoji: string;
  share_token: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // joins opcionais
  owner?: Profile;
  items?: ListItem[];
  totals?: ListTotals;
}

export interface ListItem {
  id: string;
  list_id: string;
  created_by: string | null;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  is_checked: boolean;
  subtotal: number;           // coluna gerada pelo DB
  ai_matched_label: string | null;
  ocr_raw_price: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ListShare {
  id: string;
  list_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: "viewer" | "editor";
  accepted_at: string | null;
  created_at: string;
  // joins opcionais
  profile?: Profile;
}

export interface ListTotals {
  list_id: string;
  total_items: number;
  checked_items: number;
  total_spent: number;
  estimated_total: number;
}

// ──────────────────────────────────────────────────────────
// DTO para criação / atualização
// ──────────────────────────────────────────────────────────
export type CreateListPayload = Pick<ShoppingList, "title" | "emoji">;

export type CreateItemPayload = Pick<
  ListItem,
  "list_id" | "name" | "quantity" | "unit" | "unit_price" | "sort_order"
>;

export type UpdateItemPayload = Partial<
  Pick<ListItem, "name" | "quantity" | "unit" | "unit_price" | "is_checked" | "sort_order">
>;

// ──────────────────────────────────────────────────────────
// Tipos para o fluxo de IA / OCR
// ──────────────────────────────────────────────────────────
export interface OcrResult {
  /** Preço extraído da etiqueta, em centavos */
  price_cents: number | null;
  /** Texto bruto reconhecido */
  raw_text: string;
  /** Nome do produto identificado na imagem */
  product_name: string | null;
  /** Confiança da extração (0–1) */
  confidence: number;
}

export interface AiMatchResult {
  /** Item da lista que melhor corresponde ao produto fotografado */
  matched_item_id: string | null;
  /** Nome canônico do produto conforme reconhecido pela IA */
  matched_label: string;
  /** Preço sugerido em reais/euros */
  suggested_price: number | null;
  /** Texto OCR bruto */
  ocr_raw: string;
  /** Confiança do match semântico (0–1) */
  confidence: number;
  /** Explicação legível gerada pela IA */
  explanation: string;
}

// ──────────────────────────────────────────────────────────
// Eventos Realtime (payloads recebidos via Supabase channel)
// ──────────────────────────────────────────────────────────
export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimePayload<T> {
  eventType: RealtimeEventType;
  new: T;
  old: Partial<T>;
  schema: string;
  table: string;
  commit_timestamp: string;
}
