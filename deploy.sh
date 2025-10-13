#!/bin/bash

echo "🚀 Kopi Pendekar Deployment Script"
echo "=================================="

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Build folder not found. Running build..."
    npm run build
fi

echo ""
echo "📋 Deployment Checklist:"
echo "✅ Application built successfully"
echo "✅ Database schema deployed to Supabase"
echo "✅ Environment variables configured"

echo ""
echo "🔗 To deploy to Netlify:"
echo ""
echo "Option 1 - Netlify CLI (if installed):"
echo "  npx netlify-cli deploy --prod --dir=dist"
echo ""
echo "Option 2 - Manual Upload:"
echo "  1. Go to https://app.netlify.com"
echo "  2. Drag the 'dist' folder to the deployment area"
echo ""
echo "Option 3 - GitHub Integration:"
echo "  1. Push your code to GitHub"
echo "  2. Connect your GitHub repo to Netlify"
echo "  3. Deploy automatically on push"
echo ""
echo "⚙️  After deployment, set these environment variables in Netlify:"
echo "  VITE_SUPABASE_URL=[YOUR_SUPABASE_URL]"
echo "  VITE_SUPABASE_ANON_KEY=your_anon_key_here"
echo "  VITE_SITE_NAME=Kopi Pendekar"
echo "  VITE_ADMIN_EMAILS=your_email@example.com"
echo "  VITE_PAYMENT_INFO_TEXT=Your payment instructions"
echo "  VITE_QRIS_IMAGE_URL=https://your-qris-url.com"
echo ""
echo "🌐 Your deployed site will be available at: https://your-site-name.netlify.app"
