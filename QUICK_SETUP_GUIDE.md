# 🚀 Quick Setup: Google Sheets Sync

## ✅ Tombol Sudah Siap di Frontend
Tombol "Export to Sheets" sudah tersedia di:
- **File**: `src/components/admin/OrdersTab.tsx` 
- **Lokasi**: Header OrdersTab (sebelah Export CSV)
- **Styling**: Button hijau dengan icon Sheet

## ⚡ Setup Google Apps Script (5 menit)

### Step 1: Copy Script Template
1. Buka file `google-apps-script-template.gs` di project ini
2. Copy seluruh isinya
3. Buka [script.google.com](https://script.google.com)
4. Klik **"New Project"**
5. Paste kode yang sudah di-copy
6. Klik **"Save"** (Ctrl+S)

### Step 2: Test Script Function
1. Di Apps Script editor, klik **"Run"** 
2. Cari function `setupSheet()` dan klik run
3. Berikan permissions jika diminta
4. Sheet "Orders" akan dibuat dengan headers

### Step 3: Deploy Web App
1. Klik **"Deploy"** → **"New deployment"**
2. Pilih **"Web app"**
3. Konfigurasi:
   ```
   Execute as: Me (your account)
   Who has access: Anyone, even anonymous
   ```
4. Klik **"Deploy"**
5. Copy **Web app URL** yang muncul

### Step 4: Configure Environment
1. Edit file `.env` di root project
2. Tambahkan atau update baris:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
3. Ganti `YOUR_DEPLOYMENT_ID` dengan ID dari step 3

### Step 5: Test Integration
1. Restart aplikasi atau refresh browser
2. Buka Admin Dashboard → Orders tab
3. Klik tombol hijau **"Export to Sheets"**
4. Data akan langsung sync ke Google Sheets!

## 🔧 Troubleshooting

### Error: "Failed to fetch"
- ❌ Pastikan URL di .env benar
- ❌ Cek deployment sudah published

### Error: "Permission denied"  
- ❌ Set "Who has access" = "Anyone, even anonymous"
- ❌ Redeploy web app

### Data tidak muncul di sheet
- ✅ Jalankan function `setupSheet()` di Apps Script
- ✅ Pastikan sheet "Orders" ada

### Tombol tidak muncul
- ✅ Restart aplikasi setelah konfigurasi .env
- ✅ Cek browser console untuk error

## 📊 Hasil Setup

Setelah setup selesai, Anda akan punya:

✅ **Tombol Export to Sheets** (hijau) di header OrdersTab  
✅ **Auto-sync** data orders ke Google Sheets  
✅ **Versioning** otomatis dengan timestamp  
✅ **Real-time backup** data penjualan  

## 🚨 Important Notes

- **Simpan deployment URL** dengan aman
- **Jangan share** Apps Script project secara public
- **Test dulu** dengan function `testExport()` di Apps Script

---

**Setup selesai?** Tombol hijau "Export to Sheets" siap digunakan! 🎉
