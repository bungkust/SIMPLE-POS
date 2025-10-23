# API Documentation

This document provides comprehensive documentation for all public APIs, functions, and components in the Kopi Pendekar application.

## Table of Contents

1. [React Contexts](#react-contexts)
2. [Custom Hooks](#custom-hooks)
3. [Utility Functions](#utility-functions)
4. [Form Components](#form-components)
5. [Database Types](#database-types)
6. [Form Schemas](#form-schemas)
7. [Configuration](#configuration)

---

## React Contexts

### AuthContext

Manages user authentication state and tenant information.

#### Interface

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  tenantLoading: boolean;
  currentTenant: Tenant | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  checkPermission: (permission: 'super_admin' | 'tenant_admin' | 'tenant_access') => Promise<boolean>;
  validateAuth: () => Promise<boolean>;
}
```

#### Usage

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signOut, isAuthenticated } = useAuth();
  
  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={handleLogin}>Sign In</button>
      )}
    </div>
  );
}
```

#### Methods

- **`signIn(email, password)`**: Authenticate user with email and password
- **`signInWithGoogle()`**: Authenticate user with Google OAuth
- **`signOut()`**: Sign out current user
- **`checkPermission(permission)`**: Check if user has specific permission
- **`validateAuth()`**: Validate current authentication state

---

### CartContext

Manages shopping cart state and operations.

#### Interface

```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
  totalItems: number;
  totalAmount: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  photo_url?: string | null;
  menu_id?: string;
}
```

#### Usage

```tsx
import { useCart } from '@/contexts/CartContext';

function MenuItem({ item }) {
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  
  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      menu_id: item.id
    });
  };
  
  const quantity = getItemQuantity(item.id);
  
  return (
    <div>
      <h3>{item.name}</h3>
      <p>${item.price}</p>
      {quantity > 0 ? (
        <div>
          <button onClick={() => updateQuantity(item.id, quantity - 1)}>-</button>
          <span>{quantity}</span>
          <button onClick={() => updateQuantity(item.id, quantity + 1)}>+</button>
        </div>
      ) : (
        <button onClick={handleAddToCart}>Add to Cart</button>
      )}
    </div>
  );
}
```

---

### ConfigContext

Manages application configuration and tenant settings.

#### Interface

```typescript
interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  loading: boolean;
}

interface AppConfig {
  storeName: string;
  storeIcon: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeIconType: 'predefined' | 'uploaded';
  storeDescription?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeHours?: string;
  autoAcceptOrders?: boolean;
  requirePhoneVerification?: boolean;
  allowGuestCheckout?: boolean;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  telegramBotToken?: string;
  telegramNotifyCheckout?: boolean;
  telegramNotifyCashier?: boolean;
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
  headerDisplaySettings?: {
    showDescription?: boolean;
    showOperatingHours?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showSocialMedia?: boolean;
  };
}
```

#### Usage

```tsx
import { useConfig } from '@/contexts/ConfigContext';

function StoreHeader() {
  const { config, updateConfig } = useConfig();
  
  const handleUpdateStoreName = (newName: string) => {
    updateConfig({ storeName: newName });
  };
  
  return (
    <header>
      <h1>{config.storeName}</h1>
      <p>{config.storeDescription}</p>
      {config.storeAddress && <p>{config.storeAddress}</p>}
    </header>
  );
}
```

---

## Custom Hooks

### useMediaQuery

Detects screen size breakpoints and media queries.

#### Usage

```tsx
import { useMediaQuery, useIsMobile, useIsDesktop } from '@/hooks/use-media-query';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const isSmallScreen = useMediaQuery('(max-width: 639px)');
  
  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
}
```

#### Available Hooks

- **`useMediaQuery(query)`**: Custom media query detection
- **`useIsMobile()`**: Detects mobile devices (width < 1024px or touch device < 1200px)
- **`useIsTablet()`**: Detects tablets (768px - 1023px)
- **`useIsDesktop()`**: Detects desktop (width >= 1024px)
- **`useIsSmallScreen()`**: Detects small screens (width <= 639px)
- **`useIsLargeScreen()`**: Detects large screens (width >= 1280px)

---

### useNetworkQuality

Monitors network connection quality and provides adaptive loading strategies.

#### Usage

```tsx
import { useNetworkQuality, useAdaptiveImageQuality } from '@/hooks/use-network-quality';

function ImageComponent({ src }) {
  const { quality, isOnline } = useNetworkQuality();
  const { getImageQuality, getMaxImageSize } = useAdaptiveImageQuality();
  
  const imageQuality = getImageQuality(80);
  const maxSize = getMaxImageSize(800);
  
  return (
    <img 
      src={src} 
      style={{ 
        maxWidth: maxSize,
        quality: imageQuality 
      }}
    />
  );
}
```

#### Network Quality Types

- **`'fast'`**: Fast connection (4G+)
- **`'slow'`**: Slow connection (2G, 3G, or data saver mode)
- **`'offline'`**: No internet connection

---

### useSwipeGesture

Handles touch swipe gestures for mobile interactions.

#### Usage

```tsx
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';

function SwipeableCard() {
  const { handlers, swipeState } = useSwipeGesture({
    threshold: 50,
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onSwipeUp: () => console.log('Swiped up'),
    onSwipeDown: () => console.log('Swiped down'),
  });
  
  return (
    <div 
      {...handlers}
      className="swipeable-card"
    >
      <p>Swipe me!</p>
      {swipeState.isSwiping && (
        <p>Swiping {swipeState.direction} ({swipeState.distance}px)</p>
      )}
    </div>
  );
}
```

---

### useToast

Manages toast notifications throughout the application.

#### Usage

```tsx
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();
  
  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your action was completed successfully.",
    });
  };
  
  const handleError = () => {
    toast({
      title: "Error",
      description: "Something went wrong.",
      variant: "destructive",
    });
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

---

## Utility Functions

### General Utilities (`/lib/utils.ts`)

#### `cn(...inputs)`
Combines class names using clsx and tailwind-merge.

```tsx
import { cn } from '@/lib/utils';

<div className={cn('base-class', condition && 'conditional-class', className)} />
```

#### `formatRupiah(amount)`
Formats numbers as Indonesian Rupiah currency.

```tsx
import { formatRupiah } from '@/lib/utils';

const price = formatRupiah(50000); // "Rp 50.000"
```

#### `normalizePhone(phone)`
Normalizes phone numbers to Indonesian format.

```tsx
import { normalizePhone } from '@/lib/utils';

const phone = normalizePhone('081234567890'); // "+6281234567890"
```

#### `formatDate(date)` / `formatDateTime(date)`
Formats dates for display.

```tsx
import { formatDate, formatDateTime } from '@/lib/utils';

const date = formatDate('2024-01-15'); // "15:01:24"
const dateTime = formatDateTime('2024-01-15T10:30:00Z'); // "15:01:24"
```

---

### Form Utilities (`/lib/form-utils.ts`)

#### `getFieldError(errors, fieldName)`
Extracts field-specific error messages from form errors.

```tsx
import { getFieldError } from '@/lib/form-utils';

const error = getFieldError(formErrors, 'email');
```

#### `normalizePhone(phone)` / `formatPhone(phone)`
Phone number utilities with validation.

```tsx
import { normalizePhone, formatPhone } from '@/lib/form-utils';

const normalized = normalizePhone('081234567890'); // "+6281234567890"
const formatted = formatPhone('+6281234567890'); // "+62 812-3456-7890"
```

#### `formatCurrency(amount)`
Formats currency for display.

```tsx
import { formatCurrency } from '@/lib/form-utils';

const price = formatCurrency(50000); // "Rp 50.000"
```

#### `generateOrderCode()`
Generates unique order codes.

```tsx
import { generateOrderCode } from '@/lib/form-utils';

const orderCode = generateOrderCode(); // "ORD240115103045"
```

#### `generateSlug(text)`
Creates URL-friendly slugs.

```tsx
import { generateSlug } from '@/lib/form-utils';

const slug = generateSlug('My Awesome Product'); // "my-awesome-product"
```

#### `debounce(func, wait)`
Creates debounced functions for search and input handling.

```tsx
import { debounce } from '@/lib/form-utils';

const debouncedSearch = debounce((query: string) => {
  // Perform search
}, 300);
```

---

### Order Utilities (`/lib/order-utils.ts`)

#### `calculateOrderTotals(subtotal, config)`
Calculates order totals including delivery fees.

```tsx
import { calculateOrderTotals } from '@/lib/order-utils';

const calculation = calculateOrderTotals(50000, config);
// Returns: {
//   subtotal: 50000,
//   deliveryFee: 5000,
//   freeDeliveryThreshold: 100000,
//   isFreeDelivery: false,
//   total: 55000,
//   minimumOrderMet: true,
//   minimumOrderAmount: 25000
// }
```

#### `validateOrderRequirements(subtotal, config)`
Validates if order meets minimum requirements.

```tsx
import { validateOrderRequirements } from '@/lib/order-utils';

const validation = validateOrderRequirements(50000, config);
if (!validation.isValid) {
  console.error(validation.errorMessage);
}
```

#### `getDeliveryFeeText(subtotal, config)`
Gets display text for delivery fee.

```tsx
import { getDeliveryFeeText } from '@/lib/order-utils';

const feeText = getDeliveryFeeText(50000, config); // "Ongkir: Rp 5.000"
```

---

### Tenant Helpers (`/lib/tenant-helpers.ts`)

#### `getTenantWithInfo(tenantId)`
Fetches tenant with related tenant_info data.

```tsx
import { getTenantWithInfo } from '@/lib/tenant-helpers';

const { data: tenant, error } = await getTenantWithInfo('tenant-id');
```

#### `getTenantWithInfoBySlug(tenantSlug)`
Fetches tenant by slug for public pages.

```tsx
import { getTenantWithInfoBySlug } from '@/lib/tenant-helpers';

const { data: tenant, error } = await getTenantWithInfoBySlug('my-store');
```

#### `createTenantInfo(tenantId, data)`
Creates tenant_info record with default values.

```tsx
import { createTenantInfo } from '@/lib/tenant-helpers';

const { data, error } = await createTenantInfo('tenant-id', {
  description: 'My awesome store',
  address: '123 Main St'
});
```

#### `updateTenantInfo(tenantId, data)`
Updates tenant_info using UPSERT.

```tsx
import { updateTenantInfo } from '@/lib/tenant-helpers';

const { data, error } = await updateTenantInfo('tenant-id', {
  description: 'Updated description'
});
```

---

### Telegram Utilities (`/lib/telegram-utils.ts`)

#### `sendTelegramMessage(botToken, chatId, message, parseMode)`
Sends message to Telegram using Bot API.

```tsx
import { sendTelegramMessage } from '@/lib/telegram-utils';

const result = await sendTelegramMessage(
  'bot-token',
  'chat-id',
  'Hello from the app!',
  'HTML'
);
```

#### `sendOrderNotification(config, order, tenant, source)`
Sends order notification to all registered chat IDs.

```tsx
import { sendOrderNotification } from '@/lib/telegram-utils';

await sendOrderNotification(
  { botToken: 'token', chatIds: ['chat1', 'chat2'] },
  orderData,
  tenantData,
  'checkout'
);
```

#### `formatOrderMessage(order, tenant, source)`
Formats order data into Telegram message.

```tsx
import { formatOrderMessage } from '@/lib/telegram-utils';

const message = formatOrderMessage(order, tenant, 'checkout');
```

---

## Form Components

### FormInput

Styled input component with label, error handling, and validation.

#### Props

```typescript
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}
```

#### Usage

```tsx
import { FormInput } from '@/components/forms/FormInput';

<FormInput
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
  error={errors.email?.message}
  helperText="We'll never share your email"
/>
```

---

### FormSelect

Styled select component with label and error handling.

#### Props

```typescript
interface FormSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  id?: string;
}
```

#### Usage

```tsx
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';

<FormSelect
  label="Payment Method"
  placeholder="Select payment method"
  value={paymentMethod}
  onValueChange={setPaymentMethod}
  error={errors.paymentMethod?.message}
>
  <SelectItem value="transfer">Bank Transfer</SelectItem>
  <SelectItem value="qris">QRIS</SelectItem>
  <SelectItem value="cod">Cash on Delivery</SelectItem>
</FormSelect>
```

---

### FormTextarea

Styled textarea component with label and error handling.

#### Props

```typescript
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}
```

#### Usage

```tsx
import { FormTextarea } from '@/components/forms/FormTextarea';

<FormTextarea
  label="Order Notes"
  placeholder="Any special instructions?"
  rows={4}
  error={errors.notes?.message}
  helperText="Optional special instructions"
/>
```

---

### FormCheckbox

Styled checkbox component with label and error handling.

#### Props

```typescript
interface FormCheckboxProps {
  label?: string;
  error?: string;
  helperText?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}
```

#### Usage

```tsx
import { FormCheckbox } from '@/components/forms/FormCheckbox';

<FormCheckbox
  label="I agree to the terms and conditions"
  checked={agreed}
  onCheckedChange={setAgreed}
  error={errors.agreed?.message}
/>
```

---

### FormRadioGroup

Styled radio group component with label and error handling.

#### Props

```typescript
interface FormRadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
}
```

#### Usage

```tsx
import { FormRadioGroup } from '@/components/forms/FormRadioGroup';

<FormRadioGroup
  label="Order Type"
  value={orderType}
  onValueChange={setOrderType}
  options={[
    { value: 'pickup', label: 'Pickup' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'dine-in', label: 'Dine In' }
  ]}
  error={errors.orderType?.message}
/>
```

---

## Database Types

The application uses TypeScript types generated from the Supabase database schema.

### Key Types

```typescript
// User roles
type UserRole = 'super_admin' | 'tenant';

// Menu items
interface MenuItem {
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
}

// Orders
interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  payment_method: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  pickup_date: string | null;
}

// Tenants
interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settings: any; // JSON object
}
```

---

## Form Schemas

The application uses Zod for form validation with comprehensive schemas.

### Key Schemas

#### `tenantFormSchema`
Validates tenant creation/update forms.

```tsx
import { tenantFormSchema } from '@/lib/form-schemas';

const formData = {
  name: 'My Store',
  slug: 'my-store',
  owner_email: 'owner@example.com',
  is_active: true
};

const result = tenantFormSchema.parse(formData);
```

#### `menuFormSchema`
Validates menu item forms.

```tsx
import { menuFormSchema } from '@/lib/form-schemas';

const menuData = {
  name: 'Cappuccino',
  description: 'Rich and creamy coffee',
  price: 25000,
  category_id: 'cat-123',
  is_available: true,
  image_url: 'https://example.com/image.jpg'
};

const result = menuFormSchema.parse(menuData);
```

#### `checkoutFormSchema`
Validates checkout forms.

```tsx
import { checkoutFormSchema } from '@/lib/form-schemas';

const checkoutData = {
  customerName: 'John Doe',
  phone: '081234567890',
  pickupDate: '2024-01-15',
  notes: 'Extra hot please',
  paymentMethod: 'TRANSFER'
};

const result = checkoutFormSchema.parse(checkoutData);
```

---

## Configuration

### Environment Variables

The application requires the following environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=your_site_url
```

### Supabase Configuration

The Supabase client is configured with:

- **PKCE Flow**: Enhanced security for OAuth
- **Auto Refresh**: Automatic token refresh
- **Session Persistence**: Stored in localStorage
- **Auth State Detection**: Automatic session detection from URL

### Default Tenant Configurations

The application includes default configurations for different tenants:

- **kopipendekar**: Coffee shop configuration
- **matchae**: Matcha-focused store
- **testcafe**: Testing environment
- **demostore**: Demo store configuration

---

## Error Handling

### Auth Errors

```tsx
import { clearAuthState, handleOAuthError } from '@/lib/auth-utils';

// Clear corrupted auth state
clearAuthState();

// Handle OAuth errors
const hasError = handleOAuthError();
if (hasError) {
  // Error was handled, redirect user
}
```

### Form Validation

All forms use Zod schemas for validation with detailed error messages in Indonesian.

### Network Quality Adaptation

The application automatically adapts to network conditions:

- **Fast Connection**: Full quality images and features
- **Slow Connection**: Reduced image quality and optimized loading
- **Offline**: Cached data and minimal functionality

---

## Best Practices

### Context Usage

1. Always wrap components with the appropriate context providers
2. Use the provided hooks to access context values
3. Handle loading states appropriately

### Form Handling

1. Use the provided form components for consistency
2. Implement proper error handling and validation
3. Use Zod schemas for type-safe validation

### Performance

1. Use the network quality hooks for adaptive loading
2. Implement proper debouncing for search inputs
3. Use React.memo for expensive components

### Security

1. Always validate user permissions before sensitive operations
2. Use the provided auth utilities for secure authentication
3. Sanitize user inputs before database operations

---

This documentation covers all public APIs, functions, and components in the Kopi Pendekar application. For more specific implementation details, refer to the source code and inline comments.