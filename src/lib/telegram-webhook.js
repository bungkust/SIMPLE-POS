import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fheaayyooebdsppcymce.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoZWFheXlvb2ViZHNwcGN5bWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzEsImV4cCI6MjA1MDU1MDg3MX0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Send a message to Telegram using the Bot API
 */
async function sendTelegramMessage(botToken, chatId, message, parseMode = 'HTML') {
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
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Format registration confirmation message
 */
function formatRegistrationMessage(tenantData, isNew) {
  const status = isNew ? '✅ Berhasil terdaftar!' : '✅ Sudah terdaftar sebelumnya';
  
  return `🤖 <b>${status}</b>\n\n` +
         `🏪 <b>${tenantData.name}</b>\n` +
         `📱 Anda akan menerima notifikasi order dari toko ini.\n\n` +
         `💡 <b>Perintah yang tersedia:</b>\n` +
         `• /status - Cek status pendaftaran\n` +
         `• /stop - Berhenti menerima notifikasi\n\n` +
         `⏰ <i>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</i>`;
}

/**
 * Format an unsubscription confirmation message
 */
function formatUnsubscriptionMessage(tenantData) {
  return `🤖 <b>Berhenti Berlangganan</b>\n\n` +
         `🏪 <b>${tenantData.name}</b>\n` +
         `❌ Anda tidak akan lagi menerima notifikasi order dari toko ini.\n\n` +
         `💡 Ketik /start untuk mendaftar kembali.\n\n` +
         `⏰ <i>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</i>`;
}

/**
 * Format a simple test message for bot verification
 */
function formatTestMessage(tenantData) {
  return `🤖 <b>Bot Telegram Terhubung!</b>\n\n` +
         `🏪 <b>${tenantData.name}</b>\n` +
         `✅ Bot berhasil dikonfigurasi dan siap menerima notifikasi order.\n\n` +
         `📱 Anda akan menerima notifikasi untuk:\n` +
         `• Order dari menu online\n` +
         `• Order dari kasir\n\n` +
         `⏰ <i>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</i>`;
}

/**
 * Handle incoming Telegram webhook updates
 */
async function handleTelegramUpdate(update, botToken) {
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
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Handle /start command - register user for notifications
 */
async function handleStartCommand(chatId, from, tenantId, tenantData, botToken) {
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
      error: error.message || 'Unknown error',
      chatId,
      tenantId 
    };
  }
}

/**
 * Handle /status command - show registration status
 */
async function handleStatusCommand(chatId, tenantId, tenantData, botToken) {
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
      error: error.message || 'Unknown error',
      chatId,
      tenantId 
    };
  }
}

/**
 * Handle /stop command - unsubscribe user from notifications
 */
async function handleStopCommand(chatId, tenantId, tenantData, botToken) {
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
      error: error.message || 'Unknown error',
      chatId,
      tenantId 
    };
  }
}

/**
 * Handle /test command - send test notification
 */
async function handleTestCommand(chatId, tenantData, botToken) {
  try {
    const message = formatTestMessage(tenantData);
    await sendTelegramMessage(botToken, chatId, message);
    return { success: true, chatId };
  } catch (error) {
    console.error('Error in handleTestCommand:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      chatId 
    };
  }
}

/**
 * Handle unknown commands
 */
async function handleUnknownCommand(chatId, botToken) {
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
async function getActiveSubscribers(tenantId) {
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
async function deactivateSubscriber(tenantId, chatId) {
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
      error: error.message || 'Unknown error',
    };
  }
}

export {
  handleTelegramUpdate,
  getActiveSubscribers,
  deactivateSubscriber
};
