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
  // preparation_time field removed as it doesn't exist in database schema
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
  paymentMethod: z.string({
    required_error: "Metode pembayaran harus dipilih",
    invalid_type_error: "Metode pembayaran harus dipilih"
  }).min(1, "Metode pembayaran harus dipilih").refine(
    (val) => val && val.trim() !== '' && ["TRANSFER", "QRIS", "COD"].includes(val),
    "Metode pembayaran harus dipilih"
  ),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["BELUM BAYAR", "SUDAH BAYAR", "DIBATALKAN"]),
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
  spreadsheet_id: z.string().max(100, "Spreadsheet ID terlalu panjang").optional(),
  sheet_name: z.string().max(50, "Sheet name terlalu panjang").default("Orders"),
  webhook_url: z.string().url("Webhook URL tidak valid").optional().or(z.literal("")),
  api_key: z.string().max(200, "API key terlalu panjang").optional(),
  sync_interval: z.string().default("daily"),
  include_items: z.boolean().default(true),
});

// Admin Management Schemas
export const adminFormSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "cashier"]).default("admin"),
});

// Cashier Schemas
export const cashierOrderSchema = z.object({
  customer_name: z.string().max(100, "Nama terlalu panjang").optional(),
  customer_phone: z.string().max(20, "Nomor telepon terlalu panjang").optional(),
  payment_method: z.enum(["TRANSFER", "QRIS", "COD"]),
  notes: z.string().max(500, "Catatan terlalu panjang").optional(),
});

// Settings Schema
export const settingsFormSchema = z.object({
  storeName: z.string().min(1, "Nama toko harus diisi").max(100, "Nama toko terlalu panjang"),
  storeLogoUrl: z.string().optional(), // Add missing field for logo_url
  storeBannerUrl: z.string().optional(), // Add banner image field
  storeIconType: z.string().default("Coffee"),
  storeDescription: z.string().max(500, "Deskripsi terlalu panjang").optional(),
  storeAddress: z.string().max(200, "Alamat terlalu panjang").optional(),
  storePhone: z.string().max(20, "Nomor telepon terlalu panjang").optional(),
  storeEmail: z.string().email("Email tidak valid").optional().or(z.literal("")),
  storeHours: z.string().max(100, "Jam operasional terlalu panjang").optional(),
  autoAcceptOrders: z.boolean().default(false),
  requirePhoneVerification: z.boolean().default(false),
  allowGuestCheckout: z.boolean().default(true),
  minimumOrderAmount: z.number().min(0, "Minimum order tidak boleh negatif").default(0),
  deliveryFee: z.number().min(0, "Biaya pengiriman tidak boleh negatif").default(0),
  freeDeliveryThreshold: z.number().min(0, "Threshold gratis ongkir tidak boleh negatif").default(0),
  // Social media links
  socialMedia: z.object({
    instagram: z.string().url("Instagram URL tidak valid").optional().or(z.literal("")),
    tiktok: z.string().url("TikTok URL tidak valid").optional().or(z.literal("")),
    twitter: z.string().url("X/Twitter URL tidak valid").optional().or(z.literal("")),
    facebook: z.string().url("Facebook URL tidak valid").optional().or(z.literal("")),
  }).optional(),
  // Header display settings
  headerDisplaySettings: z.object({
    showDescription: z.boolean().default(true),
    showOperatingHours: z.boolean().default(true),
    showAddress: z.boolean().default(true),
    showPhone: z.boolean().default(true),
    showSocialMedia: z.boolean().default(true),
  }).optional(),
});

// Super Admin Schemas
export const superAdminTenantFormSchema = z.object({
  name: z.string().min(1, "Nama tenant harus diisi").max(100, "Nama tenant terlalu panjang"),
  slug: z.string()
    .min(1, "Slug harus diisi")
    .max(50, "Slug terlalu panjang")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung"),
  description: z.string().max(500, "Deskripsi terlalu panjang").optional(),
  address: z.string().max(200, "Alamat terlalu panjang").optional(),
  phone: z.string().max(20, "Nomor telepon terlalu panjang").optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  website: z.string().url("Website tidak valid").optional().or(z.literal("")),
  operating_hours: z.string().max(100, "Jam operasional terlalu panjang").optional(),
  category: z.string().default("Restaurant"),
  status: z.enum(["active", "inactive"]).default("active"),
  owner_email: z.string().email("Email tidak valid"),
  owner_name: z.string().max(100, "Nama owner terlalu panjang").optional(),
  owner_phone: z.string().max(20, "Nomor telepon owner terlalu panjang").optional(),
  logo_url: z.string().url("URL logo tidak valid").optional().or(z.literal("")),
  // Social Media Links
  social_media: z.object({
    instagram: z.string().url("Instagram URL tidak valid").optional().or(z.literal("")),
    tiktok: z.string().url("TikTok URL tidak valid").optional().or(z.literal("")),
    twitter: z.string().url("X/Twitter URL tidak valid").optional().or(z.literal("")),
    facebook: z.string().url("Facebook URL tidak valid").optional().or(z.literal("")),
  }).optional(),
  settings: z.object({
    currency: z.string().default("IDR"),
    timezone: z.string().default("Asia/Jakarta"),
    language: z.string().default("id"),
    theme: z.string().default("light"),
    notifications: z.boolean().default(true),
    email_notifications: z.boolean().default(true),
    sms_notifications: z.boolean().default(false),
    auto_accept_orders: z.boolean().default(false),
    require_phone_verification: z.boolean().default(false),
    allow_guest_checkout: z.boolean().default(true),
    minimum_order_amount: z.number().min(0, "Minimum order tidak boleh negatif").default(0),
    delivery_fee: z.number().min(0, "Biaya pengiriman tidak boleh negatif").default(0),
    free_delivery_threshold: z.number().min(0, "Threshold gratis ongkir tidak boleh negatif").default(0),
    // Additional restaurant info fields
    rating: z.string().optional(),
    reviewCount: z.string().optional(),
    estimatedTime: z.string().optional(),
    distance: z.string().optional(),
    isOpen: z.boolean().default(true),
  }).optional(),
});

export const platformSettingsSchema = z.object({
  platform_name: z.string().min(1, "Nama platform harus diisi").max(100, "Nama platform terlalu panjang"),
  platform_description: z.string().max(500, "Deskripsi platform terlalu panjang").optional(),
  platform_url: z.string().url("URL platform tidak valid").optional().or(z.literal("")),
  support_email: z.string().email("Email support tidak valid").optional().or(z.literal("")),
  admin_email: z.string().email("Email admin tidak valid").optional().or(z.literal("")),
  maintenance_mode: z.boolean().default(false),
  registration_enabled: z.boolean().default(true),
  email_verification_required: z.boolean().default(true),
  max_tenants_per_user: z.number().min(1, "Max tenants harus minimal 1").default(1),
  default_tenant_settings: z.object({
    currency: z.string().default("IDR"),
    timezone: z.string().default("Asia/Jakarta"),
    language: z.string().default("id"),
    theme: z.string().default("light"),
  }).optional(),
  email_settings: z.object({
    provider: z.string().default("smtp"),
    smtp_host: z.string().max(100, "SMTP host terlalu panjang").optional(),
    smtp_port: z.number().min(1, "SMTP port harus minimal 1").max(65535, "SMTP port terlalu besar").default(587),
    smtp_username: z.string().max(100, "SMTP username terlalu panjang").optional(),
    smtp_password: z.string().max(200, "SMTP password terlalu panjang").optional(),
    from_name: z.string().max(100, "From name terlalu panjang").default("Simple POS"),
    from_email: z.string().email("From email tidak valid").default("noreply@simplepos.com"),
  }).optional(),
  security_settings: z.object({
    session_timeout: z.number().min(1, "Session timeout harus minimal 1 jam").max(168, "Session timeout maksimal 168 jam").default(24),
    max_login_attempts: z.number().min(3, "Max login attempts minimal 3").max(10, "Max login attempts maksimal 10").default(5),
    password_min_length: z.number().min(6, "Password minimal 6 karakter").max(32, "Password maksimal 32 karakter").default(8),
    require_2fa: z.boolean().default(false),
    allowed_domains: z.array(z.string()).default([]),
  }).optional(),
  notification_settings: z.object({
    email_notifications: z.boolean().default(true),
    sms_notifications: z.boolean().default(false),
    push_notifications: z.boolean().default(true),
    admin_notifications: z.boolean().default(true),
  }).optional(),
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
export type GoogleSheetsConfigData = z.infer<typeof googleSheetsSettingsSchema>;
export type PlatformSettingsData = z.infer<typeof platformSettingsSchema>;
export type SuperAdminTenantFormData = z.infer<typeof superAdminTenantFormSchema>;
