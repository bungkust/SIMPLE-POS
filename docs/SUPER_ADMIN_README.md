# Super Admin Dashboard

## Product Requirements Document (PRD)

### Overview
The Super Admin Dashboard is the highest-level administrative interface for managing the entire multi-tenant POS system. It provides comprehensive tenant management, system monitoring, and administrative controls.

### Target Users
- **Primary**: System administrators and platform owners
- **Secondary**: Customer success managers
- **Tertiary**: Technical support staff

### Core Features

#### 1. Tenant Management
- **Create New Tenants**: Add new restaurant clients to the platform
- **Edit Tenant Information**: Update tenant details, settings, and configurations
- **Delete Tenants**: Remove tenants from the system (with data cleanup)
- **View Tenant List**: Comprehensive list with search, filtering, and pagination
- **Tenant Status Management**: Activate/deactivate tenants
- **Invitation Link Generation**: Generate setup links for new tenants

#### 2. Tenant Information Management
- **Basic Information**: Name, slug, owner email, status
- **Store Details**: Description, address, phone, email, operating hours
- **Branding**: Logo upload and management
- **Social Media**: Instagram, TikTok, Twitter, Facebook links
- **Category**: Restaurant type classification
- **Website**: External website URL

#### 3. System Monitoring
- **Tenant Statistics**: Active tenants, total tenants, system usage
- **Performance Metrics**: System health, response times
- **Error Monitoring**: System errors and alerts
- **Usage Analytics**: Platform usage patterns

#### 4. Administrative Controls
- **User Management**: Manage super admin users
- **System Settings**: Global platform configurations
- **Backup Management**: Database backups and recovery
- **Audit Logs**: System activity tracking

### User Stories

#### As a Super Admin:
1. I want to create new tenant accounts so I can onboard new restaurant clients
2. I want to edit tenant information so I can keep client data up to date
3. I want to delete inactive tenants so I can maintain a clean system
4. I want to generate invitation links so new tenants can set up their accounts
5. I want to view tenant statistics so I can monitor platform growth
6. I want to manage tenant status so I can control access to the platform

#### As a Customer Success Manager:
1. I want to view tenant details so I can provide better support
2. I want to see tenant activity so I can identify engagement issues
3. I want to update tenant information so I can keep records current

### Success Metrics
- **Tenant Onboarding**: Time to create new tenant
- **Data Accuracy**: Percentage of complete tenant profiles
- **System Uptime**: Platform availability
- **Admin Efficiency**: Time to complete administrative tasks
- **Tenant Satisfaction**: Support ticket resolution time

---

## Technical Documentation

### Architecture

#### Component Structure
```
SuperAdminDashboardNew.tsx
├── TenantsTabNew.tsx (Tenant management)
├── SettingsTabNew.tsx (System settings)
├── TenantFormModalNew.tsx (Create/Edit tenant)
└── TenantActions.tsx (Tenant operations)
```

#### Data Flow
```
SuperAdminDashboardNew → TenantsTabNew → TenantFormModalNew
         ↓                    ↓              ↓
    Tenant List → Tenant CRUD → Database Operations
```

### Key Components

#### 1. SuperAdminDashboardNew.tsx
**Purpose**: Main dashboard container
**Features**:
- Navigation between tabs
- User authentication check
- Role-based access control
- Dashboard statistics

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState('tenants');
const [tenants, setTenants] = useState<Tenant[]>([]);
const [loading, setLoading] = useState(true);
const [stats, setStats] = useState({
  totalTenants: 0,
  activeTenants: 0,
  inactiveTenants: 0
});
```

#### 2. TenantsTabNew.tsx
**Purpose**: Tenant list and management interface
**Features**:
- Tenant data table with sorting and filtering
- Search functionality
- Bulk operations
- Status management
- Action buttons (Edit, Delete, View Invitation)

**Data Table Configuration**:
```typescript
const columns: ColumnDef<Tenant>[] = [
  {
    accessorKey: 'name',
    header: 'Tenant Name',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <img 
          src={row.original.logo_url || '/default-logo.png'} 
          alt={row.original.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="font-medium">{row.original.name}</span>
      </div>
    )
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
        {row.original.slug}
      </code>
    )
  },
  {
    accessorKey: 'owner_email',
    header: 'Owner Email'
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={row.original.is_active ? 'active' : 'inactive'}>
        {row.original.is_active ? 'Active' : 'Inactive'}
      </StatusBadge>
    )
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => formatDate(row.original.created_at)
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <TenantActions 
        tenant={row.original} 
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewInvitation={handleViewInvitation}
      />
    )
  }
];
```

#### 3. TenantFormModalNew.tsx
**Purpose**: Create and edit tenant form
**Features**:
- Form validation with Zod schema
- File upload for tenant logo
- Social media link validation
- Real-time form validation
- Success/error handling

**Form Schema**:
```typescript
const superAdminTenantFormSchema = z.object({
  name: z.string().min(1, "Tenant name is required").max(100),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  owner_email: z.string().email("Valid email is required"),
  status: z.enum(['active', 'inactive']).default('active'),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  operating_hours: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  logo_url: z.string().optional(),
  social_media: z.object({
    instagram: z.string().url().optional().or(z.literal("")),
    tiktok: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
    facebook: z.string().url().optional().or(z.literal(""))
  }).optional()
});
```

#### 4. TenantActions.tsx
**Purpose**: Tenant action buttons and operations
**Features**:
- Edit tenant button
- Delete tenant with confirmation
- View invitation link
- Copy invitation link to clipboard
- Status toggle

**Action Handlers**:
```typescript
const handleDelete = async (tenant: Tenant) => {
  if (!confirm(`Are you sure you want to delete ${tenant.name}? This action cannot be undone.`)) {
    return;
  }

  try {
    setDeleting(true);
    
    // Delete tenant and associated data
    const { error } = await deleteTenantAndInfo(tenant.id);
    
    if (error) {
      throw error;
    }
    
    // Delete storage structure
    await deleteTenantStorageStructure(tenant.slug);
    
    showSuccess('Success', 'Tenant deleted successfully');
    onTenantDeleted(tenant.id);
  } catch (error) {
    showError('Error', `Failed to delete tenant: ${error.message}`);
  } finally {
    setDeleting(false);
  }
};

const handleViewInvitation = (tenant: Tenant) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const invitationLink = `${baseUrl}/auth/setup-tenant?token=${tenant.id}`;
  
  setInvitationLink(invitationLink);
  setShowInvitationDialog(true);
};
```

### Data Models

#### Tenant
```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  is_active: boolean;
  settings: {
    auto_accept_orders: boolean;
    require_phone_verification: boolean;
    allow_guest_checkout: boolean;
    minimum_order_amount: number;
    delivery_fee: number;
    free_delivery_threshold: number;
  };
  created_by: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
}
```

#### TenantInfo
```typescript
interface TenantInfo {
  tenant_id: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  operating_hours: string | null;
  logo_url: string | null;
  website: string | null;
  category: string | null;
  currency: string | null;
  language: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  show_operating_hours: boolean | null;
  show_address: boolean | null;
  show_phone: boolean | null;
  show_social_media: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### API Integration

#### Tenant CRUD Operations
```typescript
// Create tenant
const createTenant = async (tenantData: TenantFormData) => {
  const { data: newTenant, error } = await supabase
    .from('tenants')
    .insert([{
      name: tenantData.name,
      slug: tenantData.slug,
      owner_email: tenantData.owner_email,
      is_active: tenantData.status === 'active',
      settings: {
        auto_accept_orders: false,
        require_phone_verification: false,
        allow_guest_checkout: true,
        minimum_order_amount: 0,
        delivery_fee: 0,
        free_delivery_threshold: 0
      }
    }])
    .select()
    .single();

  if (error) throw error;
  return newTenant;
};

// Create tenant info
const createTenantInfo = async (tenantId: string, infoData: Partial<TenantInfo>) => {
  const { error } = await supabase
    .from('tenant_info')
    .upsert({
      tenant_id: tenantId,
      ...infoData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' });

  if (error) throw error;
};

// Update tenant
const updateTenant = async (tenantId: string, updates: Partial<Tenant>) => {
  const { error } = await supabase
    .from('tenants')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', tenantId);

  if (error) throw error;
};

// Delete tenant
const deleteTenant = async (tenantId: string) => {
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', tenantId);

  if (error) throw error;
};
```

#### Storage Operations
```typescript
// Create tenant storage structure
const createTenantStorageStructure = async (tenantSlug: string) => {
  const buckets = [
    { bucket: 'store-icons', folder: 'logo' },
    { bucket: 'menu-images', folder: 'menu-items' },
    { bucket: 'qris-images', folder: 'qris' }
  ];

  for (const { bucket, folder } of buckets) {
    const folderPath = `${tenantSlug}/${folder}`;
    
    // Create placeholder file to ensure folder exists
    const { error } = await supabase.storage
      .from(bucket)
      .upload(`${folderPath}/.gitkeep`, new Blob([''], { type: 'text/plain' }), {
        upsert: true
      });
    
    if (error && !error.message.includes('already exists')) {
      throw error;
    }
  }
};

// Delete tenant storage structure
const deleteTenantStorageStructure = async (tenantSlug: string) => {
  const buckets = ['store-icons', 'menu-images', 'qris-images'];
  
  for (const bucket of buckets) {
    const { data: files } = await supabase.storage
      .from(bucket)
      .list(tenantSlug);
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${tenantSlug}/${file.name}`);
      await supabase.storage
        .from(bucket)
        .remove(filePaths);
    }
  }
};
```

### Authentication & Authorization

#### Role-Based Access Control
```typescript
// Check super admin access
const checkSuperAdminAccess = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (profile?.role !== 'super_admin') {
    throw new Error('Super admin access required');
  }
  
  return user;
};
```

#### Protected Routes
```typescript
// Super admin route protection
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);
  
  if (loading) return <LoadingSpinner />;
  if (!user || user.role !== 'super_admin') return null;
  
  return <>{children}</>;
};
```

### Error Handling

#### Error States
```typescript
// Error handling in tenant operations
const handleTenantOperation = async (operation: () => Promise<void>) => {
  try {
    setLoading(true);
    await operation();
    showSuccess('Success', 'Operation completed successfully');
  } catch (error: any) {
    console.error('Tenant operation error:', error);
    showError('Error', error.message || 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};
```

#### Validation Errors
```typescript
// Form validation error handling
const handleFormSubmit = async (data: TenantFormData) => {
  try {
    // Validate slug uniqueness
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', editingTenant?.id || '')
      .single();
    
    if (existingTenant) {
      setError('slug', { message: 'Slug already exists' });
      return;
    }
    
    // Proceed with form submission
    await submitForm(data);
  } catch (error) {
    handleFormError(error);
  }
};
```

### Performance Optimizations

#### Data Loading
```typescript
// Optimized tenant list loading
const loadTenants = useCallback(async () => {
  try {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        tenant_info(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    setTenants(data || []);
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
}, []);
```

#### Caching
```typescript
// Cache tenant data
const [tenantCache, setTenantCache] = useState<Map<string, Tenant>>(new Map());

const getCachedTenant = (tenantId: string) => {
  return tenantCache.get(tenantId);
};

const setCachedTenant = (tenant: Tenant) => {
  setTenantCache(prev => new Map(prev).set(tenant.id, tenant));
};
```

### Testing

#### Unit Tests
```typescript
// Test tenant creation
describe('Tenant Creation', () => {
  it('should create tenant with valid data', async () => {
    const tenantData = {
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      owner_email: 'test@example.com',
      status: 'active' as const
    };
    
    const result = await createTenant(tenantData);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(tenantData.name);
    expect(result.slug).toBe(tenantData.slug);
  });
  
  it('should reject duplicate slug', async () => {
    const tenantData = {
      name: 'Duplicate Restaurant',
      slug: 'existing-slug',
      owner_email: 'test@example.com',
      status: 'active' as const
    };
    
    await expect(createTenant(tenantData)).rejects.toThrow();
  });
});
```

#### Integration Tests
```typescript
// Test complete tenant workflow
describe('Tenant Management Workflow', () => {
  it('should create, edit, and delete tenant', async () => {
    // Create tenant
    const tenant = await createTenant(validTenantData);
    expect(tenant).toBeDefined();
    
    // Edit tenant
    const updatedTenant = await updateTenant(tenant.id, {
      name: 'Updated Restaurant Name'
    });
    expect(updatedTenant.name).toBe('Updated Restaurant Name');
    
    // Delete tenant
    await deleteTenant(tenant.id);
    const deletedTenant = await getTenant(tenant.id);
    expect(deletedTenant).toBeNull();
  });
});
```

### Security Considerations

#### Input Validation
- All form inputs validated with Zod schemas
- SQL injection prevention with parameterized queries
- XSS prevention with proper escaping
- File upload validation and sanitization

#### Access Control
- Role-based access control (RBAC)
- JWT token validation
- Route protection
- API endpoint authorization

#### Data Protection
- Sensitive data encryption
- Audit logging
- Data retention policies
- GDPR compliance considerations

### Deployment

#### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SITE_URL=your_production_url
```

#### Build Configuration
```typescript
// Vite configuration for super admin
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'super-admin': ['./src/pages/SuperAdminDashboardNew.tsx']
        }
      }
    }
  }
});
```

### Monitoring & Analytics

#### Performance Monitoring
- Page load times
- API response times
- Error rates
- User interactions

#### Business Metrics
- Tenant creation rate
- Tenant activation rate
- Support ticket volume
- System usage patterns

### Future Enhancements

#### Planned Features
1. **Bulk Operations**: Bulk tenant management
2. **Advanced Analytics**: Detailed tenant analytics
3. **Automated Onboarding**: Streamlined tenant setup
4. **Multi-region Support**: Geographic tenant distribution
5. **API Management**: Tenant API usage monitoring
6. **Backup & Recovery**: Automated backup systems
7. **Audit Trail**: Comprehensive activity logging
8. **White-label Options**: Customizable branding

#### Technical Improvements
1. **Real-time Updates**: WebSocket integration
2. **Advanced Search**: Full-text search capabilities
3. **Export Features**: Data export functionality
4. **Integration APIs**: Third-party integrations
5. **Mobile App**: Mobile admin interface
6. **AI Insights**: Predictive analytics
7. **Automated Scaling**: Dynamic resource allocation
8. **Multi-tenant Isolation**: Enhanced security
