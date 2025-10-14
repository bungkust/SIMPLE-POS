# UI Components Documentation

## Overview

This document provides comprehensive documentation for the Shadcn/ui-based component system implemented in the SIMPLE-POS application. The application has been completely modernized with enterprise-grade UI/UX components.

## 🎨 Design System

### Theme Colors

```css
/* Primary Colors */
--primary: 222.2 84% 4.9%;           /* Dark slate for text */
--primary-foreground: 210 40% 98%;   /* Light text on dark */

/* Secondary Colors */
--secondary: 210 40% 96%;            /* Light gray backgrounds */
--secondary-foreground: 222.2 84% 4.9%;

/* Accent Colors */
--accent: 210 40% 96%;               /* Subtle accent */
--accent-foreground: 222.2 84% 4.9%;

/* Status Colors */
--destructive: 0 84.2% 60.2%;        /* Red for errors */
--destructive-foreground: 210 40% 98%;
--success: 142.1 76.2% 36.3%;        /* Green for success */
--warning: 38 92% 50%;               /* Amber for warnings */
```

### Typography

- **Font Family**: Inter (clean, modern sans-serif)
- **Font Sizes**: Responsive scale from 12px to 48px
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Line Heights**: Optimized for readability

### Spacing

- **Base Unit**: 4px
- **Scale**: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- **Container Max Width**: 1200px
- **Grid Gaps**: 16px, 24px, 32px

## 🧩 Core Components

### 1. Layout Components

#### Card
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

#### Sheet (Slide-over)
```tsx
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
      <SheetDescription>Description</SheetDescription>
    </SheetHeader>
    Content
  </SheetContent>
</Sheet>
```

#### Dialog (Modal)
```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

### 2. Form Components

#### FormInput
```tsx
import { FormInput } from '@/components/forms/FormInput';

<FormInput
  control={control}
  name="email"
  label="Email"
  placeholder="Enter your email"
  type="email"
/>
```

#### FormSelect
```tsx
import { FormSelect } from '@/components/forms/FormSelect';

<FormSelect
  control={control}
  name="category"
  label="Category"
  options={[
    { value: 'food', label: 'Food' },
    { value: 'drink', label: 'Drink' }
  ]}
/>
```

#### FormCheckbox
```tsx
import { FormCheckbox } from '@/components/forms/FormCheckbox';

<FormCheckbox
  control={control}
  name="isActive"
  label="Active"
/>
```

### 3. Data Display

#### AdvancedTable (TanStack Table)
```tsx
import { AdvancedTable } from '@/components/ui/advanced-table';

<AdvancedTable
  data={data}
  columns={columns}
  searchable
  sortable
  pagination
  onRowClick={handleRowClick}
/>
```

#### Badge
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Active</Badge>
<Badge variant="secondary">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Pending</Badge>
```

#### StatusBadge
```tsx
import { StatusBadge } from '@/components/ui/status-badge';

<StatusBadge status="active" />
<StatusBadge status="inactive" />
<StatusBadge status="pending" />
```

### 4. Navigation

#### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

#### DropdownMenu
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 5. Feedback

#### Toast
```tsx
import { useAppToast } from '@/lib/form-utils';

const { toast } = useAppToast();

toast({
  title: "Success",
  description: "Operation completed successfully",
  variant: "default"
});
```

#### Alert
```tsx
import { Alert, AlertDescription } from '@/components/ui/alert';

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    This is an alert message
  </AlertDescription>
</Alert>
```

#### LoadingSkeleton
```tsx
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

<LoadingSkeleton className="h-4 w-full" />
<LoadingSkeleton className="h-8 w-8 rounded-full" />
```

## 📱 Page Components

### 1. Admin Dashboard

#### SuperAdminDashboard
- **Location**: `src/pages/SuperAdminDashboardNew.tsx`
- **Features**: 
  - Advanced tenant table with search/filter
  - Statistics cards
  - Modern tenant creation form
  - Toast notifications

#### AdminDashboard
- **Location**: `src/pages/AdminDashboard.tsx`
- **Features**:
  - Tabbed interface for different admin functions
  - Modern forms with validation
  - Real-time data updates

### 2. Authentication Pages

#### AdminLoginPage
- **Location**: `src/pages/AdminLoginPageNew.tsx`
- **Features**:
  - Modern login form with validation
  - Password visibility toggle
  - Error handling with toast

#### TenantSetupPage
- **Location**: `src/pages/TenantSetupPageNew.tsx`
- **Features**:
  - Secure password setup
  - Form validation
  - Success feedback

### 3. Customer Pages

#### MenuBrowser
- **Location**: `src/components/MenuBrowserNew.tsx`
- **Features**:
  - Grid/List view toggle
  - Search and category filtering
  - Sheet-based item details
  - Responsive design

#### CartBar
- **Location**: `src/components/CartBarNew.tsx`
- **Features**:
  - Floating cart button
  - Sheet-based cart management
  - Item quantity controls
  - Checkout integration

#### CheckoutPage
- **Location**: `src/pages/CheckoutPageNew.tsx`
- **Features**:
  - Modern checkout form
  - Order summary
  - Payment method selection
  - Form validation

## 🔧 Form Management

### React Hook Form + Zod Integration

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    name: "",
    email: "",
  }
});
```

### Form Schemas

All form schemas are defined in `src/lib/form-schemas.ts`:

- `tenantFormSchema` - Tenant creation/editing
- `loginSchema` - User authentication
- `menuFormSchema` - Menu item management
- `checkoutFormSchema` - Order checkout
- `settingsFormSchema` - Application settings

## 📊 Data Tables

### TanStack Table Integration

```tsx
import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper<DataType>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
];
```

### Table Features

- **Sorting**: Click column headers
- **Filtering**: Built-in search functionality
- **Pagination**: Configurable page sizes
- **Row Selection**: Checkbox selection
- **Responsive**: Mobile-friendly design

## 🎯 Best Practices

### 1. Component Structure

```tsx
// ✅ Good: Proper component structure
export function MyComponent() {
  const [state, setState] = useState();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        Content
      </CardContent>
    </Card>
  );
}
```

### 2. Form Handling

```tsx
// ✅ Good: Proper form setup
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: getDefaultValues(),
});

const onSubmit = async (data: FormData) => {
  try {
    await submitData(data);
    toast({ title: "Success", description: "Data saved" });
  } catch (error) {
    toast({ title: "Error", description: "Failed to save" });
  }
};
```

### 3. Error Handling

```tsx
// ✅ Good: Proper error handling
const { toast } = useAppToast();

try {
  await riskyOperation();
  toast({ title: "Success", description: "Operation completed" });
} catch (error) {
  toast({ 
    title: "Error", 
    description: error.message || "Something went wrong",
    variant: "destructive"
  });
}
```

### 4. Loading States

```tsx
// ✅ Good: Loading states
if (loading) {
  return <LoadingSkeleton className="h-32 w-full" />;
}

return (
  <div>
    {data.map(item => (
      <Card key={item.id}>{item.name}</Card>
    ))}
  </div>
);
```

## 🚀 Performance Tips

1. **Lazy Loading**: Use React.lazy() for large components
2. **Memoization**: Use React.memo() for expensive components
3. **Virtual Scrolling**: For large data sets
4. **Image Optimization**: Use proper image formats and sizes
5. **Bundle Splitting**: Separate admin and customer code

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach

```tsx
// ✅ Good: Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>
```

## 🔍 Accessibility

### ARIA Labels

```tsx
// ✅ Good: Proper ARIA labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

### Keyboard Navigation

- **Tab Order**: Logical tab sequence
- **Focus Management**: Proper focus handling in modals
- **Keyboard Shortcuts**: Common shortcuts (Enter, Escape)

### Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy
- **Alt Text**: Descriptive image alt text
- **Live Regions**: For dynamic content updates

## 🧪 Testing

### Component Testing

```tsx
// Example test structure
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Form Testing

```tsx
// Example form test
test('validates form correctly', async () => {
  render(<MyForm />);
  
  const submitButton = screen.getByRole('button', { name: /submit/i });
  fireEvent.click(submitButton);
  
  expect(await screen.findByText('Name is required')).toBeInTheDocument();
});
```

## 📚 Resources

- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Table](https://tanstack.com/table)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🔄 Migration Status

### ✅ Completed
- [x] Foundation setup (theme, dependencies)
- [x] Core UI components
- [x] Form infrastructure
- [x] Admin dashboard components
- [x] Authentication pages
- [x] Customer-facing components
- [x] Data tables and advanced features
- [x] Toast notification system
- [x] Responsive design
- [x] Accessibility improvements

### 🚀 Ready for Production
The application is now fully modernized with enterprise-grade UI/UX components and is ready for production deployment.

---

*Last updated: December 2024*
