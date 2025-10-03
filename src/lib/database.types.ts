export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      menu_discounts: {
        Row: {
          created_at: string
          description: string | null
          discount_type: 'percentage' | 'fixed_amount'
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_type: 'percentage' | 'fixed_amount'
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed_amount'
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string
          description: string | null
          discount_id: string | null
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          price: number
          short_description: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          price: number
          short_description?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          price?: number
          short_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "menu_discounts"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_option_items: {
        Row: {
          additional_price: number
          created_at: string
          id: string
          is_available: boolean
          menu_option_id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          additional_price?: number
          created_at?: string
          id?: string
          is_available?: boolean
          menu_option_id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          additional_price?: number
          created_at?: string
          id?: string
          is_available?: boolean
          menu_option_id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_option_items_menu_option_id_fkey"
            columns: ["menu_option_id"]
            isOneToOne: false
            referencedRelation: "menu_options"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_options: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          label: string
          max_selections: number
          menu_item_id: string
          selection_type: 'single_required' | 'single_optional' | 'multiple'
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          label: string
          max_selections?: number
          menu_item_id: string
          selection_type: 'single_required' | 'single_optional' | 'multiple'
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          label?: string
          max_selections?: number
          menu_item_id?: string
          selection_type?: 'single_required' | 'single_optional' | 'multiple'
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_options_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_code: string
          customer_name: string
          phone: string
          pickup_date: string
          notes: string | null
          payment_method: 'TRANSFER' | 'QRIS' | 'COD'
          status: 'BELUM BAYAR' | 'SUDAH BAYAR' | 'DIBATALKAN'
          subtotal: number
          discount: number
          service_fee: number
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          phone: string
          pickup_date: string
          notes?: string | null
          payment_method?: 'TRANSFER' | 'QRIS' | 'COD'
          status?: 'BELUM BAYAR' | 'SUDAH BAYAR' | 'DIBATALKAN'
          subtotal: number
          discount?: number
          service_fee?: number
          total: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          phone?: string
          pickup_date?: string
          notes?: string | null
          payment_method?: 'TRANSFER' | 'QRIS' | 'COD'
          status?: 'BELUM BAYAR' | 'SUDAH BAYAR' | 'DIBATALKAN'
          subtotal?: number
          discount?: number
          service_fee?: number
          total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_id: string | null
          name_snapshot: string
          price_snapshot: number
          qty: number
          notes: string | null
          line_total: number
        }
        Insert: {
          id?: string
          order_id: string
          menu_id?: string | null
          name_snapshot: string
          price_snapshot: number
          qty: number
          notes?: string | null
          line_total: number
        }
        Update: {
          id?: string
          order_id?: string
          menu_id?: string | null
          name_snapshot?: string
          price_snapshot?: number
          qty?: number
          notes?: string | null
          line_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_proofs: {
        Row: {
          id: string
          order_id: string
          method: string | null
          amount: number | null
          proof_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          method?: string | null
          amount?: number | null
          proof_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          method?: string | null
          amount?: number | null
          proof_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
