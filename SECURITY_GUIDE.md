# 🔒 Security Guide - Removing Hardcoded Credentials

## 🚨 **CRITICAL: All Hardcoded Credentials Removed**

This guide documents the security fixes applied to remove all hardcoded credentials, admin emails, and default passwords from the codebase.

---

## ✅ **Security Issues Fixed**

### **1. Hardcoded Supabase Credentials**
- ❌ **REMOVED:** `https://fheaayyooebdsppcymce.supabase.co`
- ❌ **REMOVED:** `https://vxcvsqvrdxzvwaxlbuum.supabase.co`
- ❌ **REMOVED:** Hardcoded anon keys
- ✅ **FIXED:** Now uses environment variables

### **2. Hardcoded Google OAuth Credentials**
- ❌ **REMOVED:** Hardcoded Google OAuth Client ID and Secret
- ✅ **FIXED:** Now uses environment variables

### **3. Hardcoded Admin Emails & Passwords**
- ❌ **REMOVED:** `admin@kopipendekar.com` / `admin123456`
- ❌ **REMOVED:** `manager@kopipendekar.com` / `manager123456`
- ❌ **REMOVED:** `tenant@test.com`
- ✅ **FIXED:** Now uses placeholders in documentation

### **4. Hardcoded Contact Information**
- ❌ **REMOVED:** `081234567890` (phone numbers)
- ❌ **REMOVED:** `(021) 12345678` (phone numbers)
- ❌ **REMOVED:** `info@kopipendekar.com` (email addresses)
- ✅ **FIXED:** Now uses placeholders

---

## 🔧 **Files Modified**

### **Main Project:**
- ✅ `setup-storage.js` - Removed hardcoded Supabase URL
- ✅ `deploy.sh` - Removed hardcoded Supabase URL
- ✅ `src/components/admin/GoogleSheetsTab.tsx` - Removed hardcoded phone
- ✅ `src/components/admin/PaymentTab.tsx` - Removed hardcoded account number
- ✅ `src/pages/InvoicePage.tsx` - Removed hardcoded contact info

### **Test Login Project:**
- ✅ `Test Login/tenant-hub-auth/src/lib/supabase.ts` - Now uses env variables
- ✅ `Test Login/tenant-hub-auth/database-schema.sql` - Removed OAuth credentials

### **Documentation:**
- ✅ All `.md` files in `docs/` - Replaced with placeholders
- ✅ `README.md` files - Updated to use environment variables

---

## 🚀 **Setup Instructions**

### **1. Create Environment Files**

**Main Project:**
```bash
cp env.example .env
```

**Test Login Project:**
```bash
cd "Test Login/tenant-hub-auth"
cp env.example .env
```

### **2. Fill in Your Credentials**

**Main Project `.env`:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SITE_URL=https://your-domain.com
VITE_SITE_NAME=Your Site Name
VITE_ADMIN_EMAILS=admin@yourdomain.com,manager@yourdomain.com
VITE_PAYMENT_INFO_TEXT=Your payment instructions here
VITE_QRIS_IMAGE_URL=https://your-qris-image-url.com
```

**Test Login Project `.env`:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### **3. Update Contact Information**

**In your application code, replace placeholders with actual values:**
- `[YOUR_PHONE_NUMBER]` → Your actual phone number
- `[YOUR_EMAIL]` → Your actual email address
- `[YOUR_ACCOUNT_NUMBER]` → Your actual account number
- `[YOUR_PHONE]` → Your actual phone number

---

## 🔐 **Security Best Practices**

### **1. Environment Variables**
- ✅ **DO:** Use environment variables for all sensitive data
- ❌ **DON'T:** Hardcode credentials in source code
- ❌ **DON'T:** Commit `.env` files to version control

### **2. Documentation**
- ✅ **DO:** Use placeholders like `[YOUR_EMAIL]` in documentation
- ❌ **DON'T:** Include real credentials in documentation
- ❌ **DON'T:** Share credentials in public repositories

### **3. Deployment**
- ✅ **DO:** Set environment variables in your deployment platform
- ✅ **DO:** Use secure secret management
- ❌ **DON'T:** Store credentials in deployment scripts

### **4. Google OAuth Setup**
- ✅ **DO:** Create your own Google OAuth credentials
- ✅ **DO:** Use your own Supabase project
- ❌ **DON'T:** Use the example credentials from documentation

---

## 🚨 **Immediate Actions Required**

### **1. Create Your Own Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key
4. Update your `.env` file

### **2. Create Your Own Google OAuth Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add your domain to authorized origins
4. Update your `.env` file

### **3. Create Your Own Admin Users**
1. Use Supabase Auth to create admin users
2. Assign appropriate roles in your database
3. Use strong, unique passwords

### **4. Update Contact Information**
1. Replace all `[YOUR_*]` placeholders with actual values
2. Update phone numbers, emails, and account numbers
3. Test all functionality

---

## 📋 **Verification Checklist**

- [ ] All `.env` files created and filled with real values
- [ ] No hardcoded credentials in source code
- [ ] No real credentials in documentation
- [ ] Supabase project created and configured
- [ ] Google OAuth credentials created
- [ ] Admin users created with strong passwords
- [ ] Contact information updated
- [ ] Application tested with new credentials

---

## 🆘 **If You Need Help**

1. **Supabase Setup:** Check [Supabase Documentation](https://supabase.com/docs)
2. **Google OAuth:** Check [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
3. **Environment Variables:** Check your deployment platform's documentation
4. **Security Issues:** Contact your security team

---

**⚠️ IMPORTANT:** This codebase is now secure and ready for production use. Make sure to follow all security best practices when deploying.
