const fs = require('fs');
const readline = require('readline');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("🤖 Telegram Webhook Setup\n");

rl.question("Enter your Telegram Bot Token: ", (botToken) => {
  if (!botToken) {
    console.error("Bot token is required!");
    rl.close();
    return;
  }

  rl.question("Enter your Supabase Project URL (e.g. https://xyz.supabase.co): ", (supabaseUrl) => {
    if (!supabaseUrl) {
       console.error("Supabase URL is required!");
       rl.close();
       return;
    }

    const webhookUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/telegram-webhook`;
    const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`;

    console.log(`\nSetting webhook to: ${webhookUrl}`);
    
    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log("✅ Webhook successfully set!");
            console.log("\n⚠️ IMPORTANT: Don't forget to add the TELEGRAM_BOT_TOKEN to your Supabase Edge Functions secrets.");
            console.log("Run this command in your terminal:");
            console.log(`supabase secrets set TELEGRAM_BOT_TOKEN="${botToken}"`);
          } else {
            console.error("❌ Failed to set webhook:", result.description);
          }
        } catch(e) {
          console.error("Error parsing response:", data);
        }
        rl.close();
      });
    }).on('error', (err) => {
      console.error("❌ Error setting webhook:", err.message);
      rl.close();
    });
  });
});
