import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API pour vérifier la disponibilité d'un produit sur une période donnée
 * 
 * GET /api/availability?productId=xxx&startDate=2025-06-10&endDate=2025-06-12
 * ou
 * POST /api/availability avec body { productId, startDate, endDate }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const packId = searchParams.get('packId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const startTime = searchParams.get('startTime') || null;
    const endTime = searchParams.get('endTime') || null;

    if ((!productId && !packId) || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'productId ou packId, startDate et endDate sont requis' },
        { status: 400 }
      );
    }

    return await checkAvailability(productId || null, packId || null, startDate, endDate, startTime, endTime);
  } catch (error) {
    console.error('Erreur API availability:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la vérification de disponibilité' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, packId, startDate, endDate, startTime, endTime } = body;

    if ((!productId && !packId) || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'productId ou packId, startDate et endDate sont requis' },
        { status: 400 }
      );
    }

    return await checkAvailability(productId || null, packId || null, startDate, endDate, startTime || null, endTime || null);
  } catch (error) {
    console.error('Erreur API availability:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la vérification de disponibilité' },
      { status: 500 }
    );
  }
}

async function checkAvailability(
  productId: string | null,
  packId: string | null,
  startDate: string,
  endDate: string,
  startTime: string | null = null,
  endTime: string | null = null
) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase non configuré' },
      { status: 500 }
    );
  }

  // Vérifier si productId est un UUID valide ou un ID numérique (pack)
  const isUUID = productId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) : false;
  const isPackId = productId ? !isUUID : false;
  
  // Si productId est numérique, c'est probablement un packId
  const actualPackId = isPackId ? productId : packId;
  const actualProductId = isUUID ? productId : null;

  // Pour les packs, on utilise une quantité par défaut (1 pack disponible)
  // Pour les produits, on récupère depuis la table products
  let totalQuantity = 1; // Par défaut pour les packs

  if (actualProductId) {
    // Seulement si c'est un vrai UUID de produit
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', actualProductId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    totalQuantity = product.quantity;
  }

  // 2. Récupérer toutes les réservations confirmées qui se chevauchent avec la période demandée
  // Si les heures sont fournies, on doit vérifier les chevauchements temporels plus précisément
  let query = supabase
    .from('reservations')
    .select('quantity, start_date, end_date, notes')
    .eq('status', 'CONFIRMED')
    .lt('start_date', endDate) // start_date < endDate
    .gt('end_date', startDate); // end_date > startDate

  if (actualProductId) {
    query = query.eq('product_id', actualProductId);
  } else if (actualPackId) {
    query = query.eq('pack_id', actualPackId);
  }

  const { data: reservations, error: reservationsError } = await query;

  if (reservationsError) {
    console.error('Erreur Supabase:', reservationsError);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réservations' },
      { status: 500 }
    );
  }

  // Fonction helper pour convertir une heure (HH:MM) en minutes
  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  // Fonction pour vérifier si deux périodes avec heures se chevauchent
  function timeRangesOverlap(
    reqStartDate: string, reqEndDate: string, reqStartTime: string | null, reqEndTime: string | null,
    resStartDate: string, resEndDate: string, resStartTime: string | null, resEndTime: string | null
  ): boolean {
    // Si les dates ne se chevauchent pas du tout, pas de chevauchement
    if (reqEndDate < resStartDate || reqStartDate > resEndDate) {
      return false;
    }

    // Si les dates se chevauchent mais qu'aucune heure n'est fournie, considérer comme chevauchement
    if (!reqStartTime || !reqEndTime || !resStartTime || !resEndTime) {
      return true; // Chevauchement par défaut si heures manquantes
    }

    // Cas 1: Même jour de début et de fin
    if (reqStartDate === reqEndDate && resStartDate === resEndDate && reqStartDate === resStartDate) {
      const reqStart = timeToMinutes(reqStartTime);
      const reqEnd = timeToMinutes(reqEndTime);
      const resStart = timeToMinutes(resStartTime);
      const resEnd = timeToMinutes(resEndTime);
      // Chevauchement si les périodes horaires se chevauchent
      return !(reqEnd <= resStart || reqStart >= resEnd);
    }

    // Cas 2: Dates qui se chevauchent - vérifier les heures du premier jour commun
    // Si la demande commence le même jour qu'une réservation existante
    if (reqStartDate === resStartDate) {
      const reqStart = timeToMinutes(reqStartTime);
      const reqEnd = timeToMinutes(reqEndTime);
      const resStart = timeToMinutes(resStartTime);
      const resEnd = timeToMinutes(resEndTime);
      
      // Si les heures du premier jour se chevauchent, c'est un chevauchement
      if (!(reqEnd <= resStart || reqStart >= resEnd)) {
        return true;
      }
      
      // Si la demande commence après la fin de la réservation ce jour-là et que c'est le dernier jour de la réservation
      if (reqStart >= resEnd && resEndDate === resStartDate) {
        return false; // Pas de chevauchement
      }
    }

    // Cas 3: Si la demande se termine le même jour qu'une réservation commence
    if (reqEndDate === resStartDate && reqEndDate === resStartDate) {
      const reqEnd = timeToMinutes(reqEndTime);
      const resStart = timeToMinutes(resStartTime);
      // Si la demande se termine avant que la réservation ne commence, pas de chevauchement
      if (reqEnd <= resStart) {
        return false;
      }
    }

    // Si les dates se chevauchent mais qu'on n'a pas pu déterminer avec les heures,
    // considérer comme chevauchement par sécurité
    return true;
  }

  // 3. Calculer la quantité déjà réservée
  // Si les heures sont fournies, vérifier les chevauchements temporels précis
  let bookedQuantity = 0;
  
  if (reservations) {
    for (const res of reservations) {
      // Récupérer les heures de la réservation depuis les notes
      let resStartTime = null;
      let resEndTime = null;
      
      if (res.notes) {
        try {
          const notesData = JSON.parse(res.notes);
          resStartTime = notesData.startTime || null;
          resEndTime = notesData.endTime || null;
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }

      // Vérifier le chevauchement avec prise en compte des heures
      const hasOverlap = timeRangesOverlap(
        startDate, endDate, startTime, endTime,
        res.start_date, res.end_date, resStartTime, resEndTime
      );

      if (hasOverlap) {
        bookedQuantity += res.quantity;
      }
    }
  }

  // 4. Calculer la disponibilité
  const remaining = totalQuantity - bookedQuantity;
  const available = remaining > 0;

  return NextResponse.json({
    available,
    remaining: Math.max(0, remaining),
    bookedQuantity,
    totalQuantity
  });
}

