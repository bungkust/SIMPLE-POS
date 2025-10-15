# Deployment Guide

## Environment Configuration

### Development vs Production URLs

The application uses different base URLs for development and production:

- **Development**: Uses `window.location.origin` (e.g., `http://localhost:5173`)
- **Production**: Uses `VITE_SITE_URL` environment variable

### Environment Variables Required

#### For Development (.env)
```bash
# Development - uses localhost
VITE_SITE_URL=http://localhost:5173
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### For Production (Netlify Environment Variables)
```bash
# Production - use your actual domain
VITE_SITE_URL=https://your-production-domain.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_ADMIN_EMAILS=admin@yourdomain.com,manager@yourdomain.com
VITE_PAYMENT_INFO_TEXT=Your payment instructions here
VITE_QRIS_IMAGE_URL=https://your-qris-image-url.com
```

### Invitation Link Generation

The invitation links are automatically generated using the correct domain:

#### Development
```
http://localhost:5173/{tenant-slug}/admin/setup?token={tenant-id}
```

#### Production
```
https://your-production-domain.com/{tenant-slug}/admin/setup?token={tenant-id}
```

### Files That Use VITE_SITE_URL

1. **TenantFormModalNew.tsx** (Super Admin)
   - Generates invitation links for new tenants
   - Uses: `import.meta.env.VITE_SITE_URL || window.location.origin`

2. **TenantsTabNew.tsx** (Super Admin)
   - Generates invitation links for existing tenants
   - Uses: `import.meta.env.VITE_SITE_URL || window.location.origin`

3. **TenantFormModalNew.tsx** (Admin)
   - Generates setup URLs for tenant creation
   - Uses: `import.meta.env.VITE_SITE_URL || window.location.origin`

4. **AuthContext.tsx**
   - OAuth redirect URLs
   - Uses: `import.meta.env.VITE_SITE_URL || window.location.origin`

5. **ProtectedRoute.tsx**
   - OAuth redirect URLs
   - Uses: `import.meta.env.VITE_SITE_URL || window.location.origin`

6. **supabase.ts**
   - Site URL generation utility
   - Uses: `import.meta.env.VITE_SITE_URL` in production, `window.location.origin` in development

### Deployment Checklist

#### Before Deployment
- [ ] Set `VITE_SITE_URL` to your production domain in Netlify
- [ ] Update Google OAuth redirect URLs in Google Console
- [ ] Update Supabase redirect URLs in Supabase Dashboard
- [ ] Test invitation links in staging environment

#### After Deployment
- [ ] Verify invitation links use production domain
- [ ] Test OAuth login flow
- [ ] Test tenant creation and invitation flow
- [ ] Verify all external links work correctly

### Google OAuth Configuration

Update these URLs in Google Console:

#### Authorized JavaScript origins
```
https://your-production-domain.com
```

#### Authorized redirect URIs
```
https://your-production-domain.com/auth/callback
```

### Supabase Configuration

Update these URLs in Supabase Dashboard:

#### Site URL
```
https://your-production-domain.com
```

#### Redirect URLs
```
https://your-production-domain.com/auth/callback
https://your-production-domain.com/**
```

### Testing Invitation Links

1. Create a new tenant in super admin dashboard
2. Copy the invitation link
3. Verify it uses the correct domain (production, not localhost)
4. Test the link opens the correct setup page
5. Complete the setup flow

### Troubleshooting

#### Issue: Invitation links still use localhost in production
**Solution**: Check that `VITE_SITE_URL` is set correctly in Netlify environment variables

#### Issue: OAuth redirect fails
**Solution**: Update Google OAuth and Supabase redirect URLs to match production domain

#### Issue: Setup page not found
**Solution**: Verify the tenant slug and token are correct in the URL

### Security Notes

- Never commit `.env` files to version control
- Use HTTPS in production
- Keep environment variables secure
- Regularly rotate API keys and secrets
