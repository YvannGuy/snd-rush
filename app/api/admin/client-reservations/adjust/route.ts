import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FinalItem, ClientReservation } from '@/types/db';
import {
  computeBasePackPrice,
  computeExtrasTotal,
  computePriceTotal,
  computeBalanceAmount,
} from '@/lib/pricing';
import { buildCustomerSummary } from '@/lib/customerSummary';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * API pour ajuster une client_reservation (items finaux + prix)
 * POST /api/admin/client-reservations/adjust
 * 
 * Body:
 * {
 *   id: string,
 *   final_items: FinalItem[],
 *   admin_note?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    // Vérifier l'authentification admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email === 'yvann.guyonnet@gmail.com' ||
                    user.email === 'sndrush12@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { id, final_items, admin_note } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    if (!final_items || !Array.isArray(final_items) || final_items.length === 0) {
      return NextResponse.json({ error: 'final_items requis et doit être un tableau non vide' }, { status: 400 });
    }

    // Récupérer la réservation existante
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Valider que c'est une réservation ajustable
    const status = reservation.status?.toUpperCase();
    if (status === 'CANCELLED') {
      return NextResponse.json({ error: 'Impossible d\'ajuster une réservation annulée' }, { status: 400 });
    }

    // Calculer les nouveaux prix
    const basePackPrice = computeBasePackPrice(
      reservation.pack_key,
      reservation.start_at,
      reservation.end_at
    );

    const extrasTotal = computeExtrasTotal(final_items as FinalItem[]);
    const priceTotal = computePriceTotal(basePackPrice, extrasTotal);

    // Calculer le nouveau balance_amount
    // Si l'acompte a déjà été payé, on doit recalculer le solde en fonction du nouveau prix
    let depositPaidAmount: number | null = null;
    if (reservation.deposit_paid_at) {
      // L'acompte payé était 30% de l'ancien price_total
      const oldPriceTotal = parseFloat(reservation.price_total?.toString() || '0');
      depositPaidAmount = Math.round((oldPriceTotal * 0.3) * 100) / 100; // Arrondir à 2 décimales
    }

    const balanceAmount = computeBalanceAmount(priceTotal, depositPaidAmount);

    // Générer le customer_summary
    const customerSummary = buildCustomerSummary(
      {
        ...reservation,
        base_pack_price: basePackPrice,
        extras_total: extrasTotal,
        price_total: priceTotal,
        balance_amount: balanceAmount,
        final_items: final_items as FinalItem[],
      } as ClientReservation,
      final_items as FinalItem[]
    );

    // Préparer les données de mise à jour
    const updateData: any = {
      final_items: final_items,
      base_pack_price: basePackPrice,
      extras_total: extrasTotal,
      price_total: priceTotal,
      balance_amount: balanceAmount,
      customer_summary: customerSummary,
      final_validated_at: new Date().toISOString(), // Marquer comme validé
      updated_at: new Date().toISOString(),
    };

    // Ajouter admin_note dans notes si fourni
    if (admin_note) {
      const existingNotes = reservation.notes || '';
      const notesToAdd = admin_note.trim();
      updateData.notes = existingNotes 
        ? `${existingNotes}\n\n[Admin ${new Date().toLocaleDateString('fr-FR')}]: ${notesToAdd}`
        : `[Admin ${new Date().toLocaleDateString('fr-FR')}]: ${notesToAdd}`;
    }

    // Mettre à jour la réservation
    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from('client_reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour réservation:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour', message: updateError.message }, { status: 500 });
    }

    // Retourner la réservation mise à jour
    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      pricing: {
        base_pack_price: basePackPrice,
        extras_total: extrasTotal,
        price_total: priceTotal,
        balance_amount: balanceAmount,
        deposit_amount: reservation.deposit_amount,
      },
      customer_summary: customerSummary,
    });
  } catch (error: any) {
    console.error('Erreur API adjust client_reservation:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      message: error.message 
    }, { status: 500 });
  }
}
