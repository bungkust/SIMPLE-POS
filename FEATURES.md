# Simple POS - Feature Documentation

## 🏗️ System Architecture

A multi-tenant Point of Sale system with role-based access control (RBAC) featuring:

- **Platform Level**: Super Admin (global access across all tenants)
- **Tenant Level**: Admin, Manager, Cashier (tenant-specific access)
- **Public Level**: Customer browsing and ordering

## 🎯 Dashboard Features

### 1. Super Admin Dashboard (`/sadmin/dashboard`)

**Access Level**: Platform Super Admin Only

#### 🔧 Tenant Management
- **View All Tenants**: Grid, List, and Table views
- **Create New Tenants**: Add new tenant with custom settings
- **Edit Existing Tenants**: Modify tenant configuration
- **Delete Tenants**: Remove tenants from system
- **Tenant Status Management**: Activate/deactivate tenants

#### 👥 Admin User Management
- **View Tenant Admins**: See all admin users per tenant
- **Add Admin Users**: Assign admin roles to users
- **Remove Admin Users**: Revoke admin access
- **Role Assignment**: Set admin, manager, or cashier roles

#### 🔍 Tenant Information Display
- **Tenant Details**: Name, slug, subdomain, domain
- **Admin Email**: Primary admin contact
- **Status Indicators**: Active/inactive status
- **Quick Actions**: Direct links to tenant admin and homepage

### 2. Admin Dashboard (`/:tenantSlug/admin/dashboard`)

**Access Level**: Tenant Admin, Manager, or Platform Super Admin

#### 📋 Orders Management (`OrdersTab`)
- **View All Orders**: Complete order history
- **Order Status Tracking**: Pending, Processing, Completed, Cancelled
- **Order Details**: Customer info, items, totals, timestamps
- **Order Actions**: Update status, view details, print receipts
- **Order Search & Filter**: By status, date, customer
- **Real-time Updates**: Live order status changes

#### 🍽️ Menu Management (`MenuTab`)
- **Menu Categories**: Organize menu items by category
- **Menu Items CRUD**: Create, edit, delete menu items
- **Item Details**: Name, description, price, image, availability
- **Bulk Operations**: Enable/disable items, price updates
- **Image Management**: Upload and manage item photos
- **Stock Tracking**: Inventory management (if applicable)

#### 📂 Categories Management (`CategoriesTab`)
- **Category CRUD**: Create, edit, delete categories
- **Category Hierarchy**: Organize menu structure
- **Category Images**: Visual category representation
- **Sorting & Display**: Custom category ordering

#### 💳 Payment Management (`PaymentTab`)
- **Payment Methods**: Configure accepted payment types
- **Payment Settings**: Integration with payment gateways
- **Transaction History**: View all payment transactions
- **Payment Reports**: Revenue and transaction analytics
- **Refund Management**: Process refunds and cancellations

#### ⚙️ Settings Management (`SettingsTab`)
- **Store Configuration**: Store name, logo, contact info
- **Business Hours**: Operating hours configuration
- **Tax Settings**: Tax rates and calculations
- **Notification Settings**: Email, SMS, push notifications
- **Integration Settings**: Third-party service connections

#### 📊 Google Sheets Integration (`GoogleSheetsTab`)
- **Data Export**: Export orders, sales data to Google Sheets
- **Automated Sync**: Real-time data synchronization
- **Custom Reports**: Generate business reports
- **Data Backup**: Automatic data backup to cloud

### 3. User Homepage (`/` or `/:tenantSlug`)

**Access Level**: Public (No Authentication Required)

#### 🛒 Menu Browsing
- **Visual Menu Display**: Attractive menu item cards
- **Category Navigation**: Browse by food categories
- **Search Functionality**: Find specific menu items
- **Item Details Modal**: Detailed item information, images, descriptions
- **Dietary Information**: Allergen info, dietary restrictions

#### 🛒 Shopping Cart (`CartBar`)
- **Add to Cart**: One-click item addition
- **Cart Management**: View, edit, remove items
- **Quantity Controls**: Increase/decrease item quantities
- **Cart Persistence**: Cart saved across sessions
- **Special Instructions**: Add notes for customizations

#### 💰 Checkout Process (`CheckoutPage`)
- **Customer Information**: Name, contact, delivery details
- **Order Summary**: Items, quantities, prices, totals
- **Payment Options**: Multiple payment methods
- **Promo Codes**: Discount code application
- **Tax Calculation**: Automatic tax computation
- **Order Confirmation**: Final review before submission

#### 📋 Order History (`OrderHistoryPage`)
- **Order Tracking**: View past orders
- **Order Status**: Current order status updates
- **Reorder Functionality**: Quick reorder from history
- **Receipt Access**: Download/view order receipts

#### 🧾 Invoice & Receipts (`InvoicePage`)
- **Detailed Invoices**: Complete order breakdowns
- **Payment Information**: Payment method and status
- **Download Options**: PDF, print-friendly formats
- **Tax Breakdown**: Detailed tax information

#### ✅ Order Success (`OrderSuccessPage`)
- **Confirmation Display**: Order confirmation details
- **Order Code**: Unique order identifier
- **Next Steps**: What happens next
- **Quick Actions**: View invoice, return to menu

## 🔐 Authentication & Authorization

### Authentication Methods
- **Email/Password**: Traditional login system
- **Google OAuth**: Social login integration
- **Session Management**: Secure session handling

### Authorization Levels
- **Platform Super Admin**: Full system access
- **Tenant Admin**: Full tenant management
- **Tenant Manager**: Operational management
- **Tenant Cashier**: Order processing only
- **Public User**: Menu browsing and ordering

## 🛠️ Technical Features

### Performance Optimizations
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images
- **Caching Strategy**: Efficient data caching
- **Database Optimization**: Query optimization and indexing

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Input Validation**: Client and server-side validation
- **CSRF Protection**: Cross-site request forgery prevention
- **Secure Headers**: Security headers implementation

### User Experience
- **Responsive Design**: Mobile-first approach
- **Touch Optimization**: Touch-friendly interface
- **Keyboard Navigation**: Full keyboard accessibility
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback for all operations

## 🚀 Getting Started

1. **Super Admin Access**: Navigate to `/sadmin/login`
2. **Tenant Admin Access**: Navigate to `/{tenantSlug}/admin/login`
3. **User Access**: Navigate to `/` or `/{tenantSlug}`

## 📞 Support

For technical support or feature requests, please contact the development team.

---

*This documentation covers the core features of the Simple POS system. Features may vary based on user permissions and system configuration.*
