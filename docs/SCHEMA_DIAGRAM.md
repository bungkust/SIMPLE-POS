# 🗺️ Database Schema Diagram

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MULTI-TENANT ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   ADMIN_USERS    │  Platform Level (Super Admins)
│──────────────────│
│ id (PK)          │
│ email            │
│ role             │  ← platform_role_enum (super_admin, manager, staff)
│ is_active        │
└──────────────────┘


┌──────────────────┐
│     TENANTS      │  Multi-tenant Organizations
│──────────────────│
│ id (PK)          │─────────┐
│ name             │         │
│ slug             │         │
│ subdomain        │         │
│ is_active        │         │
│ settings (JSONB) │         │
└──────────────────┘         │
                             │
                             ├──────────────────────────────────┐
                             │                                  │
                 ┌───────────▼──────────┐          ┌───────────▼──────────┐
                 │   TENANT_USERS       │          │    CATEGORIES        │
                 │──────────────────────│          │──────────────────────│
                 │ id (PK)              │          │ id (PK)              │
                 │ tenant_id (FK)       │          │ tenant_id (FK)       │
                 │ user_id (FK → auth)  │          │ name                 │
                 │ user_email           │          │ sort_order           │
                 │ role                 │          └───────────┬──────────┘
                 │ permissions (JSONB)  │                      │
                 └──────────────────────┘                      │
                          ↑                                    │
                          │                                    │
         tenant_role_enum │                                    │
         (super_admin,    │                                    │
          admin,          │                                    │
          manager,        │                                    │
          cashier)        │                                    │
                                                               │
                                                   ┌───────────▼──────────┐
                                                   │    MENU_ITEMS        │
                                                   │──────────────────────│
                                                   │ id (PK)              │
                                                   │ tenant_id (FK)       │
                                                   │ category_id (FK)     │
                                                   │ name                 │
                                                   │ description          │
                                                   │ price                │
                                                   │ photo_url            │
                                                   │ is_active            │
                                                   │ discount_id (FK)     │
                                                   │ search_text (tsvec)  │
                                                   └───────────┬──────────┘
                                                               │
                                    ┌──────────────────────────┼──────────────────────────┐
                                    │                          │                          │
                        ┌───────────▼──────────┐  ┌───────────▼──────────┐  ┌───────────▼──────────┐
                        │  MENU_OPTIONS        │  │  MENU_DISCOUNTS      │  │     ORDERS           │
                        │──────────────────────│  │──────────────────────│  │──────────────────────│
                        │ id (PK)              │  │ id (PK)              │  │ id (PK)              │
                        │ tenant_id (FK)       │  │ tenant_id (FK)       │  │ tenant_id (FK)       │
                        │ menu_item_id (FK)    │  │ name                 │  │ order_code           │
                        │ label                │  │ discount_type        │  │ customer_name        │
                        │ selection_type       │  │ discount_value       │  │ phone                │
                        │ is_required          │  │ is_active            │  │ payment_method       │
                        └───────────┬──────────┘  └──────────────────────┘  │ status               │
                                    │                                        │ total                │
                        ┌───────────▼──────────┐                            └───────────┬──────────┘
                        │ MENU_OPTION_ITEMS    │                                        │
                        │──────────────────────│                            ┌───────────▼──────────┐
                        │ id (PK)              │                            │   ORDER_ITEMS        │
                        │ tenant_id (FK)       │                            │──────────────────────│
                        │ menu_option_id (FK)  │                            │ id (PK)              │
                        │ name                 │                            │ tenant_id (FK)       │
                        │ additional_price     │                            │ order_id (FK)        │
                        │ is_available         │                            │ menu_id (FK)         │
                        └──────────────────────┘                            │ name_snapshot        │
                                                                            │ price_snapshot       │
                                                                            │ qty                  │
                                                                            │ line_total           │
                                                                            └──────────────────────┘

                        ┌──────────────────────┐
                        │  PAYMENT_METHODS     │
                        │──────────────────────│
                        │ id (PK)              │
                        │ tenant_id (FK)       │
                        │ name                 │
                        │ payment_type         │
                        │ bank_name            │
                        │ account_number       │
                        │ qris_image_url       │
                        │ is_active            │
                        └──────────────────────┘
```

---

## 🔑 Key Relationships

### Tenant Hierarchy
```
TENANTS (1) ──< (many) TENANT_USERS
                        ↓ user_id links to Supabase auth.users
                        
TENANTS (1) ──< (many) CATEGORIES
TENANTS (1) ──< (many) MENU_ITEMS  
TENANTS (1) ──< (many) ORDERS
TENANTS (1) ──< (many) PAYMENT_METHODS
```

### Menu System
```
CATEGORIES (1) ──< (many) MENU_ITEMS
MENU_ITEMS (1) ──< (many) MENU_OPTIONS
MENU_OPTIONS (1) ──< (many) MENU_OPTION_ITEMS

MENU_DISCOUNTS (1) ──< (many) MENU_ITEMS (optional)
```

### Order System
```
ORDERS (1) ──< (many) ORDER_ITEMS
ORDER_ITEMS (many) ──> (1) MENU_ITEMS (reference)
```

---

## 🛡️ Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only access data from their tenant(s)
- Super admins have platform-wide access
- Public tables (menu_items, categories) readable by anonymous users
- Sensitive tables (admin_users, tenant_users, tenants) require authentication

### Foreign Keys
- **Cascade on delete** where appropriate
- **Tenant isolation** enforced at database level
- **User references** link to Supabase auth.users

---

## 📊 Data Flow

### Customer Order Flow
```
1. Customer browses → MENU_ITEMS (filtered by tenant_id)
2. Views options   → MENU_OPTIONS + MENU_OPTION_ITEMS
3. Places order    → ORDERS (creates record)
4. Order details   → ORDER_ITEMS (snapshots menu data)
5. Payment info    → Uses PAYMENT_METHODS from tenant
```

### Admin Management Flow
```
1. Super Admin    → ADMIN_USERS (platform access)
2. Creates Tenant → TENANTS (new organization)
3. Adds Admin     → TENANT_USERS (tenant-specific access)
4. Admin manages  → MENU_ITEMS, CATEGORIES, ORDERS
5. Configures     → PAYMENT_METHODS, MENU_DISCOUNTS
```

---

## 🎯 Tenant Isolation Strategy

Every operational table includes `tenant_id`:
- ✅ **categories** - tenant_id
- ✅ **menu_items** - tenant_id
- ✅ **menu_options** - tenant_id
- ✅ **menu_option_items** - tenant_id
- ✅ **menu_discounts** - tenant_id
- ✅ **orders** - tenant_id
- ✅ **order_items** - tenant_id
- ✅ **payment_methods** - tenant_id

This ensures:
1. **Data isolation** between tenants
2. **Query performance** with indexed tenant_id
3. **Security** via RLS policies
4. **Scalability** for multi-tenant growth

---

## 🔍 Indexing Strategy

### Primary Indexes
- All PKs are UUID with btree index
- Foreign keys automatically indexed

### Composite Indexes
- `(tenant_id, user_id)` on tenant_users
- `(tenant_id, name)` on categories
- `(id, tenant_id)` on multiple tables for JOIN optimization

### Special Indexes
- **GIN index** on menu_items.search_text (full-text search)
- **GIN index** on JSONB columns (settings, permissions)
- **Trigram index** for fuzzy search capabilities

---

## 📝 Data Types & Enums

### Custom Enums
```sql
payment_type_enum   → 'TRANSFER', 'QRIS', 'COD'
order_status_enum   → 'BELUM BAYAR', 'SUDAH BAYAR', 'DIBATALKAN'
selection_type_enum → 'single_required', 'single_optional', 'multiple'
discount_type_enum  → 'percentage', 'fixed_amount'
platform_role_enum  → 'super_admin', 'manager', 'staff'
tenant_role_enum    → 'super_admin', 'admin', 'manager', 'cashier'
```

### Special Columns
- **JSONB**: settings, permissions (flexible schema)
- **tsvector**: search_text (full-text search)
- **citext**: email, slug (case-insensitive)
- **timestamptz**: All timestamps with timezone

---

## 🚀 Performance Optimizations

1. **UUID v4** for globally unique IDs across tenants
2. **JSONB** for flexible settings without schema changes
3. **tsvector** for instant full-text search
4. **citext** to avoid case-sensitivity issues
5. **Indexes** on all foreign keys and frequently queried columns
6. **RLS policies** written for index usage

---

## 📦 Current State (Kopi Pendekar Tenant)

**Tenant ID:** `d9c9a0f5-72d4-4ee2-aba9-6bf89f43d230`

- ✅ 6 Categories
- ✅ 7 Menu Items
- ✅ 14 Menu Options
- ✅ 32 Option Items
- ✅ 2 Discounts
- ✅ 8 Orders
- ✅ 9 Order Items  
- ✅ 1 Payment Method (Bank Jago)

**Status:** Fully operational and processing orders

