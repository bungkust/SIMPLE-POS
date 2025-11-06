# GitHub Actions Workflows

## Keep Supabase Active

Workflow ini menjaga Supabase project tetap aktif dengan melakukan ping secara berkala setiap 12 jam.

### Setup Instructions

1. **Buka GitHub Repository Settings**
   - Pergi ke repository GitHub Anda
   - Klik **Settings** → **Secrets and variables** → **Actions**

2. **Tambahkan Repository Secrets**
   
   Tambahkan 2 secrets berikut:
   
   - **Name**: `VITE_SUPABASE_URL`
     - **Value**: URL Supabase project Anda (contoh: `https://xxxxx.supabase.co`)
     - Bisa ditemukan di Supabase Dashboard → Settings → API
   
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     - **Value**: Anon/Public key dari Supabase project
     - Bisa ditemukan di Supabase Dashboard → Settings → API

3. **Verifikasi Workflow**
   - Pergi ke tab **Actions** di GitHub repository
   - Klik workflow **Keep Supabase Active**
   - Klik **Run workflow** untuk test manual
   - Pastikan workflow berjalan dengan sukses

### Schedule

Workflow berjalan otomatis setiap **12 jam** menggunakan cron schedule:
- `0 */12 * * *` - Setiap 12 jam pada menit ke-0

### Manual Trigger

Anda juga bisa menjalankan workflow secara manual:
1. Pergi ke tab **Actions**
2. Pilih workflow **Keep Supabase Active**
3. Klik **Run workflow** → **Run workflow**

### Troubleshooting

**Error: Missing secrets**
- Pastikan kedua secrets sudah ditambahkan di repository settings
- Pastikan nama secrets tepat: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`

**Error: HTTP 401/403**
- Periksa apakah anon key sudah benar
- Pastikan REST API sudah diaktifkan di Supabase project

**Error: HTTP 404**
- Periksa apakah URL Supabase sudah benar
- Pastikan format URL: `https://xxxxx.supabase.co` (tanpa trailing slash)

### Catatan

- Workflow ini menggunakan **public anon key** yang aman untuk digunakan
- Workflow hanya melakukan query read-only, tidak mengubah data
- Jika RLS (Row Level Security) memblokir query, workflow tetap akan berhasil selama ping API berhasil

