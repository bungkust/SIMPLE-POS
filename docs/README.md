# SIMPLE-POS Documentation

## Overview
SIMPLE-POS is a comprehensive Point of Sale (POS) system designed for restaurants and food service businesses. It provides a complete solution for menu management, order processing, payment handling, and business administration.

## System Architecture

### Multi-Tenant Architecture
The system is built with a multi-tenant architecture, allowing multiple restaurants to operate independently on the same platform while maintaining data isolation and security.

### Core Components

#### 1. **Menu Browser** (Public Interface)
- **Purpose**: Customer-facing menu display and ordering interface
- **Users**: Restaurant customers, staff showing menu to customers
- **Key Features**: Menu browsing, search, cart management, restaurant information display
- **Documentation**: [Menu Browser README](./MENU_BROWSER_README.md)

#### 2. **Admin Tenant Dashboard** (Restaurant Management)
- **Purpose**: Restaurant owner's control center for managing their POS system
- **Users**: Restaurant owners, managers, staff with admin access
- **Key Features**: Menu management, order processing, payment configuration, store settings
- **Documentation**: [Admin Tenant README](./ADMIN_TENANT_README.md)

#### 3. **Super Admin Dashboard** (Platform Management)
- **Purpose**: System-wide administration and tenant management
- **Users**: System administrators, platform owners, customer success managers
- **Key Features**: Tenant management, system monitoring, administrative controls
- **Documentation**: [Super Admin README](./SUPER_ADMIN_README.md)

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Zod** for schema validation
- **Lucide React** for icons

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** for database
- **Row Level Security (RLS)** for data isolation
- **Supabase Storage** for file uploads
- **Supabase Auth** for authentication

### Key Libraries
- **@supabase/supabase-js** for database operations
- **@tanstack/react-query** for data fetching and caching
- **react-router-dom** for routing
- **html2canvas** for receipt generation
- **react-hook-form** for form handling

## Database Schema

### Core Tables

#### `tenants`
- Stores basic tenant information
- Contains tenant settings and configuration
- Primary key: `id` (UUID)

#### `tenant_info`
- Stores detailed tenant information (normalized)
- One-to-one relationship with `tenants`
- Contains store details, social media, display settings
- Foreign key: `tenant_id` → `tenants.id`

#### `menu_items`
- Stores menu item information
- Tenant-specific with RLS policies
- Contains name, description, price, image, category

#### `categories`
- Stores menu categories
- Tenant-specific with RLS policies
- Contains name, sort order

#### `orders`
- Stores order information
- Tenant-specific with RLS policies
- Contains customer info, payment method, status

#### `order_items`
- Stores individual order items
- Links orders to menu items
- Contains quantity, price, item details

#### `payment_methods`
- Stores payment method configuration
- Tenant-specific with RLS policies
- Contains method type, settings, QRIS images

## Authentication & Authorization

### User Roles
1. **Super Admin**: Full system access, tenant management
2. **Tenant Owner**: Full access to their restaurant's data
3. **Tenant Staff**: Limited access to specific functions
4. **Customer**: Public access to menu and ordering

### Security Features
- **JWT-based authentication** via Supabase Auth
- **Row Level Security (RLS)** for data isolation
- **Role-based access control (RBAC)**
- **Input validation and sanitization**
- **File upload security**

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SITE_URL=your_production_url
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd SIMPLE-POS

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup
1. Run SQL migration scripts in Supabase SQL Editor
2. Set up RLS policies for data security
3. Configure storage buckets and policies
4. Set up authentication providers

## Deployment

### Production Deployment
- **Platform**: Netlify (recommended)
- **Database**: Supabase (managed)
- **Storage**: Supabase Storage
- **CDN**: Netlify CDN

### Build Process
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Configuration
- Set production environment variables in Netlify
- Configure custom domain
- Set up SSL certificates
- Configure redirects and headers

## API Documentation

### Supabase Integration
The system uses Supabase for all backend operations:

#### Authentication
```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
await supabase.auth.signOut();
```

#### Database Operations
```typescript
// Query data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');

// Insert data
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }]);

// Update data
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 'record_id');
```

#### File Upload
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('bucket_name')
  .upload('path/file.jpg', file);

// Get public URL
const { data } = supabase.storage
  .from('bucket_name')
  .getPublicUrl('path/file.jpg');
```

## Testing

### Test Structure
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and database operation testing
- **E2E Tests**: Complete user workflow testing

### Running Tests
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: WebP format, lazy loading
- **Caching**: React Query for data caching
- **Bundle Optimization**: Tree shaking, minification

### Database Optimizations
- **Indexing**: Proper database indexes
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Supabase connection management
- **Caching**: Query result caching

## Security Best Practices

### Data Protection
- **Encryption**: Data encrypted in transit and at rest
- **Access Control**: RLS policies for data isolation
- **Input Validation**: Zod schemas for data validation
- **File Security**: Secure file upload and storage

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Proper session handling
- **Password Security**: Strong password requirements
- **Rate Limiting**: API rate limiting

## Monitoring & Analytics

### Performance Monitoring
- **Page Load Times**: Core Web Vitals tracking
- **API Response Times**: Database query performance
- **Error Tracking**: Error monitoring and alerting
- **User Analytics**: User behavior tracking

### Business Metrics
- **Order Volume**: Daily/monthly order counts
- **Revenue Tracking**: Sales and payment analytics
- **User Engagement**: Feature usage statistics
- **System Health**: Uptime and performance metrics

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request
5. Code review and merge

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message standards

### Testing Requirements
- Unit tests for new features
- Integration tests for API changes
- E2E tests for user workflows
- Performance tests for optimizations

## Troubleshooting

### Common Issues

#### Database Connection Issues
- Check Supabase URL and keys
- Verify RLS policies
- Check network connectivity

#### Authentication Issues
- Verify user credentials
- Check JWT token validity
- Confirm user roles and permissions

#### File Upload Issues
- Check storage bucket configuration
- Verify file size and type limits
- Check RLS policies for storage

#### Performance Issues
- Check database query performance
- Verify image optimization
- Check bundle size and loading

### Support
- **Documentation**: Check component-specific READMEs
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Community**: Join the community forum

## Roadmap

### Short Term (Next 3 months)
- [ ] Advanced analytics dashboard
- [ ] Inventory management system
- [ ] Customer loyalty program
- [ ] Mobile app development

### Medium Term (3-6 months)
- [ ] Multi-location support
- [ ] Staff management system
- [ ] Advanced reporting
- [ ] Third-party integrations

### Long Term (6+ months)
- [ ] AI-powered recommendations
- [ ] Advanced automation
- [ ] International expansion
- [ ] Enterprise features

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
- **Project Maintainer**: [Your Name]
- **Email**: [your-email@example.com]
- **GitHub**: [your-github-username]
- **Website**: [your-website.com]

---

## Quick Links

- [Menu Browser Documentation](./MENU_BROWSER_README.md)
- [Admin Tenant Documentation](./ADMIN_TENANT_README.md)
- [Super Admin Documentation](./SUPER_ADMIN_README.md)
- [Database Schema](./TENANT_SCHEMA.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
