import { handleTelegramUpdate } from '../../src/lib/telegram-webhook.js';

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-bot-token',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-bot-token',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const update = JSON.parse(event.body);
    
    // Get bot token from headers
    const botToken = event.headers['x-bot-token'] || event.headers['X-Bot-Token'];
    
    if (!botToken) {
      console.error('No bot token provided in webhook');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Bot token required' })
      };
    }

    console.log('🤖 Received Telegram webhook:', { update, botToken });

    const result = await handleTelegramUpdate(update, botToken);
    
    if (result.success) {
      console.log('✅ Telegram webhook processed successfully:', result);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, result })
      };
    } else {
      console.error('❌ Telegram webhook failed:', result.error);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: result.error })
      };
    }
  } catch (error) {
    console.error('❌ Telegram webhook error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      })
    };
  }
};