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

    if ((!productId && !packId) || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'productId ou packId, startDate et endDate sont requis' },
        { status: 400 }
      );
    }

    return await checkAvailability(productId || null, packId || null, startDate, endDate);
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
    const { productId, packId, startDate, endDate } = body;

    if ((!productId && !packId) || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'productId ou packId, startDate et endDate sont requis' },
        { status: 400 }
      );
    }

    return await checkAvailability(productId || null, packId || null, startDate, endDate);
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
  endDate: string
) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase non configuré' },
      { status: 500 }
    );
  }

  // Pour les packs, on utilise une quantité par défaut (1 pack disponible)
  // Pour les produits, on récupère depuis la table products
  let totalQuantity = 1; // Par défaut pour les packs

  if (productId) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
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
  let query = supabase
    .from('reservations')
    .select('quantity')
    .eq('status', 'CONFIRMED')
    .lt('start_date', endDate) // start_date < endDate
    .gt('end_date', startDate); // end_date > startDate

  if (productId) {
    query = query.eq('product_id', productId);
  } else if (packId) {
    query = query.eq('pack_id', packId);
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
  const bookedQuantity = reservations?.reduce((sum, res) => sum + res.quantity, 0) || 0;

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

