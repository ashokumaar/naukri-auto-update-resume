const fetch = require('node-fetch');

async function sendTelegram(message) {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    console.log("⚠️ Telegram not configured");
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });

    console.log("📩 Telegram alert sent");
  } catch (err) {
    console.log("❌ Telegram failed:", err.message);
  }
}

module.exports = sendTelegram;