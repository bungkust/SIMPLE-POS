#!/bin/bash

echo "🔑 Admin Email Setup for Kopi Pendekar"
echo "====================================="

# Ask for admin email
read -p "Enter your admin email address: " admin_email

if [ -z "$admin_email" ]; then
    echo "❌ Email cannot be empty!"
    exit 1
fi

echo ""
echo "📧 Setting up admin email: $admin_email"

# Update .env file if it exists
if [ -f ".env" ]; then
    # Create backup
    cp .env .env.backup

    # Update admin email
    sed -i.bak "s/your_admin_email@example.com/$admin_email/" .env

    echo "✅ Admin email updated in .env file"
    echo "📋 Backup created: .env.backup"
else
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Go to: http://localhost:5173"
echo "3. Click 'Admin' button in top-right corner"
echo "4. Login with your email and any password"
echo "5. You'll be redirected to admin dashboard"

echo ""
echo "🔐 Note: The password can be anything since we're using email-based admin detection."
