import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateRefundPolicy } from '@/lib/reservationStatus';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = id;
    const body = await request.json();
    const { reservationId: bodyReservationId, requestedAt, reason, refundPolicyApplied, refundEstimateAmount } = body;

    // Vérifier que l'ID correspond
    if (bodyReservationId !== reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID mismatch' },
        { status: 400 }
      );
    }

    // Récupérer la réservation pour vérifier l'utilisateur
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
    }
    const { data: reservation, error: fetchError } = await supabase!
      .from('reservations')
      .select('*, user_id')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Vérifier l'authentification (doit être fait côté client avec le token)
    // Ici on fait confiance que l'utilisateur est authentifié via middleware ou vérification token
    // Pour plus de sécurité, vous pouvez ajouter une vérification du token JWT

    // Vérifier que l'événement n'est pas dans le passé
    const eventDate = new Date(reservation.start_date);
    const now = new Date();
    if (eventDate < now) {
      return NextResponse.json(
        { error: 'Cannot cancel past events' },
        { status: 400 }
      );
    }

    // Vérifier que le statut permet l'annulation
    const status = reservation.status?.toUpperCase();
    const forbiddenStatuses = ['CANCELLED', 'CANCELED', 'CANCEL_REQUESTED', 'COMPLETED'];
    if (forbiddenStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Reservation cannot be cancelled' },
        { status: 400 }
      );
    }

    // Recalculer la politique côté serveur pour sécurité
    const { policy: serverPolicy } = calculateRefundPolicy(eventDate);
    if (serverPolicy !== refundPolicyApplied) {
      console.warn('Refund policy mismatch, using server calculation');
    }

    // Mettre à jour la réservation
    // Stocker les métadonnées dans notes JSON pour éviter les problèmes de colonnes manquantes
    const existingNotes = reservation.notes 
      ? (typeof reservation.notes === 'string' ? JSON.parse(reservation.notes) : reservation.notes) 
      : {};
    
    const updateData: any = {
      status: 'CANCEL_REQUESTED',
      updated_at: new Date().toISOString(),
      notes: JSON.stringify({
        ...existingNotes,
        cancelRequest: {
          requestedAt: requestedAt || new Date().toISOString(),
          reason: reason || null,
          refundPolicyApplied: serverPolicy,
          refundEstimateAmount: refundEstimateAmount || null,
          previousStatus: reservation.status, // Stocker le statut précédent pour pouvoir le restaurer si rejet
        },
      }),
    };

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
    }
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reservation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
    });
  } catch (error: any) {
    console.error('Error in cancel-request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
