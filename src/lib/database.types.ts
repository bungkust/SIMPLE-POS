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
          id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          photo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
