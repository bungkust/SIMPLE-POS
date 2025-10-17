# Admin Tenant Dashboard

## Product Requirements Document (PRD)

### Overview
The Admin Tenant Dashboard is the restaurant owner's control center for managing their POS system. It provides comprehensive tools for menu management, order processing, payment configuration, and store settings.

### Target Users
- **Primary**: Restaurant owners and managers
- **Secondary**: Restaurant staff with admin access
- **Tertiary**: Restaurant IT administrators

### Core Features

#### 1. Dashboard Overview
- **Order Statistics**: Today's orders, revenue, popular items
- **Quick Actions**: Common tasks and shortcuts
- **Recent Activity**: Latest orders and system events
- **Performance Metrics**: Sales trends and analytics

#### 2. Menu Management
- **Menu Items**: Add, edit, delete menu items
- **Categories**: Organize menu items by categories
- **Pricing**: Set and update item prices
- **Availability**: Manage item availability and stock
- **Images**: Upload and manage item photos

#### 3. Order Management
- **Order Processing**: View and process incoming orders
- **Order History**: Track past orders and transactions
- **Order Status**: Update order status and tracking
- **Customer Information**: View customer details and preferences

#### 4. Payment Configuration
- **Payment Methods**: Configure available payment options
- **QRIS Integration**: Set up QRIS payment with image upload
- **Cash Management**: Configure cash payment settings
- **Payment Status**: Monitor payment processing

#### 5. Store Settings
- **Basic Information**: Store name, description, contact details
- **Operating Hours**: Set business hours and availability
- **Social Media**: Configure social media links
- **Header Display**: Control what information shows on public menu
- **Order Settings**: Configure order processing rules

#### 6. Cashier Interface
- **Point of Sale**: Direct order entry and processing
- **Customer Management**: Add customer information
- **Payment Processing**: Handle payments and receipts
- **Order Completion**: Finalize orders and generate receipts

### User Stories

#### As a Restaurant Owner:
1. I want to manage my menu items so I can keep my offerings up to date
2. I want to process orders quickly so I can serve customers efficiently
3. I want to configure payment methods so customers can pay easily
4. I want to customize my store information so it reflects my brand
5. I want to view sales analytics so I can make business decisions
6. I want to manage my store hours so customers know when I'm open

#### As a Restaurant Manager:
1. I want to track order status so I can manage kitchen operations
2. I want to update menu availability so customers see accurate information
3. I want to process payments so transactions are completed smoothly
4. I want to view order history so I can analyze sales patterns

#### As Restaurant Staff:
1. I want to use the cashier interface so I can take orders directly
2. I want to see order details so I can prepare items correctly
3. I want to process payments so customers can complete their orders

### Success Metrics
- **Order Processing Time**: Average time to process orders
- **Menu Update Frequency**: How often menu is updated
- **Payment Success Rate**: Percentage of successful payments
- **User Adoption**: Staff usage of admin features
- **Customer Satisfaction**: Order completion rates

---

## Technical Documentation

### Architecture

#### Component Structure
```
AdminDashboardNew.tsx
├── MenuTabNew.tsx (Menu management)
├── OrdersTabNew.tsx (Order processing)
├── PaymentTabNew.tsx (Payment configuration)
├── SettingsTabNew.tsx (Store settings)
├── CashierTabNew.tsx (Point of sale)
└── CategoriesTabNew.tsx (Category management)
```

#### Data Flow
```
AdminDashboardNew → Tab Components → Form Modals
       ↓                ↓              ↓
   Tenant Context → Database Operations → Success/Error Handling
```

### Key Components

#### 1. AdminDashboardNew.tsx
**Purpose**: Main dashboard container with tab navigation
**Features**:
- Tab-based navigation
- Dashboard statistics
- Quick action buttons
- User authentication check

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState('menu');
const [dashboardStats, setDashboardStats] = useState({
  todayOrders: 0,
  todayRevenue: 0,
  pendingOrders: 0,
  totalMenuItems: 0
});

// Load dashboard statistics
const loadDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  // Today's orders
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('id, total_amount')
    .eq('tenant_id', currentTenant.id)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);
  
  // Pending orders
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('tenant_id', currentTenant.id)
    .eq('status', 'pending');
  
  // Menu items count
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id')
    .eq('tenant_id', currentTenant.id)
    .eq('is_active', true);
  
  setDashboardStats({
    todayOrders: todayOrders?.length || 0,
    todayRevenue: todayOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
    pendingOrders: pendingOrders?.length || 0,
    totalMenuItems: menuItems?.length || 0
  });
};
```

#### 2. MenuTabNew.tsx
**Purpose**: Menu item management interface
**Features**:
- Menu items data table
- Add/Edit/Delete menu items
- Category management
- Image upload
- Availability toggle

**Menu Item Operations**:
```typescript
// Add menu item
const handleAddMenuItem = async (itemData: MenuItemFormData) => {
  try {
    const { data: newItem, error } = await supabase
      .from('menu_items')
      .insert([{
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        category_id: itemData.category_id,
        image_url: itemData.image_url,
        is_active: true,
        tenant_id: currentTenant.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    setMenuItems(prev => [...prev, newItem]);
    showSuccess('Success', 'Menu item added successfully');
  } catch (error) {
    showError('Error', 'Failed to add menu item');
  }
};

// Update menu item
const handleUpdateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('tenant_id', currentTenant.id);
    
    if (error) throw error;
    
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
    showSuccess('Success', 'Menu item updated successfully');
  } catch (error) {
    showError('Error', 'Failed to update menu item');
  }
};

// Delete menu item
const handleDeleteMenuItem = async (itemId: string) => {
  if (!confirm('Are you sure you want to delete this menu item?')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', currentTenant.id);
    
    if (error) throw error;
    
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    showSuccess('Success', 'Menu item deleted successfully');
  } catch (error) {
    showError('Error', 'Failed to delete menu item');
  }
};
```

#### 3. OrdersTabNew.tsx
**Purpose**: Order management and processing
**Features**:
- Orders data table with filtering
- Order status updates
- Order details modal
- WhatsApp integration
- Order cancellation

**Order Processing**:
```typescript
// Update order status
const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('tenant_id', currentTenant.id);
    
    if (error) throw error;
    
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    showSuccess('Success', 'Order status updated');
  } catch (error) {
    showError('Error', 'Failed to update order status');
  }
};

// Send WhatsApp message
const handleSendWhatsApp = async (order: Order) => {
  try {
    const message = generateWhatsAppMessage(order);
    const whatsappUrl = `https://wa.me/${order.customer_phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  } catch (error) {
    showError('Error', 'Failed to open WhatsApp');
  }
};

// Cancel order
const handleCancelOrder = async (orderId: string) => {
  if (!confirm('Are you sure you want to cancel this order?')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('tenant_id', currentTenant.id);
    
    if (error) throw error;
    
    setOrders(prev => prev.filter(order => order.id !== orderId));
    showSuccess('Success', 'Order cancelled successfully');
  } catch (error) {
    showError('Error', 'Failed to cancel order');
  }
};
```

#### 4. PaymentTabNew.tsx
**Purpose**: Payment method configuration
**Features**:
- Payment method management
- QRIS image upload
- Payment settings
- Method activation/deactivation

**Payment Configuration**:
```typescript
// Add payment method
const handleAddPaymentMethod = async (methodData: PaymentMethodFormData) => {
  try {
    const { data: newMethod, error } = await supabase
      .from('payment_methods')
      .insert([{
        name: methodData.name,
        type: methodData.type,
        is_active: methodData.is_active,
        qris_image_url: methodData.qris_image_url,
        account_number: methodData.account_number,
        tenant_id: currentTenant.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    setPaymentMethods(prev => [...prev, newMethod]);
    showSuccess('Success', 'Payment method added successfully');
  } catch (error) {
    showError('Error', 'Failed to add payment method');
  }
};

// Upload QRIS image
const handleQRISUpload = async (file: File) => {
  try {
    setUploading(true);
    
    const result = await uploadFile(file, uploadConfigs.qrisImage(currentTenant.slug));
    
    if (result.success && result.url) {
      methodForm.setValue('qris_image_url', result.url);
      showSuccess('Success', 'QRIS image uploaded successfully');
    } else {
      showError('Error', 'Failed to upload QRIS image');
    }
  } catch (error) {
    showError('Error', 'Upload failed');
  } finally {
    setUploading(false);
  }
};
```

#### 5. SettingsTabNew.tsx
**Purpose**: Store configuration and settings
**Features**:
- Store information management
- Social media configuration
- Header display settings
- Order processing rules
- Logo upload

**Settings Management**:
```typescript
// Save settings
const handleSaveSettings = async (settingsData: SettingsFormData) => {
  try {
    // Update tenant name
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ 
        name: settingsData.storeName,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentTenant.id);
    
    if (tenantError) throw tenantError;
    
    // Update tenant info
    const tenantInfoData = {
      description: settingsData.storeDescription,
      address: settingsData.storeAddress,
      phone: settingsData.storePhone,
      email: settingsData.storeEmail,
      operating_hours: settingsData.storeHours,
      logo_url: settingsData.storeIconType === 'uploaded' ? settingsData.storeIcon : null,
      instagram_url: settingsData.socialMedia?.instagram,
      tiktok_url: settingsData.socialMedia?.tiktok,
      twitter_url: settingsData.socialMedia?.twitter,
      facebook_url: settingsData.socialMedia?.facebook,
      show_operating_hours: settingsData.headerDisplaySettings?.showOperatingHours,
      show_address: settingsData.headerDisplaySettings?.showAddress,
      show_phone: settingsData.headerDisplaySettings?.showPhone,
      show_social_media: settingsData.headerDisplaySettings?.showSocialMedia
    };
    
    const { error: infoError } = await updateTenantInfo(currentTenant.id, tenantInfoData);
    if (infoError) throw infoError;
    
    // Update order settings
    const { error: orderError } = await supabase
      .from('tenants')
      .update({
        settings: {
          auto_accept_orders: settingsData.autoAcceptOrders,
          require_phone_verification: settingsData.requirePhoneVerification,
          allow_guest_checkout: settingsData.allowGuestCheckout,
          minimum_order_amount: settingsData.minimumOrderAmount,
          delivery_fee: settingsData.deliveryFee,
          free_delivery_threshold: settingsData.freeDeliveryThreshold
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', currentTenant.id);
    
    if (orderError) throw orderError;
    
    showSuccess('Success', 'Settings saved successfully');
  } catch (error) {
    showError('Error', 'Failed to save settings');
  }
};
```

#### 6. CashierTabNew.tsx
**Purpose**: Point of sale interface
**Features**:
- Direct order entry
- Customer information capture
- Payment processing
- Receipt generation
- Order completion

**Cashier Operations**:
```typescript
// Process cashier order
const handleProcessOrder = async (orderData: CashierOrderData) => {
  try {
    // Generate order code
    const orderCode = generateOrderCode();
    
    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_code: orderCode,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        payment_method: orderData.paymentMethod,
        total_amount: orderData.totalAmount,
        status: 'completed',
        tenant_id: currentTenant.id
      }])
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: newOrder.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price: item.price,
      tenant_id: currentTenant.id
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) throw itemsError;
    
    // Clear cart and show success
    clearCart();
    showSuccess('Success', 'Order processed successfully');
    
    // Redirect to success page
    navigate(`/admin/dashboard/orders?success=${newOrder.id}`);
  } catch (error) {
    showError('Error', 'Failed to process order');
  }
};
```

### Data Models

#### Menu Item
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
```

#### Order
```typescript
interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
```

#### Payment Method
```typescript
interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'qris' | 'transfer' | 'cod';
  is_active: boolean;
  qris_image_url: string | null;
  account_number: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
```

### API Integration

#### Supabase Queries
```typescript
// Load menu items with categories
const loadMenuItems = async () => {
  const { data: items, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories(name)
    `)
    .eq('tenant_id', currentTenant.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return items;
};

// Load orders with items
const loadOrders = async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        menu_items(name, price)
      )
    `)
    .eq('tenant_id', currentTenant.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return orders;
};

// Load payment methods
const loadPaymentMethods = async () => {
  const { data: methods, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('tenant_id', currentTenant.id)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return methods;
};
```

### Authentication & Authorization

#### Tenant Access Control
```typescript
// Check tenant access
const checkTenantAccess = async (tenantId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, owner_id')
    .eq('id', tenantId)
    .single();
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  
  if (tenant.owner_id !== user.id) {
    throw new Error('Access denied');
  }
  
  return tenant;
};
```

#### Protected Admin Routes
```typescript
// Admin route protection
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, currentTenant, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && (!user || !currentTenant)) {
      navigate('/admin/login');
    }
  }, [user, currentTenant, loading, navigate]);
  
  if (loading) return <LoadingSpinner />;
  if (!user || !currentTenant) return null;
  
  return <>{children}</>;
};
```

### Error Handling

#### Global Error Handling
```typescript
// Error boundary for admin components
const AdminErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Admin error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="error-boundary">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return <>{children}</>;
};
```

#### Form Validation
```typescript
// Form validation schemas
const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price must be positive'),
  category_id: z.string().min(1, 'Category is required'),
  image_url: z.string().url().optional().or(z.literal(''))
});

const orderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().min(1, 'Phone number is required'),
  payment_method: z.string().min(1, 'Payment method is required'),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0)
  })).min(1, 'At least one item is required')
});
```

### Performance Optimizations

#### Data Caching
```typescript
// Cache frequently accessed data
const [menuCache, setMenuCache] = useState<Map<string, MenuItem>>(new Map());
const [orderCache, setOrderCache] = useState<Map<string, Order>>(new Map());

// Use React Query for data fetching
const { data: menuItems, isLoading } = useQuery({
  queryKey: ['menu-items', currentTenant.id],
  queryFn: () => loadMenuItems(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
});
```

#### Optimistic Updates
```typescript
// Optimistic UI updates
const handleToggleMenuItemStatus = async (itemId: string, isActive: boolean) => {
  // Optimistic update
  setMenuItems(prev => prev.map(item => 
    item.id === itemId ? { ...item, is_active: isActive } : item
  ));
  
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: isActive })
      .eq('id', itemId);
    
    if (error) throw error;
  } catch (error) {
    // Revert on error
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, is_active: !isActive } : item
    ));
    showError('Error', 'Failed to update item status');
  }
};
```

### Testing

#### Unit Tests
```typescript
// Test menu item operations
describe('Menu Item Management', () => {
  it('should add menu item with valid data', async () => {
    const itemData = {
      name: 'Test Item',
      description: 'Test description',
      price: 10000,
      category_id: 'test-category'
    };
    
    const result = await addMenuItem(itemData);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(itemData.name);
    expect(result.price).toBe(itemData.price);
  });
  
  it('should update menu item status', async () => {
    const itemId = 'test-item-id';
    const isActive = false;
    
    await updateMenuItemStatus(itemId, isActive);
    
    const updatedItem = await getMenuItem(itemId);
    expect(updatedItem.is_active).toBe(isActive);
  });
});
```

#### Integration Tests
```typescript
// Test complete order workflow
describe('Order Processing Workflow', () => {
  it('should process order from creation to completion', async () => {
    // Create order
    const order = await createOrder(orderData);
    expect(order.status).toBe('pending');
    
    // Update status to processing
    await updateOrderStatus(order.id, 'processing');
    const updatedOrder = await getOrder(order.id);
    expect(updatedOrder.status).toBe('processing');
    
    // Complete order
    await updateOrderStatus(order.id, 'completed');
    const completedOrder = await getOrder(order.id);
    expect(completedOrder.status).toBe('completed');
  });
});
```

### Security Considerations

#### Input Sanitization
```typescript
// Sanitize user inputs
const sanitizeInput = (input: string) => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

// Validate file uploads
const validateFileUpload = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  return true;
};
```

#### Access Control
```typescript
// Row Level Security (RLS) policies
// Users can only access their own tenant's data
CREATE POLICY "Users can access own tenant data" ON menu_items
FOR ALL USING (tenant_id IN (
  SELECT id FROM tenants WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can access own tenant orders" ON orders
FOR ALL USING (tenant_id IN (
  SELECT id FROM tenants WHERE owner_id = auth.uid()
));
```

### Deployment

#### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=your_production_url
```

#### Build Optimization
```typescript
// Code splitting for admin components
const AdminDashboard = lazy(() => import('./AdminDashboardNew'));
const MenuTab = lazy(() => import('./MenuTabNew'));
const OrdersTab = lazy(() => import('./OrdersTabNew'));
const PaymentTab = lazy(() => import('./PaymentTabNew'));
const SettingsTab = lazy(() => import('./SettingsTabNew'));
const CashierTab = lazy(() => import('./CashierTabNew'));
```

### Monitoring & Analytics

#### Performance Metrics
- Page load times for each tab
- API response times
- Error rates by component
- User interaction patterns

#### Business Metrics
- Order processing times
- Menu update frequency
- Payment method usage
- Settings change frequency

### Future Enhancements

#### Planned Features
1. **Advanced Analytics**: Detailed sales and performance analytics
2. **Inventory Management**: Stock tracking and low stock alerts
3. **Customer Management**: Customer database and loyalty programs
4. **Multi-location Support**: Manage multiple restaurant locations
5. **Staff Management**: User roles and permissions
6. **Reporting**: Comprehensive business reports
7. **Integration APIs**: Third-party service integrations
8. **Mobile App**: Mobile admin interface

#### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Offline Support**: PWA capabilities for offline operation
3. **Advanced Search**: Full-text search across all data
4. **Bulk Operations**: Bulk import/export functionality
5. **Automation**: Automated workflows and notifications
6. **AI Features**: Predictive analytics and recommendations
7. **Multi-language**: Internationalization support
8. **Advanced Security**: Enhanced security features
