import { NextResponse } from 'next/server';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/aiExtractionPrompt';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json() as { prompt: string };

    // Pour l'instant, on simule l'extraction avec des valeurs par défaut
    // TODO: Intégrer OpenAI quand disponible
    const extracted = {
      eventType: null,
      guests: null,
      indoor: null,
      postalCode: null,
      city: null,
      dateISO: null,
      needs: {
        sound: true,
        mics: 'none' as const,
        console: 'none' as const,
        dj: false,
        light: false
      },
      notes: null
    };

    // Simulation basique d'extraction basée sur des mots-clés
    const text = prompt.toLowerCase();
    
    // Type d'événement
    if (text.includes('mariage')) extracted.eventType = 'wedding';
    else if (text.includes('anniversaire')) extracted.eventType = 'birthday';
    else if (text.includes('corporate') || text.includes('entreprise')) extracted.eventType = 'corporate';
    else if (text.includes('église') || text.includes('culte')) extracted.eventType = 'church';
    else if (text.includes('concert')) extracted.eventType = 'concert';
    else if (text.includes('association')) extracted.eventType = 'association';

    // Nombre d'invités
    const guestMatch = text.match(/(\d+)\s*(?:personnes?|invités?|pers)/);
    if (guestMatch) extracted.guests = parseInt(guestMatch[1]);

    // Indoor/outdoor
    if (text.includes('extérieur') || text.includes('dehors') || text.includes('jardin')) extracted.indoor = false;
    else if (text.includes('intérieur') || text.includes('salle') || text.includes('dedans')) extracted.indoor = true;

    // Code postal
    const cpMatch = text.match(/(\d{5})/);
    if (cpMatch) extracted.postalCode = cpMatch[1];

    // Micros
    if (text.includes('micro')) {
      if (text.includes('sans fil') || text.includes('wireless')) extracted.needs.mics = 'sansfil';
      else if (text.includes('filaire')) extracted.needs.mics = 'filaire';
      else extracted.needs.mics = 'mixte';
    }

    // Console
    if (text.includes('dj') || text.includes('console') || text.includes('mixage')) {
      extracted.needs.console = 'small';
    }

    // DJ
    if (text.includes('dj')) extracted.needs.dj = true;

    // Lumière
    if (text.includes('lumière') || text.includes('éclairage')) extracted.needs.light = true;

    return NextResponse.json(extracted);
  } catch (error) {
    console.error('Erreur extraction:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'extraction' },
      { status: 500 }
    );
  }
}
