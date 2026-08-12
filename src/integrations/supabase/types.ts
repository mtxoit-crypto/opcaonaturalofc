export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string
          code: string
          complement: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          district: string
          id: string
          notes: string | null
          number: string
          payment_method: string
          shipping_fee: number
          state: string
          status: string
          street: string
          subtotal: number
          total: number
          updated_at: string
          zip_code: string
        }
        Insert: {
          city: string
          code?: string
          complement?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          district: string
          id?: string
          notes?: string | null
          number: string
          payment_method?: string
          shipping_fee?: number
          state: string
          status?: string
          street: string
          subtotal?: number
          total?: number
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string
          code?: string
          complement?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          district?: string
          id?: string
          notes?: string | null
          number?: string
          payment_method?: string
          shipping_fee?: number
          state?: string
          status?: string
          street?: string
          subtotal?: number
          total?: number
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          benefits: string[]
          capsule_color: string
          capsule_count: number
          created_at: string
          description: string | null
          dosage: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          is_active: boolean
          jar_color: string
          lid_color: string
          name: string
          price: number | null
          slug: string
          sort_order: number
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          benefits?: string[]
          capsule_color?: string
          capsule_count?: number
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          jar_color?: string
          lid_color?: string
          name: string
          price?: number | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: string[]
          capsule_color?: string
          capsule_count?: number
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          jar_color?: string
          lid_color?: string
          name?: string
          price?: number | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          created_at: string
          free_shipping_min: number
          id: boolean
          pix_key: string | null
          shipping_fee: number
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          created_at?: string
          free_shipping_min?: number
          id?: boolean
          pix_key?: string | null
          shipping_fee?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          created_at?: string
          free_shipping_min?: number
          id?: boolean
          pix_key?: string | null
          shipping_fee?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
