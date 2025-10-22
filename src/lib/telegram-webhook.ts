import { supabase } from './supabase';
import { 
  sendTelegramMessage, 
  formatRegistrationMessage, 
  formatUnsubscriptionMessage,
  formatTestMessage 
} from './telegram-utils';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export interface WebhookResult {
  success: boolean;
  chatId?: string;
  error?: string;
  tenantId?: string;
}

/**
 * Handle incoming Telegram webhook updates
 */
export async function handleTelegramUpdate(
  update: TelegramUpdate,
  botToken: string
): Promise<WebhookResult> {
  try {
    // Only process message updates
    if (!update.message || !update.message.text) {
      return { success: false, error: 'No message text found' };
    }

    const message = update.message;
    const chatId = message.chat.id.toString();
    const text = message.text.trim();
    const from = message.from;

    // Find tenant by bot token
    const { data: tenant, error: tenantError } = await supabase
      .from('tenant_info')
      .select('tenant_id, tenants!inner(name, slug)')
      .eq('telegram_bot_token', botToken)
      .single();

    if (tenantError || !tenant) {
      return { 
        success: false, 
        error: 'Tenant not found for this bot token',
        chatId 
      };
    }

    const tenantId = tenant.tenant_id;
    const tenantData = {
      name: tenant.tenants.name,
      slug: tenant.tenants.slug,
    };

    // Handle different commands
    switch (text) {
      case '/start':
        return await handleStartCommand(chatId, from, tenantId, tenantData, botToken);
      
      case '/status':
        return await handleStatusCommand(chatId, tenantId, tenantData, botToken);
      
      case '/stop':
        return await handleStopCommand(chatId, tenantId, tenantData, botToken);
      
      case '/test':
        return await handleTestCommand(chatId, tenantData, botToken);
      
      default:
        return await handleUnknownCommand(chatId, botToken);
    }
  } catch (error) {
    console.error('Error handling Telegram update:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle /start command - register user for notifications
 */
async function handleStartCommand(
  chatId: string,
  from: TelegramUpdate['message']['from'],
  tenantId: string,
  tenantData: { name: string; slug: string },
  botToken: string
): Promise<WebhookResult> {
  try {
    // Check if user is already registered
    const { data: existingSubscriber } = await supabase
      .from('telegram_subscribers')
      .select('id, is_active')
      .eq('tenant_id', tenantId)
      .eq('chat_id', chatId)
      .single();

    let isNew = false;

    if (existingSubscriber) {
      if (existingSubscriber.is_active) {
        // Already registered and active
        const message = formatRegistrationMessage(tenantData, false);
        await sendTelegramMessage(botToken, chatId, message);
        return { success: true, chatId, tenantId };
      } else {
        // Reactivate existing subscription
        const { error } = await supabase
          .from('telegram_subscribers')
          .update({ 
            is_active: true,
            username: from.username,
            first_name: from.first_name,
            registered_at: new Date().toISOString()
          })
          .eq('id', existingSubscriber.id);

        if (error) throw error;
        isNew = false;
      }
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('telegram_subscribers')
        .insert({
          tenant_id: tenantId,
          chat_id: chatId,
          username: from.username,
          first_name: from.first_name,
          is_active: true,
        });

      if (error) throw error;
      isNew = true;
    }

    // Send confirmation message
    const message = formatRegistrationMessage(tenantData, isNew);
    await sendTelegramMessage(botToken, chatId, message);

    return { success: true, chatId, tenantId };
  } catch (error) {
    console.error('Error in handleStartCommand:', error);
    await sendTelegramMessage(
      botToken, 
      chatId, 
      '❌ Gagal mendaftarkan notifikasi. Silakan coba lagi nanti.'
    );
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId,
      tenantId 
    };
  }
}

/**
 * Handle /status command - show registration status
 */
async function handleStatusCommand(
  chatId: string,
  tenantId: string,
  tenantData: { name: string; slug: string },
  botToken: string
): Promise<WebhookResult> {
  try {
    const { data: subscriber } = await supabase
      .from('telegram_subscribers')
      .select('is_active, registered_at')
      .eq('tenant_id', tenantId)
      .eq('chat_id', chatId)
      .single();

    if (!subscriber) {
      await sendTelegramMessage(
        botToken,
        chatId,
        '❌ Anda belum terdaftar untuk menerima notifikasi.\n\nKetik /start untuk mendaftar.'
      );
      return { success: true, chatId, tenantId };
    }

    const status = subscriber.is_active ? '✅ Aktif' : '❌ Tidak Aktif';
    const registeredAt = subscriber.registered_at 
      ? new Date(subscriber.registered_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      : 'Tidak diketahui';

    const message = `🤖 <b>Status Notifikasi</b>\n\n` +
                   `🏪 <b>${tenantData.name}</b>\n` +
                   `📊 Status: ${status}\n` +
                   `📅 Terdaftar: ${registeredAt}\n\n` +
                   `💡 Ketik /start untuk mengaktifkan atau /stop untuk menonaktifkan.`;

    await sendTelegramMessage(botToken, chatId, message);
    return { success: true, chatId, tenantId };
  } catch (error) {
    console.error('Error in handleStatusCommand:', error);
    await sendTelegramMessage(
      botToken,
      chatId,
      '❌ Gagal memeriksa status. Silakan coba lagi nanti.'
    );
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId,
      tenantId 
    };
  }
}

/**
 * Handle /stop command - unsubscribe user from notifications
 */
async function handleStopCommand(
  chatId: string,
  tenantId: string,
  tenantData: { name: string; slug: string },
  botToken: string
): Promise<WebhookResult> {
  try {
    const { error } = await supabase
      .from('telegram_subscribers')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('chat_id', chatId);

    if (error) throw error;

    const message = formatUnsubscriptionMessage(tenantData);
    await sendTelegramMessage(botToken, chatId, message);

    return { success: true, chatId, tenantId };
  } catch (error) {
    console.error('Error in handleStopCommand:', error);
    await sendTelegramMessage(
      botToken,
      chatId,
      '❌ Gagal berhenti berlangganan. Silakan coba lagi nanti.'
    );
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId,
      tenantId 
    };
  }
}

/**
 * Handle /test command - send test notification
 */
async function handleTestCommand(
  chatId: string,
  tenantData: { name: string; slug: string },
  botToken: string
): Promise<WebhookResult> {
  try {
    const message = formatTestMessage(tenantData);
    await sendTelegramMessage(botToken, chatId, message);
    return { success: true, chatId };
  } catch (error) {
    console.error('Error in handleTestCommand:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId 
    };
  }
}

/**
 * Handle unknown commands
 */
async function handleUnknownCommand(
  chatId: string,
  botToken: string
): Promise<WebhookResult> {
  const message = `🤖 <b>Perintah Tidak Dikenal</b>\n\n` +
                 `💡 <b>Perintah yang tersedia:</b>\n` +
                 `• /start - Daftar notifikasi order\n` +
                 `• /status - Cek status pendaftaran\n` +
                 `• /stop - Berhenti notifikasi\n` +
                 `• /test - Kirim pesan test\n\n` +
                 `❓ Ketik salah satu perintah di atas.`;

  await sendTelegramMessage(botToken, chatId, message);
  return { success: true, chatId };
}

/**
 * Get active subscribers for a tenant
 */
export async function getActiveSubscribers(tenantId: string): Promise<string[]> {
  try {
    const { data: subscribers, error } = await supabase
      .from('telegram_subscribers')
      .select('chat_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;
    return subscribers?.map(s => s.chat_id) || [];
  } catch (error) {
    console.error('Error getting active subscribers:', error);
    return [];
  }
}

/**
 * Deactivate a subscriber (admin function)
 */
export async function deactivateSubscriber(
  tenantId: string,
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('telegram_subscribers')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('chat_id', chatId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
