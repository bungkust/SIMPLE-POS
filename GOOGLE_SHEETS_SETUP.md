# 🚀 Google Sheets Sync Setup Guide

Fitur sync ke Google Sheets memungkinkan Anda backup data orders ke Google Sheets secara otomatis menggunakan Google Apps Script.

## 📋 Prerequisites

1. **Google Account** dengan akses Google Drive & Google Sheets
2. **Google Apps Script** project baru
3. **Web app deployment** dengan permissions yang benar

## 🛠️ Step-by-Step Setup

### Step 1: Create Google Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Klik **"New Project"**
3. Copy kode dari file `google-apps-script-template.gs`
4. Paste ke editor dan **Save** dengan nama `Code.gs`

### Step 2: Setup Sheet Structure

1. Di Apps Script editor, klik **Run** pada function `setupSheet()`
2. Berikan permissions jika diminta
3. Sheet "Orders" akan dibuat dengan headers yang benar

### Step 3: Deploy Web App

1. Klik **Deploy** → **New deployment**
2. Pilih **Web app**
3. Set konfigurasi:
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone, even anonymous
4. Klik **Deploy**
5. Copy **Web app URL** yang muncul

### Step 4: Configure Environment

1. Copy `.env.example` ke `.env`
2. Edit `.env` dan tambahkan Google Apps Script URL:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

### Step 5: Test Integration

1. Jalankan aplikasi POS
2. Buka Admin Dashboard → Orders
3. Klik tombol **"Export to Sheets"**
4. Jika berhasil, data akan muncul di Google Sheets

## 📊 Google Sheets Structure

Sheet akan memiliki kolom berikut:

| Order Code | Tanggal | Nama Customer | No HP | Items | Total | Metode | Status | Exported At |
|------------|---------|---------------|-------|-------|-------|--------|--------|-------------|

## 🔧 Troubleshooting

### Error: "Script not found"
- Pastikan deployment URL benar
- Cek permissions di Apps Script

### Error: "Permission denied"
- Pastikan "Anyone, even anonymous" di web app settings
- Redeploy jika perlu

### Error: "Sheet not found"
- Jalankan function `setupSheet()` di Apps Script
- Pastikan sheet "Orders" ada

### Data tidak muncul di sheet
- Cek browser console untuk error messages
- Pastikan Apps Script tidak ada syntax error

## 🚀 Advanced Features

### Auto-backup versioning
- Script otomatis membuat sheet baru dengan timestamp
- Format: `Orders_YYYY-MM-DD`

### Multiple sheet support
- Bisa export ke sheet berbeda dengan parameter `sheetName`

### Error logging
- Semua errors dicatat di Apps Script logs
- Akses via **View** → **Logs** di Apps Script editor

## 📞 Support

Jika ada masalah:
1. Cek Apps Script logs
2. Verify deployment URL
3. Pastikan permissions benar
4. Test dengan function `testExport()` di Apps Script

---

**✅ Setup selesai?** Aplikasi POS sekarang bisa sync data ke Google Sheets! 🎉
