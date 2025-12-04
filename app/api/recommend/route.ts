import { NextResponse } from 'next/server';
import { planRecommendation } from '@/lib/planRecommendation';
import { computeQuote } from '@/lib/computeQuote';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json() as { prompt: string };

    // 1) EXTRACTION directe (simulation basique)
    const text = prompt.toLowerCase();
    
    const parsed: {
      eventType: 'wedding' | 'birthday' | 'association' | 'corporate' | 'church' | 'concert' | 'other' | null;
      guests: number | null;
      indoor: boolean | null;
      postalCode: string | null;
      city: string | null;
      dateISO: string | null;
      needs: {
        sound: boolean;
        mics: 'none' | 'filaire' | 'sansfil' | 'mixte';
        console: 'none' | 'small' | 'medium';
        dj: boolean;
        light: boolean;
      };
      notes: string | null;
    } = {
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

    // Type d'événement
    if (text.includes('mariage')) parsed.eventType = 'wedding';
    else if (text.includes('anniversaire')) parsed.eventType = 'birthday';
    else if (text.includes('corporate') || text.includes('entreprise')) parsed.eventType = 'corporate';
    else if (text.includes('église') || text.includes('culte')) parsed.eventType = 'church';
    else if (text.includes('concert')) parsed.eventType = 'concert';
    else if (text.includes('association')) parsed.eventType = 'association';

    // Nombre d'invités
    const guestMatch = text.match(/(\d+)\s*(?:personnes?|invités?|pers)/);
    if (guestMatch) parsed.guests = parseInt(guestMatch[1]);

    // Indoor/outdoor
    if (text.includes('extérieur') || text.includes('dehors') || text.includes('jardin')) parsed.indoor = false;
    else if (text.includes('intérieur') || text.includes('salle') || text.includes('dedans')) parsed.indoor = true;

    // Code postal
    const cpMatch = text.match(/(\d{5})/);
    if (cpMatch) parsed.postalCode = cpMatch[1];

    // Micros
    if (text.includes('micro')) {
      if (text.includes('sans fil') || text.includes('wireless')) parsed.needs.mics = 'sansfil';
      else if (text.includes('filaire')) parsed.needs.mics = 'filaire';
      else parsed.needs.mics = 'mixte';
    }

    // Console
    if (text.includes('dj') || text.includes('console') || text.includes('mixage')) {
      parsed.needs.console = 'small';
    }

    // DJ
    if (text.includes('dj')) parsed.needs.dj = true;

    // Lumière
    if (text.includes('lumière') || text.includes('éclairage')) parsed.needs.light = true;

    // 2) PLAN (déterministe)
    const plan = planRecommendation(parsed);

    // 3) PRIX
    const quote = computeQuote(plan.answersForPricing);

    return NextResponse.json({ plan, quote });
  } catch (error) {
    console.error('Erreur recommandation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la recommandation' },
      { status: 500 }
    );
  }
}
