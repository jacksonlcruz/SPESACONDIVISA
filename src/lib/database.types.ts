/**
 * database.types.ts
 * Gerado automaticamente via: npx supabase gen types typescript --linked
 * Inclui apenas as tabelas relevantes para autocompletar.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
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
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["lists"]["Row"],
          "id" | "share_token" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["lists"]["Insert"]>;
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["list_items"]["Row"],
          "id" | "subtotal" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["list_items"]["Insert"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["list_shares"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["list_shares"]["Insert"]>;
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
  };
}
