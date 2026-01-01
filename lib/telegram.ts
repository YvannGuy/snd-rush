/**
 * Envoie un message Telegram via l'API Bot
 * Ne lance jamais d'erreur si les variables d'environnement sont manquantes
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log('[telegram] Tentative envoi message');
  console.log('[telegram] TELEGRAM_BOT_TOKEN présent?', !!token);
  console.log('[telegram] TELEGRAM_CHAT_ID présent?', !!chatId);
  console.log('[telegram] Chat ID:', chatId || 'MANQUANT');

  if (!token || !chatId) {
    console.warn('[telegram] missing env - TELEGRAM_BOT_TOKEN:', !!token, 'TELEGRAM_CHAT_ID:', !!chatId);
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  console.log('[telegram] Envoi vers:', url.replace(token, 'TOKEN_MASQUE'));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const responseText = await response.text();
  console.log('[telegram] Réponse API:', response.status, responseText.substring(0, 200));

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status} - ${responseText}`);
  }

  console.log('[telegram] ✅ Message envoyé avec succès');
}

