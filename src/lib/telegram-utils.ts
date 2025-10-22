import { formatCurrency } from './form-utils';

export interface TelegramConfig {
  botToken: string;
  chatIds: string[];
}

export interface OrderData {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  total: number;
  payment_method: string;
  status: string;
  notes?: string;
  created_at: string;
  order_items?: Array<{
    name_snapshot: string;
    price_snapshot: number;
    qty: number;
    notes?: string;
  }>;
}

export interface TenantData {
  name: string;
  slug: string;
  phone?: string;
  address?: string;
}

/**
 * Send a message to Telegram using the Bot API
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send order notification to all registered chat IDs
 */
export async function sendOrderNotification(
  config: TelegramConfig,
  order: OrderData,
  tenant: TenantData,
  source: 'checkout' | 'cashier'
): Promise<void> {
  const message = formatOrderMessage(order, tenant, source);
  
  // Send to all registered chat IDs
  const promises = config.chatIds.map(chatId =>
    sendTelegramMessage(config.botToken, chatId, message)
  );

  const results = await Promise.allSettled(promises);
  
  // Log any failures but don't throw
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to send Telegram notification to chat ${config.chatIds[index]}:`, result.reason);
    } else if (!result.value.success) {
      console.error(`Telegram API error for chat ${config.chatIds[index]}:`, result.value.error);
    }
  });
}

/**
 * Format order data into a Telegram message
 */
export function formatOrderMessage(
  order: OrderData,
  tenant: TenantData,
  source: 'checkout' | 'cashier'
): string {
  const sourceText = source === 'checkout' ? '🌐 <b>Order Online</b>' : '🛒 <b>Order Kasir</b>';
  const orderTime = new Date(order.created_at).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `🆕 <b>ORDER BARU</b>\n\n`;
  message += `${sourceText}\n`;
  message += `🏪 <b>${tenant.name}</b>\n`;
  message += `📅 ${orderTime}\n\n`;
  
  message += `📋 <b>Detail Order:</b>\n`;
  message += `🆔 Kode: <code>${order.order_code}</code>\n`;
  message += `👤 Customer: <b>${order.customer_name}</b>\n`;
  message += `📞 Phone: <code>${order.phone}</code>\n`;
  message += `💳 Payment: <b>${order.payment_method}</b>\n`;
  message += `💰 Total: <b>${formatCurrency(order.total)}</b>\n`;
  message += `📊 Status: <b>${order.status}</b>\n\n`;

  // Add order items if available
  if (order.order_items && order.order_items.length > 0) {
    message += `🍽️ <b>Items:</b>\n`;
    order.order_items.forEach((item, index) => {
      const itemTotal = item.price_snapshot * item.qty;
      message += `${index + 1}. ${item.name_snapshot}\n`;
      message += `   💰 ${formatCurrency(item.price_snapshot)} × ${item.qty} = <b>${formatCurrency(itemTotal)}</b>\n`;
      if (item.notes) {
        message += `   📝 Note: ${item.notes}\n`;
      }
      message += `\n`;
    });
  }

  // Add notes if available
  if (order.notes) {
    message += `📝 <b>Catatan:</b> ${order.notes}\n\n`;
  }

  // Add store contact info
  if (tenant.phone) {
    message += `📞 <b>Kontak Toko:</b> ${tenant.phone}\n`;
  }
  if (tenant.address) {
    message += `📍 <b>Alamat:</b> ${tenant.address}\n`;
  }

  message += `\n⏰ <i>Diterima pada ${orderTime}</i>`;

  return message;
}

/**
 * Format a simple test message for bot verification
 */
export function formatTestMessage(tenant: TenantData): string {
  return `🤖 <b>Bot Telegram Terhubung!</b>\n\n` +
         `🏪 <b>${tenant.name}</b>\n` +
         `✅ Bot berhasil dikonfigurasi dan siap menerima notifikasi order.\n\n` +
         `📱 Anda akan menerima notifikasi untuk:\n` +
         `• Order dari menu online\n` +
         `• Order dari kasir\n\n` +
         `⏰ <i>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</i>`;
}

/**
 * Format a registration confirmation message
 */
export function formatRegistrationMessage(tenant: TenantData, isNew: boolean): string {
  const status = isNew ? '✅ Berhasil terdaftar!' : '✅ Sudah terdaftar sebelumnya';
  
  return `🤖 <b>${status}</b>\n\n` +
         `🏪 <b>${tenant.name}</b>\n` +
         `📱 Anda akan menerima notifikasi order dari toko ini.\n\n` +
         `💡 <b>Perintah yang tersedia:</b>\n` +
         `• /status - Cek status pendaftaran\n` +
         `• /stop - Berhenti menerima notifikasi\n\n` +
         `⏰ <i>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</i>`;
}

/**
 * Format an unsubscription confirmation message
 */
export function formatUnsubscriptionMessage(tenant: TenantData): string {
  return `🤖 <b>Berhenti Berlangganan</b>\n\n` +
         `🏪 <b>${tenant.name}</b>\n` +
         `❌ Anda tidak akan lagi menerima notifikasi order dari toko ini.\n\n` +
         `💡 Ketik /start untuk mendaftar kembali.\n\n` +
         `⏰ <i>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</i>`;
}
