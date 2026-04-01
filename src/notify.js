const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { getCurrentRunLogPath } = require('./logger');

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

async function sendEmailWithAttachment(subject, summaryText) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
  const BREVO_RECEIVER_EMAIL = process.env.BREVO_RECEIVER_EMAIL;

  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !BREVO_RECEIVER_EMAIL) {
    console.log("⚠️ Brevo email not fully configured.");
    return;
  }

  const currentRunLogPath = getCurrentRunLogPath();
  let logFileContentBase64 = null;
  // Changed file extension from .log to .txt to avoid Brevo API rejection
  const attachmentFileName = `naukri_bot_logs_${new Date().toISOString().replace(/:/g, '-')}.txt`;

  console.log(`📄 Preparing email attachment from: ${currentRunLogPath}`);
  try {
    const logBuffer = fs.readFileSync(currentRunLogPath);
    if (logBuffer.length > 0) {
      logFileContentBase64 = logBuffer.toString('base64');
      console.log(`✅ Successfully read and encoded log file (${logBuffer.length} bytes).`);
    } else {
      console.log("⚠️ Log file is empty. Sending email without attachment.");
    }
  } catch (error) {
    console.error(`❌ Failed to read log file for email attachment: ${error.message}`);
  }

  const emailPayload = {
    sender: {
      name: "Naukri Auto Update Bot",
      email: BREVO_SENDER_EMAIL
    },
    to: [
      {
        email: BREVO_RECEIVER_EMAIL,
        name: "Recipient"
      }
    ],
    subject: subject,
    htmlContent: `<p>${summaryText}</p><p>${logFileContentBase64 ? 'Please find the detailed logs attached.' : 'Log file was empty or could not be read.'}</p>`,
    attachment: logFileContentBase64 ? [
      {
        content: logFileContentBase64,
        name: attachmentFileName
      }
    ] : []
  };

  console.log(logFileContentBase64 ? "📎 Sending email with attachment." : "📎 Sending email without attachment.");

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(emailPayload)
    });

    if (response.ok) {
      console.log("📩 Brevo email alert sent successfully.");
    } else {
      const errorData = await response.json();
      console.error(`❌ Brevo email failed with status ${response.status}:`, errorData);
    }
  } catch (err) {
    console.error("❌ Brevo email failed:", err.message);
  }
}

module.exports = { sendTelegram, sendEmailWithAttachment };
