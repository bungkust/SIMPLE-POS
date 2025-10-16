# 🔧 URGENT: Update Netlify Environment Variables

## 🚨 Problem
Link invitation masih menggunakan domain Netlify (`kuspos.netlify.app`) dan mendapatkan 404 error.

## ✅ Solution
Update environment variable `VITE_SITE_URL` di Netlify Dashboard.

## 📋 Step-by-Step Instructions

### 1. Login to Netlify Dashboard
- Go to: https://app.netlify.com
- Login with your account
- Select project: `kuspos`

### 2. Navigate to Environment Variables
- Click on **Site settings** (gear icon)
- Go to **Environment variables** in the left sidebar
- Click **Add a variable**

### 3. Update VITE_SITE_URL
- **Variable name**: `VITE_SITE_URL`
- **Value**: `https://pos.bungkust.web.id`
- Click **Save**

### 4. Trigger New Deployment
- Go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**
- Wait for deployment to complete

## 🧪 Test After Deployment

1. **Create new tenant** in super admin dashboard
2. **Copy invitation link**
3. **Verify** link uses correct domain:
   ```
   ✅ https://pos.bungkust.web.id/kus/admin/setup?token=...
   ❌ https://kuspos.netlify.app/kus/admin/setup?token=...
   ```

## 🔍 Current Environment Variables (Check These)

Make sure these are set correctly in Netlify:

```bash
VITE_SITE_URL=https://pos.bungkust.web.id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_ADMIN_EMAILS=admin@yourdomain.com,manager@yourdomain.com
VITE_PAYMENT_INFO_TEXT=Your payment instructions here
VITE_QRIS_IMAGE_URL=https://your-qris-image-url.com
```

## 🚨 If Still Getting 404

If you still get 404 after updating environment variables:

1. **Check custom domain setup**:
   - Go to **Domain settings** in Netlify
   - Verify `pos.bungkust.web.id` is properly configured
   - Check DNS settings

2. **Verify routing**:
   - The SPA fallback in `netlify.toml` should handle all routes
   - Check if there are any conflicting redirect rules

3. **Test direct access**:
   - Try accessing: `https://pos.bungkust.web.id/`
   - Should show the main application

## 📞 Support

If you need help:
1. Check Netlify deployment logs
2. Verify DNS configuration
3. Test with different browsers
4. Check browser console for errors

## 🎯 Expected Result

After updating `VITE_SITE_URL`:
- ✅ All invitation links use `https://pos.bungkust.web.id`
- ✅ Tenant setup pages work correctly
- ✅ OAuth redirects work properly
- ✅ All URLs use production domain

---

**Status**: 🚨 **URGENT** - Environment variable needs immediate update
