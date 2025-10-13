# ⚡ Quick Reference Guide

Fast lookup for common tasks and information.

---

## 🔗 Important URLs

### Local Development
```
http://localhost:5173/                        # Landing page
http://localhost:5173/kopipendekar            # Kopi Pendekar menu
http://localhost:5173/kopipendekar/admin      # Tenant admin
http://localhost:5173/sadmin/login            # Super admin login
```

### Production
```
[YOUR_SUPABASE_URL]                           # Supabase database
```

---

## 🔑 Tenant Information

### Active Tenant: Kopi Pendekar
```
ID:        d9c9a0f5-72d4-4ee2-aba9-6bf89f43d230
Slug:      kopipendekar
Subdomain: kopipendekar
Status:    ✅ Active
```

---

## 📋 Database Tables Quick Ref

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `tenants` | Organizations | id, slug, subdomain |
| `tenant_users` | User roles | tenant_id, user_id, role |
| `categories` | Menu categories | id, name, tenant_id |
| `menu_items` | Products | id, name, price, tenant_id |
| `menu_options` | Customizations | id, menu_item_id, label |
| `orders` | Customer orders | id, order_code, tenant_id |
| `order_items` | Order lines | id, order_id, qty |
| `payment_methods` | Payment config | id, payment_type, tenant_id |

---

## 🎨 Common Components

### Public Components
```typescript
<MenuBrowser />           // Browse menu items
<CartBar />               // Shopping cart sidebar
<CheckoutPage />          // Order checkout form
<InvoicePage />           // Order receipt
```

### Admin Components
```typescript
<AdminDashboard />        // Main admin panel
<OrdersTab />             // Order management
<MenuTab />               // Menu CRUD
<CategoriesTab />         // Category management
<PaymentTab />            // Payment config
<SettingsTab />           // Store settings
```

---

## 🔐 Authentication

### Login Routes
```
/sadmin/login              # Super admin login
/:tenantSlug/admin/login   # Tenant admin login
/auth/callback             # OAuth callback
```

### Check Auth Status
```typescript
const { user, isAuthenticated, isSuperAdmin, isTenantAdmin } = useAuth();
```

### Access Levels
| Role | Access |
|------|--------|
| Super Admin | Platform-wide |
| Tenant Admin | Single tenant full |
| Tenant Manager | Single tenant ops |
| Tenant Cashier | Orders only |
| Public | Browse & order |

---

## 🛒 Cart Management

```typescript
const { items, addItem, removeItem, clearCart, totalAmount } = useCart();

// Add item
addItem({
  id: 'menu-id',
  name: 'Coffee',
  price: 15000,
  qty: 1,
  notes: 'Less sugar'
});

// Clear cart
clearCart();
```

---

## 📦 Order Code Format

```
KP-251007-C2PST3
│  │      │
│  │      └── Random 6-char code
│  └── Date (YYMMDD)
└── Tenant prefix
```

---

## 💳 Payment Methods

| Type | Enum Value | Details |
|------|------------|---------|
| Bank Transfer | `TRANSFER` | Bank name, account number |
| QRIS | `QRIS` | QR code image URL |
| Cash on Delivery | `COD` | No additional info |

---

## 📊 Order Statuses

```typescript
'BELUM BAYAR'   // Unpaid (pending)
'SUDAH BAYAR'   // Paid (completed)
'DIBATALKAN'    // Cancelled
```

---

## 🔧 Common Supabase Queries

### Get Menu Items
```typescript
const { data } = await supabase
  .from('menu_items')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('is_active', true);
```

### Get Orders
```typescript
const { data } = await supabase
  .from('orders')
  .select('*, order_items(*)')
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false });
```

### Get User Access
```typescript
const { data } = await supabase.rpc('get_user_access_status');
// Returns: { is_super_admin, memberships[], user_id, user_email }
```

---

## 🎯 Context Providers

### AuthContext
```typescript
const {
  user,                    // Supabase user object
  loading,                 // Auth loading state
  accessStatus,            // User permissions
  currentTenant,           // Selected tenant
  signIn,                  // Login function
  signOut,                 // Logout function
  isAuthenticated,         // Boolean
  isSuperAdmin,            // Boolean
  isTenantAdmin            // Boolean
} = useAuth();
```

### CartContext
```typescript
const {
  items,                   // CartItem[]
  addItem,                 // (item) => void
  removeItem,              // (id) => void
  updateQuantity,          // (id, qty) => void
  clearCart,               // () => void
  totalItems,              // number
  totalAmount              // number
} = useCart();
```

### ConfigContext
```typescript
const {
  config,                  // { storeName, storeIcon }
  updateConfig,            // (config) => void
  loading                  // boolean
} = useConfig();
```

---

## 📱 Responsive Breakpoints

```css
sm:  640px   /* Tablet */
md:  768px   /* Small desktop */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
```

---

## 🎨 Common Tailwind Classes

```css
/* Buttons */
bg-green-500 text-white rounded-lg px-4 py-2

/* Cards */
bg-white rounded-xl shadow-sm p-6

/* Input */
border border-slate-200 rounded-lg px-3 py-2

/* Loading */
animate-spin rounded-full border-4 border-green-500 border-t-transparent
```

---

## 🔍 Search & Filter

### Full-text Search
```typescript
const { data } = await supabase
  .from('menu_items')
  .select('*')
  .textSearch('search_text', query);
```

### Filter by Category
```typescript
const filtered = menuItems.filter(item => 
  !selectedCategory || item.category_id === selectedCategory
);
```

---

## 🌐 API Endpoints (Supabase RPC)

```typescript
// Get user access status
supabase.rpc('get_user_access_status')

// Future RPC functions can be added here
```

---

## 📸 Image Upload

```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('menu-images')
  .upload(`${tenantId}/${filename}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('menu-images')
  .getPublicUrl(data.path);
```

---

## 🚨 Error Handling

```typescript
try {
  const { data, error } = await supabase...
  if (error) throw error;
  // Handle success
} catch (error) {
  console.error('Error:', error);
  setErrorModal({
    isOpen: true,
    message: 'User-friendly message',
    details: error.message
  });
}
```

---

## 🔄 Common State Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    // Fetch data
  } finally {
    setLoading(false);
  }
};
```

### Form State
```typescript
const [formData, setFormData] = useState({
  name: '',
  price: 0
});

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

---

## 📊 Current Data Stats

```
Categories:        6
Menu Items:        7
Orders:            8
Payment Methods:   1
Total Records:     79
```

---

## 🔗 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [React Router v7](https://reactrouter.com)
- [TailwindCSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

## 💡 Tips & Tricks

1. **Use UUID helpers**
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   ```

2. **Format currency**
   ```typescript
   const formatRupiah = (amount: number) => 
     `Rp ${amount.toLocaleString('id-ID')}`;
   ```

3. **Date formatting**
   ```typescript
   const formatted = new Date().toISOString().split('T')[0];
   ```

4. **Phone normalization**
   ```typescript
   const normalized = phone.startsWith('0') 
     ? '+62' + phone.slice(1) 
     : phone;
   ```

5. **Tenant ID from context**
   ```typescript
   const { currentTenant } = useAuth();
   const tenantId = currentTenant?.tenant_id;
   ```

---

## 🐛 Debugging

### Check Supabase Connection
```typescript
console.log(supabase);
```

### Check Auth State
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### Check RLS Policies
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'menu_items';
```

---

## ⚡ Performance Tips

1. Use `select('*')` only when needed
2. Add `limit()` to large queries
3. Use `single()` for single row queries
4. Enable RLS policies for security
5. Add indexes on frequently queried columns

---

*Last updated: October 10, 2025*



