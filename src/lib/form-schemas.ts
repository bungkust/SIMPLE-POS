import { z } from "zod";

// Tenant Management Schemas
export const tenantFormSchema = z.object({
  name: z.string().min(1, "Nama tenant harus diisi").max(100, "Nama tenant terlalu panjang"),
  slug: z.string()
    .min(1, "Slug harus diisi")
    .max(50, "Slug terlalu panjang")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung"),
  owner_email: z.string().email("Email tidak valid"),
  owner_password: z.string().min(6, "Password minimal 6 karakter").optional(),
  is_active: z.boolean().default(true),
});

export const tenantSetupSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

export const superAdminLoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

// Menu Management Schemas
export const menuFormSchema = z.object({
  name: z.string().min(1, "Nama menu harus diisi").max(100, "Nama menu terlalu panjang"),
  description: z.string().max(500, "Deskripsi terlalu panjang").optional(),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  category_id: z.string().min(1, "Kategori harus dipilih"),
  is_available: z.boolean().default(true),
  image_url: z.string().url("URL gambar tidak valid").optional().or(z.literal("")),
  preparation_time: z.number().min(0, "Waktu persiapan tidak boleh negatif").optional(),
});

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi").max(50, "Nama kategori terlalu panjang"),
  description: z.string().max(200, "Deskripsi terlalu panjang").optional(),
  sort_order: z.number().min(0, "Urutan tidak boleh negatif").default(0),
});

// Order Management Schemas
export const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "Nama customer harus diisi").max(100, "Nama terlalu panjang"),
  phone: z.string().min(1, "Nomor telepon harus diisi").max(20, "Nomor telepon terlalu panjang"),
  pickupDate: z.string().min(1, "Tanggal pickup harus diisi"),
  notes: z.string().max(500, "Catatan terlalu panjang").optional(),
  paymentMethod: z.enum(["TRANSFER", "QRIS", "COD"], {
    required_error: "Metode pembayaran harus dipilih",
  }),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["BELUM BAYAR", "SUDAH BAYAR", "SEDANG DISIAPKAN", "SIAP DIAMBIL", "SELESAI", "DIBATALKAN"]),
  notes: z.string().max(500, "Catatan terlalu panjang").optional(),
});

// Settings Schemas
export const paymentSettingsSchema = z.object({
  transfer_enabled: z.boolean().default(false),
  transfer_account: z.string().max(100, "Nomor rekening terlalu panjang").optional(),
  transfer_bank: z.string().max(50, "Nama bank terlalu panjang").optional(),
  qris_enabled: z.boolean().default(false),
  qris_code: z.string().max(200, "Kode QRIS terlalu panjang").optional(),
  cod_enabled: z.boolean().default(true),
});

export const businessSettingsSchema = z.object({
  business_name: z.string().min(1, "Nama bisnis harus diisi").max(100, "Nama bisnis terlalu panjang"),
  business_address: z.string().max(200, "Alamat terlalu panjang").optional(),
  business_phone: z.string().max(20, "Nomor telepon terlalu panjang").optional(),
  business_email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  business_website: z.string().url("Website tidak valid").optional().or(z.literal("")),
  business_description: z.string().max(500, "Deskripsi terlalu panjang").optional(),
});

export const googleSheetsSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  webhook_url: z.string().url("Webhook URL tidak valid").optional().or(z.literal("")),
  sheet_id: z.string().max(100, "Sheet ID terlalu panjang").optional(),
  range: z.string().max(50, "Range terlalu panjang").optional(),
});

// Admin Management Schemas
export const adminFormSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "cashier"]).default("admin"),
});

// Cashier Schemas
export const cashierOrderSchema = z.object({
  customerName: z.string().min(1, "Nama customer harus diisi").max(100, "Nama terlalu panjang"),
  phone: z.string().min(1, "Nomor telepon harus diisi").max(20, "Nomor telepon terlalu panjang"),
  paymentMethod: z.enum(["CASH", "CARD", "QRIS"]),
  notes: z.string().max(500, "Catatan terlalu panjang").optional(),
});


// Type exports
export type TenantFormData = z.infer<typeof tenantFormSchema>;
export type TenantSetupData = z.infer<typeof tenantSetupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SuperAdminLoginData = z.infer<typeof superAdminLoginSchema>;
export type MenuFormData = z.infer<typeof menuFormSchema>;
export type CategoryFormData = z.infer<typeof categoryFormSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
export type OrderStatusUpdateData = z.infer<typeof orderStatusUpdateSchema>;
export type CashierOrderData = z.infer<typeof cashierOrderSchema>;
export type PaymentSettingsData = z.infer<typeof paymentSettingsSchema>;
export type SettingsFormData = z.infer<typeof settingsFormSchema>;
export type GoogleSheetsConfigData = z.infer<typeof googleSheetsConfigSchema>;
