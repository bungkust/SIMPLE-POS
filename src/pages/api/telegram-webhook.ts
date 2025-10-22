import { NextApiRequest, NextApiResponse } from 'next';
import { handleTelegramUpdate } from '@/lib/telegram-webhook';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    // Get bot token from the update (this should be set in webhook URL)
    const botToken = req.headers['x-bot-token'] as string;
    
    if (!botToken) {
      console.error('No bot token provided in webhook');
      return res.status(400).json({ error: 'Bot token required' });
    }

    console.log('🤖 Received Telegram webhook:', { update, botToken });

    const result = await handleTelegramUpdate(update, botToken);
    
    if (result.success) {
      console.log('✅ Telegram webhook processed successfully:', result);
      return res.status(200).json({ success: true, result });
    } else {
      console.error('❌ Telegram webhook failed:', result.error);
      return res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Telegram webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
