# SIMPLE-POS

A modern, secure, multi-tenant Point of Sale (POS) system built with React, TypeScript, and Supabase.

## ✨ Features

### 🔐 **Security First**
- **Server-side authentication** with RPC functions
- **No hardcoded credentials** - all secrets in environment variables
- **Row Level Security (RLS)** policies for data protection
- **Secure tenant isolation** with proper access controls

### 🏢 **Multi-Tenant Management**
- **Super Admin Dashboard** for tenant management
- **Simplified tenant creation** with owner email setup
- **Auto-create account** or **manual setup URL** options
- **Tenant-specific admin access** with proper role management

### 🎨 **Modern UI/UX**
- **Professional in-app popups** (no more browser alerts)
- **Responsive design** with TailwindCSS
- **Copy-to-clipboard** functionality for setup URLs
- **Error handling** with detailed user feedback

### 🛒 **POS Features**
- **Menu management** with categories and items
- **Order processing** with cart functionality
- **Payment tracking** and invoice generation
- **Order history** and reporting

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/bungkust/SIMPLE-POS.git
   cd SIMPLE-POS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual credentials
   ```

4. **Set up Supabase database**
   ```bash
   # Apply the RPC functions to your Supabase project
   # See SECURITY_GUIDE.md for detailed instructions
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔒 Security Setup

**⚠️ IMPORTANT:** This repository has been completely cleaned of all hardcoded credentials. You must set up your own:

- **Supabase project** and credentials
- **Google OAuth credentials** (if using Google login)
- **Admin user accounts** and roles
- **Contact information** and business details

### Required Environment Variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for detailed setup instructions.

## 📚 Documentation

- **[Security Guide](./SECURITY_GUIDE.md)** - Complete security setup guide
- **[Security Fixes Report](./SECURITY_FIXES_REPORT.md)** - Detailed security improvements
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Fast lookup for common tasks
- **[Repository Overview](./docs/REPO_OVERVIEW.md)** - Detailed project documentation

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication:** Email/Password + Google OAuth with server-side validation
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Deployment:** Netlify
- **UI Components:** Lucide React icons, Custom popup components

## 🏗️ Architecture

### **Multi-Tenant Structure**
```
Super Admin
├── Tenant 1 (Owner: user1@example.com)
│   ├── Admin Dashboard
│   ├── Menu Management
│   ├── Order Processing
│   └── Payment Tracking
├── Tenant 2 (Owner: user2@example.com)
│   └── ... (same structure)
└── Tenant N
```

### **Security Layers**
1. **Client-side:** React components with proper state management
2. **API Layer:** Supabase RPC functions for server-side validation
3. **Database:** PostgreSQL with RLS policies
4. **Authentication:** Supabase Auth with role-based access control

## 🚀 Deployment

1. **Set up Supabase project**
2. **Apply database schema and RPC functions**
3. **Configure environment variables**
4. **Deploy to Netlify**

See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for complete deployment instructions.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please refer to the documentation or create an issue in the repository.

---

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/bungkust/SIMPLE-POS)