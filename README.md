# SIMPLE-POS

A modern, multi-tenant Point of Sale (POS) system built with React, TypeScript, and Supabase.

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

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔒 Security Notice

**⚠️ IMPORTANT:** This repository has been cleaned of all hardcoded credentials. You must set up your own:

- Supabase project and credentials
- Google OAuth credentials (if using Google login)
- Admin user accounts
- Contact information

See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for detailed setup instructions.

## 📚 Documentation

- [Security Guide](./SECURITY_GUIDE.md) - Complete security setup guide
- [Quick Reference](./docs/QUICK_REFERENCE.md) - Fast lookup for common tasks
- [Repository Overview](./docs/REPO_OVERVIEW.md) - Detailed project documentation

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Authentication:** Email/Password + Google OAuth
- **Deployment:** Netlify

## 📄 License

This project is licensed under the MIT License.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/bungkust/SIMPLE-POS)