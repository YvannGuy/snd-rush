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

  // 3. Calculer la quantité déjà réservée
  // Si les heures sont fournies, vérifier les chevauchements temporels précis
  let bookedQuantity = 0;
  
  if (reservations) {
    for (const res of reservations) {
      // Si même jour et heures fournies, vérifier le chevauchement horaire
      if (startTime && endTime && res.start_date === startDate && res.end_date === endDate) {
        try {
          // Récupérer les heures de la réservation depuis les notes ou metadata
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
          
          // Si les heures sont définies pour cette réservation, vérifier le chevauchement
          if (resStartTime && resEndTime) {
            // Convertir les heures en minutes pour faciliter la comparaison
            const requestedStart = timeToMinutes(startTime);
            const requestedEnd = timeToMinutes(endTime);
            const reservedStart = timeToMinutes(resStartTime);
            const reservedEnd = timeToMinutes(resEndTime);
            
            // Vérifier si les périodes se chevauchent
            if (!(requestedEnd <= reservedStart || requestedStart >= reservedEnd)) {
              // Il y a chevauchement, compter cette réservation
              bookedQuantity += res.quantity;
            }
          } else {
            // Si pas d'heures pour cette réservation, considérer qu'elle occupe toute la journée
            bookedQuantity += res.quantity;
          }
        } catch (e) {
          // En cas d'erreur, compter la réservation par sécurité
          bookedQuantity += res.quantity;
        }
      } else {
        // Si pas le même jour ou pas d'heures, compter normalement
        bookedQuantity += res.quantity;
      }
    }
  }
  
  // Fonction helper pour convertir une heure (HH:MM) en minutes
  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
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

