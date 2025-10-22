#!/usr/bin/env node

/**
 * Setup Telegram Bot Webhook for Production
 * Run this script after deploying to set the webhook URL
 */

const https = require('https');

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WEBHOOK_URL = 'https://pos.bungkust.web.id/.netlify/functions/telegram-webhook';

async function setWebhook() {
  if (BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ Please set TELEGRAM_BOT_TOKEN environment variable');
    console.log('Usage: TELEGRAM_BOT_TOKEN=your_bot_token node setup-telegram-bot.js');
    process.exit(1);
  }

  const webhookData = {
    url: WEBHOOK_URL,
    allowed_updates: ['message'],
    drop_pending_updates: true
  };

  const postData = JSON.stringify(webhookData);

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/setWebhook`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function getWebhookInfo() {
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/getWebhookInfo`,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🤖 Setting up Telegram Bot Webhook...');
    console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
    console.log(`🔑 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);

    // Set webhook
    const setResult = await setWebhook();
    
    if (setResult.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`📝 Description: ${setResult.description || 'No description'}`);
    } else {
      console.error('❌ Failed to set webhook:', setResult.description);
      process.exit(1);
    }

    // Get webhook info to verify
    console.log('\n🔍 Verifying webhook...');
    const infoResult = await getWebhookInfo();
    
    if (infoResult.ok) {
      const info = infoResult.result;
      console.log('✅ Webhook info retrieved:');
      console.log(`   URL: ${info.url}`);
      console.log(`   Has custom certificate: ${info.has_custom_certificate}`);
      console.log(`   Pending update count: ${info.pending_update_count}`);
      console.log(`   Last error date: ${info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : 'None'}`);
      console.log(`   Last error message: ${info.last_error_message || 'None'}`);
      
      if (info.url === WEBHOOK_URL) {
        console.log('\n🎉 Telegram Bot is ready for production!');
        console.log('\n📋 Next steps:');
        console.log('1. Add bot token to tenant settings in admin panel');
        console.log('2. Test with /start command in Telegram');
        console.log('3. Create test orders to verify notifications');
      } else {
        console.error('❌ Webhook URL mismatch!');
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to get webhook info:', infoResult.description);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();