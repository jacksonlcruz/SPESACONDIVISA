/**
 * database.types.ts
 * Compatível com @supabase/supabase-js v2.43 + @supabase/ssr v0.10
 * Campos obrigatórios: Relationships, Enums, CompositeTypes
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string;
        };
        Relationships: [];
      };
      lists: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          emoji: string;
          share_token: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          title: string;
          emoji: string;
          is_archived?: boolean;
        };
        Update: {
          owner_id?: string;
          title?: string;
          emoji?: string;
          is_archived?: boolean;
        };
        Relationships: [];
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          created_by: string | null;
          name: string;
          quantity: number;
          unit: string;
          unit_price: number | null;
          is_checked: boolean;
          subtotal: number;
          ai_matched_label: string | null;
          ocr_raw_price: string | null;
          sort_order: number;
          /** 'pending' (ativo) | 'purchased' (finalizado/histórico) */
          status: string | null;
          /** Timestamp do momento em que o item foi finalizado */
          purchased_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          list_id: string;
          created_by?: string | null;
          name: string;
          quantity: number;
          unit: string;
          unit_price?: number | null;
          is_checked?: boolean;
          ai_matched_label?: string | null;
          ocr_raw_price?: string | null;
          sort_order: number;
          status?: string | null;
          purchased_at?: string | null;
        };
        Update: {
          list_id?: string;
          created_by?: string | null;
          name?: string;
          quantity?: number;
          unit?: string;
          unit_price?: number | null;
          is_checked?: boolean;
          ai_matched_label?: string | null;
          ocr_raw_price?: string | null;
          sort_order?: number;
          status?: string | null;
          purchased_at?: string | null;
        };
        Relationships: [];
      };
      list_shares: {
        Row: {
          id: string;
          list_id: string;
          user_id: string | null;
          invited_email: string | null;
          role: "viewer" | "editor";
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          list_id: string;
          user_id?: string | null;
          invited_email?: string | null;
          role: "viewer" | "editor";
          accepted_at?: string | null;
        };
        Update: {
          list_id?: string;
          user_id?: string | null;
          invited_email?: string | null;
          role?: "viewer" | "editor";
          accepted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      list_totals: {
        Row: {
          list_id: string;
          total_items: number;
          checked_items: number;
          total_spent: number;
          estimated_total: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      join_list_by_token: {
        Args: { p_token: string };
        Returns: { list_id: string; status: "owner" | "joined" };
      };
      user_has_list_access: {
        Args: { p_list_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
