require('dotenv').config();


const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_CHAT_ID = process.env.TELEGRAM_CHANNEL_CHAT_ID;

async function sendMessage(req, res) {
    const fetch = (await import('node-fetch')).default;
  const { chatId, message } = req.body;

  const targetChatId = chatId || CHANNEL_CHAT_ID;

  if (!targetChatId || !BOT_TOKEN) {
    return res.status(500).json({ error: 'Bot token or chat ID is not configured.' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const params = {
    chat_id: targetChatId,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (data.ok) {
      return res.status(200).json({ message: 'Message sent successfully', result: data.result });
    } else {
      return res.status(500).json({ error: 'Failed to send message', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error sending message', details: error.message });
  }
}

module.exports = {
  sendMessage,
};
