// Vercel Serverless Function
// Receives pushup results from the mini app and sends a text message
// to the bot's DM chat so OpenClaw sees it as a normal message.

export default async function handler(req, res) {
  // CORS headers for the mini app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chat_id, user_id, user_name, reps, duration_seconds } = req.body;

    if (!chat_id || reps === undefined) {
      return res.status(400).json({ error: 'Missing chat_id or reps' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'BOT_TOKEN not configured' });
    }

    // Format a natural text message that OpenClaw will understand
    const minutes = Math.floor(duration_seconds / 60);
    const seconds = duration_seconds % 60;
    const timeStr = minutes > 0
      ? `${minutes}min${seconds > 0 ? ` ${seconds}s` : ''}`
      : `${seconds}s`;

    const message = `✅ ${user_name || 'Un Vulture'} vient de faire ${reps} pompes en ${timeStr} via la mini app.`;

    // Send as a regular text message from the bot to the chat
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const tgResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat_id,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const tgResult = await tgResponse.json();

    if (!tgResult.ok) {
      console.error('Telegram API error:', tgResult);
      return res.status(502).json({ error: 'Telegram API error', details: tgResult.description });
    }

    return res.status(200).json({ success: true, message_id: tgResult.result.message_id });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
