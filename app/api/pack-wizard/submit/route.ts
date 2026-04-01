import { NextRequest, NextResponse } from 'next/server';
import { checkContactRateLimit, getClientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request);
  const { success } = await checkContactRateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { eventType, peopleCount, location, ambiance, phoneNumber, pack, language } = body;

    // Validation
    if (!eventType || !peopleCount || !location || !ambiance || !phoneNumber || !pack) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Préparer le message Telegram
    const eventTypeMap: Record<string, string> = {
      soiree: language === 'fr' ? 'Soirée' : 'Party',
      conference: language === 'fr' ? 'Conférence' : 'Conference',
      mariage: language === 'fr' ? 'Mariage' : 'Wedding',
      autre: language === 'fr' ? 'Autre' : 'Other'
    };

    const locationMap: Record<string, string> = {
      interieur: language === 'fr' ? 'Intérieur' : 'Indoor',
      exterieur: language === 'fr' ? 'Extérieur' : 'Outdoor'
    };

    const ambianceMap: Record<string, string> = {
      douce: language === 'fr' ? 'Musique douce' : 'Soft music',
      dansante: language === 'fr' ? 'Musique dansante' : 'Dancing music'
    };

    const message = `🎯 *Nouvelle demande Pack Wizard*

📅 *Type d'événement:* ${eventTypeMap[eventType] || eventType || 'Autre (personnalisé)'}
👥 *Nombre de personnes:* ${peopleCount}
🏠 *Lieu:* ${locationMap[location] || location}
🎵 *Ambiance:* ${ambianceMap[ambiance] || ambiance}
📦 *Pack recommandé:* ${pack}
📱 *Téléphone:* ${phoneNumber}

_Date: ${new Date().toLocaleString('fr-FR')}_`;

    // Envoyer sur Telegram
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (telegramBotToken && telegramChatId) {
      const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      
      await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    } else {
      console.log('Telegram non configuré. Message:', message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur pack wizard:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
