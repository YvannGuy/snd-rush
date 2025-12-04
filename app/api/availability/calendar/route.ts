import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API pour récupérer les plages de dates bloquées pour un produit sur un mois donné
 * 
 * GET /api/availability/calendar?productId=xxx&month=2025-06
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const packId = searchParams.get('packId');
    const month = searchParams.get('month'); // Format: YYYY-MM

    if ((!productId && !packId) || !month) {
      return NextResponse.json(
        { error: 'productId ou packId, et month sont requis' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase non configuré' },
        { status: 500 }
      );
    }

    // Calculer le début et la fin du mois
    const [year, monthNum] = month.split('-').map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(year, monthNum, 0).toISOString().split('T')[0]; // Dernier jour du mois

    // Récupérer toutes les réservations confirmées pour ce produit/pack dans ce mois
    let query = supabase
      .from('reservations')
      .select('start_date, end_date, quantity')
      .eq('status', 'CONFIRMED')
      .lte('start_date', endOfMonth) // Commence avant ou pendant le mois
      .gte('end_date', startOfMonth); // Se termine après ou pendant le mois

    if (productId) {
      query = query.eq('product_id', productId);
    } else if (packId) {
      query = query.eq('pack_id', packId);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du calendrier' },
        { status: 500 }
      );
    }

    // Récupérer la quantité totale (produit ou pack par défaut = 1)
    let totalQuantity = 1;
    if (productId) {
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();

      if (product) {
        totalQuantity = product.quantity;
      }
    }

    // Grouper les réservations par date et calculer la disponibilité par jour
    // Pour simplifier, on retourne les plages où le produit est complètement indisponible
    const disabledRanges: Array<{ start: string; end: string }> = [];

    if (reservations && reservations.length > 0) {
      // Trier par date de début
      const sortedReservations = [...reservations].sort((a, b) => 
        a.start_date.localeCompare(b.start_date)
      );

      // Pour chaque jour du mois, vérifier si le produit est disponible
      // Si la quantité réservée >= quantité totale, la date est bloquée
      const dateMap = new Map<string, number>();

      sortedReservations.forEach(res => {
        const start = new Date(res.start_date);
        const end = new Date(res.end_date);
        
        // Parcourir chaque jour de la réservation
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const current = dateMap.get(dateStr) || 0;
          dateMap.set(dateStr, current + res.quantity);
        }
      });

      // Créer des plages de dates bloquées (où quantité réservée >= quantité totale)
      let currentRangeStart: string | null = null;

      for (let d = new Date(startOfMonth); d <= new Date(endOfMonth); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const bookedQty = dateMap.get(dateStr) || 0;
        const isBlocked = bookedQty >= product.quantity;

        if (isBlocked) {
          if (!currentRangeStart) {
            currentRangeStart = dateStr;
          }
        } else {
          if (currentRangeStart) {
            // Fin de la plage bloquée
            disabledRanges.push({
              start: currentRangeStart,
              end: dateStr // Date exclue
            });
            currentRangeStart = null;
          }
        }
      }

      // Si on termine sur une plage bloquée
      if (currentRangeStart) {
        const lastDay = new Date(endOfMonth);
        lastDay.setDate(lastDay.getDate() + 1);
        disabledRanges.push({
          start: currentRangeStart,
          end: lastDay.toISOString().split('T')[0]
        });
      }
    }

    return NextResponse.json({
      disabledRanges,
      month
    });
  } catch (error) {
    console.error('Erreur API calendar:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du calendrier' },
      { status: 500 }
    );
  }
}

