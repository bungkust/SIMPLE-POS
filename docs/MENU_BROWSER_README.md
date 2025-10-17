# Menu Browser Component

## Product Requirements Document (PRD)

### Overview
The Menu Browser is the public-facing component that displays the restaurant's menu to customers. It serves as the main interface for browsing menu items, viewing restaurant information, and initiating orders.

### Target Users
- **Primary**: Restaurant customers browsing the menu
- **Secondary**: Restaurant staff showing menu to customers
- **Tertiary**: Restaurant owners reviewing their public menu

### Core Features

#### 1. Restaurant Information Display
- **Store Name & Logo**: Prominently displayed at the top
- **Operating Hours**: Shows current status (Open/Closed) with hours
- **Contact Information**: Phone number, address, email
- **Social Media Links**: Instagram, TikTok, Twitter, Facebook
- **Store Description**: Brief description of the restaurant
- **Category**: Restaurant type (Cafe, Restaurant, etc.)

#### 2. Menu Browsing
- **Category Filtering**: Filter menu items by category
- **Search Functionality**: Search menu items by name or description
- **Menu Item Cards**: Display with image, name, price, description
- **Availability Status**: Show if item is available or out of stock
- **Price Display**: Clear pricing with currency formatting

#### 3. Order Management
- **Add to Cart**: Add items to shopping cart
- **Cart Summary**: Show cart contents and total
- **Quantity Controls**: Increase/decrease item quantities
- **Remove Items**: Remove items from cart

#### 4. Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive layout for tablets
- **Desktop Support**: Full desktop experience

### User Stories

#### As a Customer:
1. I want to see the restaurant's information so I can understand what they offer
2. I want to browse menu items by category so I can find what I'm looking for
3. I want to search for specific items so I can quickly find what I want
4. I want to see item details (price, description, image) so I can make informed decisions
5. I want to add items to my cart so I can place an order
6. I want to see my cart total so I know how much I'll spend

#### As a Restaurant Owner:
1. I want customers to see my restaurant's branding and information
2. I want my menu to be easy to navigate and search
3. I want customers to see item availability status
4. I want the interface to work well on all devices

### Success Metrics
- **User Engagement**: Time spent browsing menu
- **Conversion Rate**: Percentage of visitors who add items to cart
- **Mobile Usage**: Percentage of mobile vs desktop users
- **Search Usage**: Frequency of search functionality usage
- **Category Navigation**: Most popular categories

---

## Technical Documentation

### Architecture

#### Component Structure
```
MenuBrowserNew.tsx
├── HeaderNew.tsx (Restaurant info display)
├── MenuItemCard.tsx (Individual menu item)
├── CartBarNew.tsx (Shopping cart)
└── MenuDetailModal.tsx (Item details)
```

#### Data Flow
```
ConfigContext → MenuBrowserNew → MenuItemCard
     ↓              ↓              ↓
Restaurant Info → Menu Items → Cart Context
```

### Key Components

#### 1. MenuBrowserNew.tsx
**Purpose**: Main container component for the menu browser
**Props**: None (uses context for data)
**State Management**: 
- `searchQuery`: Current search term
- `selectedCategory`: Currently selected category filter
- `menuItems`: List of menu items from database
- `categories`: List of categories from database

**Key Functions**:
```typescript
// Load menu data
const loadMenuData = async () => {
  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', currentTenant.id)
    .eq('is_active', true);
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', currentTenant.id);
};

// Filter menu items
const filteredItems = useMemo(() => {
  return menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });
}, [menuItems, searchQuery, selectedCategory]);
```

#### 2. HeaderNew.tsx
**Purpose**: Displays restaurant information and branding
**Data Source**: ConfigContext (restaurant settings)
**Features**:
- Restaurant logo and name
- Operating hours with status indicator
- Contact information (phone, address)
- Social media links
- Configurable display settings

**Display Logic**:
```typescript
// Conditional rendering based on settings
{config.headerDisplaySettings?.showOperatingHours && (
  <div className="operating-hours">
    <Clock className="w-4 h-4" />
    <span>{config.storeHours}</span>
    <StatusBadge status={isOpen ? 'active' : 'inactive'}>
      {isOpen ? 'Buka' : 'Tutup'}
    </StatusBadge>
  </div>
)}
```

#### 3. MenuItemCard.tsx
**Purpose**: Individual menu item display
**Props**:
- `item`: Menu item data
- `onAddToCart`: Callback for adding to cart
- `onViewDetails`: Callback for viewing details

**Features**:
- Item image with fallback
- Name, price, and description
- Availability status
- Add to cart button
- Quick view details

#### 4. CartBarNew.tsx
**Purpose**: Shopping cart management
**Context**: CartContext
**Features**:
- Cart item count
- Total price calculation
- Quick cart preview
- Proceed to checkout button

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

#### Category
```typescript
interface Category {
  id: string;
  name: string;
  sort_order: number;
  tenant_id: string;
  created_at: string;
}
```

#### Restaurant Config
```typescript
interface AppConfig {
  storeName: string;
  storeIcon: string;
  storeDescription: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeHours: string;
  socialMedia: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
  headerDisplaySettings: {
    showOperatingHours: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showSocialMedia: boolean;
  };
}
```

### API Integration

#### Supabase Queries
```typescript
// Fetch menu items
const { data: menuItems } = await supabase
  .from('menu_items')
  .select(`
    *,
    categories(name)
  `)
  .eq('tenant_id', currentTenant.id)
  .eq('is_active', true)
  .order('created_at', { ascending: false });

// Fetch categories
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .eq('tenant_id', currentTenant.id)
  .order('sort_order', { ascending: true });
```

### Styling & UI

#### Design System
- **Colors**: Primary, secondary, accent colors from Tailwind config
- **Typography**: Inter font family with consistent sizing
- **Spacing**: Consistent padding and margins
- **Components**: Reusable UI components from `@/components/ui`

#### Responsive Breakpoints
```css
/* Mobile First */
.menu-grid {
  @apply grid grid-cols-1 gap-4;
}

/* Tablet */
@media (min-width: 768px) {
  .menu-grid {
    @apply grid-cols-2;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .menu-grid {
    @apply grid-cols-3;
  }
}
```

#### Key CSS Classes
- `.menu-browser`: Main container
- `.menu-header`: Restaurant information section
- `.menu-filters`: Search and category filters
- `.menu-grid`: Menu items grid
- `.menu-item-card`: Individual menu item card
- `.cart-bar`: Shopping cart component

### Performance Optimizations

#### 1. Data Loading
- **Lazy Loading**: Load menu items on component mount
- **Caching**: Use React Query or SWR for data caching
- **Pagination**: Implement pagination for large menus

#### 2. Image Optimization
- **Lazy Loading**: Load images as they come into view
- **Fallback Images**: Default images for missing item photos
- **Image Compression**: Optimize images for web delivery

#### 3. Search Optimization
- **Debounced Search**: Prevent excessive API calls
- **Client-side Filtering**: Filter data in memory when possible
- **Indexed Search**: Use database indexes for search queries

### Error Handling

#### Error States
```typescript
// Loading state
if (loading) {
  return <LoadingSkeleton />;
}

// Error state
if (error) {
  return (
    <div className="error-state">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load menu. Please try again.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Empty state
if (menuItems.length === 0) {
  return (
    <div className="empty-state">
      <p>No menu items available.</p>
    </div>
  );
}
```

### Testing

#### Unit Tests
- Component rendering
- Data filtering logic
- Search functionality
- Cart operations

#### Integration Tests
- API data loading
- Context integration
- User interactions

#### E2E Tests
- Complete user journey
- Mobile responsiveness
- Cross-browser compatibility

### Deployment Considerations

#### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Build Optimization
- Code splitting for menu components
- Image optimization
- Bundle size monitoring

#### Monitoring
- Performance metrics
- Error tracking
- User analytics

### Future Enhancements

#### Planned Features
1. **Menu Item Favorites**: Allow users to favorite items
2. **Nutritional Information**: Display nutritional facts
3. **Allergen Warnings**: Show allergen information
4. **Menu Item Reviews**: Customer reviews and ratings
5. **Recommended Items**: AI-powered recommendations
6. **Menu Item Variants**: Size options, customizations
7. **Offline Support**: PWA capabilities
8. **Multi-language Support**: Internationalization

#### Technical Improvements
1. **Virtual Scrolling**: For large menus
2. **Image CDN**: Faster image delivery
3. **Search Analytics**: Track search patterns
4. **A/B Testing**: Test different layouts
5. **Performance Monitoring**: Real-time performance tracking
