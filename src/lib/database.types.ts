// Auto-generated database types
export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: 'super_admin' | 'manager' | 'staff';
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          user_id: string;
          platform_role: 'staff' | 'manager' | 'super_admin';
          updated_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          created_at: string;
          tenant_id: string;
        };
      };
      menu_discounts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          discount_type: 'percentage' | 'fixed_amount';
          discount_value: number;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
          tenant_id: string | null;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          photo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          discount_id: string | null;
          base_price: number;
          short_description: string | null;
          tenant_id: string;
          search_text: string | null;
        };
      };
      menu_options: {
        Row: {
          id: string;
          menu_item_id: string;
          label: string;
          selection_type: 'single_required' | 'single_optional' | 'multiple';
          max_selections: number;
          is_required: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          tenant_id: string;
        };
      };
      menu_option_items: {
        Row: {
          id: string;
          menu_option_id: string;
          name: string;
          additional_price: number;
          is_available: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          tenant_id: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_code: string | null;
          customer_name: string;
          phone: string;
          pickup_date: string;
          notes: string | null;
          payment_method: 'TRANSFER' | 'QRIS' | 'COD';
          status: 'BELUM BAYAR' | 'SUDAH BAYAR' | 'DIBATALKAN';
          subtotal: number;
          discount: number;
          service_fee: number;
          total: number;
          created_at: string;
          updated_at: string;
          tenant_id: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          menu_id: string | null;
          name_snapshot: string;
          price_snapshot: number;
          qty: number;
          notes: string | null;
          line_total: number;
          tenant_id: string | null;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          payment_type: 'TRANSFER' | 'QRIS' | 'COD';
          bank_name: string | null;
          account_number: string | null;
          account_holder: string | null;
          qris_image_url: string | null;
          tenant_id: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          subdomain: string;
          domain: string | null;
          email_domain: string | null;
          settings: any;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_email: string;
          role: 'super_admin' | 'admin' | 'manager' | 'cashier';
          permissions: any;
          is_active: boolean;
          invited_by: string | null;
          invited_at: string;
          joined_at: string | null;
          created_at: string;
          user_id: string | null;
          tenant_role: 'cashier' | 'manager' | 'admin' | 'super_admin';
          updated_at: string;
        };
      };
    };
    Functions: {
      get_user_access_status: {
        Args: Record<string, never>;
        Returns: {
          is_super_admin: boolean;
          memberships: Array<{
            tenant_id: string;
            tenant_slug: string;
            tenant_name: string;
            role: 'super_admin' | 'admin' | 'manager' | 'cashier';
          }>;
          user_id: string;
          user_email: string;
        };
      };
    };
  };
}
