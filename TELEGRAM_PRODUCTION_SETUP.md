# Telegram Bot Production Setup Guide

## 🚀 Production Deployment Checklist

### 1. Deploy to Netlify
```bash
# Build and deploy
npm run build
# Deploy to Netlify (via Netlify CLI or Git push)
```

### 2. Set Webhook URL
After deployment, run the webhook setup script:

```bash
# Set your bot token as environment variable
export TELEGRAM_BOT_TOKEN="your_bot_token_here"

# Run the setup script
node setup-telegram-bot.js
```

**Expected output:**
```
🤖 Setting up Telegram Bot Webhook...
📡 Webhook URL: https://pos.bungkust.web.id/.netlify/functions/telegram-webhook
🔑 Bot Token: 8063411599...
✅ Webhook set successfully!
🎉 Telegram Bot is ready for production!
```

### 3. Configure in Admin Panel
1. Go to Admin Dashboard → Settings → Telegram
2. Paste your bot token
3. Add Chat IDs manually or use `/start` command
4. Enable notifications for checkout/cashier
5. Save settings

### 4. Test the Integration

#### Test Bot Commands:
- `/start` - Register for notifications
- `/status` - Check registration status  
- `/stop` - Unsubscribe from notifications
- `/test` - Send test message

#### Test Notifications:
1. Create a test order from menu browser
2. Create a test order from cashier
3. Verify notifications are received

## 🔧 Production Files Created

### Netlify Functions
- `netlify/functions/telegram-webhook.js` - Webhook endpoint for production

### Setup Scripts
- `setup-telegram-bot.js` - Automated webhook configuration

### Core Integration
- `src/lib/telegram-utils.ts` - Message formatting & sending
- `src/lib/telegram-webhook.ts` - Webhook handling (TypeScript)
- `src/lib/telegram-webhook.js` - Webhook handling (JavaScript)

## 📱 Manual Chat ID Setup

For easier setup without webhook dependency:

1. **Get Chat ID:**
   - Message your bot: `@userinfobot`
   - Copy your Chat ID (e.g., `802133779`)

2. **Add in Admin Panel:**
   - Go to Settings → Telegram
   - Paste Chat ID in "Manual Chat ID" field
   - Click "Add"
   - Save settings

## 🛠️ Troubleshooting

### Webhook Not Working
```bash
# Check webhook status
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### No Notifications
1. Verify bot token is saved in database
2. Check Chat ID is registered and active
3. Ensure notifications are enabled in settings
4. Check browser console for errors

### Database Issues
```sql
-- Check telegram settings
SELECT telegram_bot_token, telegram_notify_checkout, telegram_notify_cashier 
FROM tenant_info 
WHERE tenant_id = 'your_tenant_id';

-- Check subscribers
SELECT * FROM telegram_subscribers 
WHERE tenant_id = 'your_tenant_id' AND is_active = true;
```

## 🔒 Security Notes

- Bot token is stored in database (encrypted at rest)
- Webhook endpoint validates bot token
- CORS headers configured for production
- No sensitive data in webhook logs

## 📊 Monitoring

Monitor webhook health:
- Check Netlify Functions logs
- Monitor Telegram webhook info
- Track notification delivery rates
- Monitor database performance

## 🎯 Production URLs

- **Webhook Endpoint:** `https://pos.bungkust.web.id/.netlify/functions/telegram-webhook`
- **Admin Panel:** `https://pos.bungkust.web.id/rahasia/admin/dashboard`
- **Public Menu:** `https://pos.bungkust.web.id/rahasia`

---

**Status: ✅ READY FOR PRODUCTION**
