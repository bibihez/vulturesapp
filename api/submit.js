// Vercel Serverless Function
// Receives pushup results from the mini app and sends a text message
// to the bot DM so OpenClaw sees it as a normal message.

module.exports = async function handler(req, res) {
// CORS
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
return res.status(200).end();
}

if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

try {
var body = req.body;
var chat_id = body.chat_id;
var user_id = body.user_id;
var user_name = body.user_name;
var repCount = body.reps;
var duration = body.duration_seconds;

```
if (!chat_id || repCount === undefined) {
  return res.status(400).json({ error: 'Missing chat_id or reps' });
}

var BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  return res.status(500).json({ error: 'BOT_TOKEN not configured' });
}

// Format message
var minutes = Math.floor(duration / 60);
var seconds = duration % 60;
var timeStr = minutes > 0
  ? minutes + 'min' + (seconds > 0 ? ' ' + seconds + 's' : '')
  : seconds + 's';

var message = '✅ ' + (user_name || 'Un Vulture') + ' vient de faire ' + repCount + ' pompes en ' + timeStr + ' via la mini app.';

// Send as regular text message via Telegram Bot API
var telegramUrl = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
var tgResponse = await fetch(telegramUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chat_id,
    text: message,
    parse_mode: 'HTML'
  })
});

var tgResult = await tgResponse.json();

if (!tgResult.ok) {
  console.error('Telegram API error:', tgResult);
  return res.status(502).json({ error: 'Telegram API error', details: tgResult.description });
}

return res.status(200).json({ success: true, message_id: tgResult.result.message_id });
```

} catch (err) {
console.error(‘Submit error:’, err);
return res.status(500).json({ error: ‘Internal server error’ });
}
};