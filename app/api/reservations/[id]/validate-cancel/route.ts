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
    const { action } = body; // 'approve' ou 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Doit être "approve" ou "reject"' },
        { status: 400 }
      );
    }

    // Récupérer la réservation
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
    }
    const { data: reservation, error: fetchError } = await supabase!
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Vérifier que le statut est bien CANCEL_REQUESTED
    if (reservation.status !== 'CANCEL_REQUESTED') {
      return NextResponse.json(
        { error: 'Reservation status is not CANCEL_REQUESTED' },
        { status: 400 }
      );
    }

    const existingNotes = reservation.notes 
      ? (typeof reservation.notes === 'string' ? JSON.parse(reservation.notes) : reservation.notes) 
      : {};

    let updateData: any = {
      updated_at: new Date().toISOString(),
      // Préserver les heures de retrait et de retour si elles existent
      pickup_time: reservation.pickup_time || null,
      return_time: reservation.return_time || null,
    };

    if (action === 'approve') {
      // Approuver l'annulation : changer le statut à CANCELLED
      updateData.status = 'CANCELLED';
      
      // Stocker les détails de l'approbation
      updateData.notes = JSON.stringify({
        ...existingNotes,
        cancelRequest: {
          ...existingNotes.cancelRequest,
          approvedAt: new Date().toISOString(),
          approvedBy: 'admin', // Vous pouvez récupérer l'ID de l'admin si nécessaire
        },
      });
    } else {
      // Rejeter l'annulation : revenir au statut précédent (ou CONFIRMED par défaut)
      // On peut stocker le statut précédent dans les notes lors de la demande
      const previousStatus = existingNotes.cancelRequest?.previousStatus || 'CONFIRMED';
      updateData.status = previousStatus;
      
      // Stocker les détails du rejet
      updateData.notes = JSON.stringify({
        ...existingNotes,
        cancelRequest: {
          ...existingNotes.cancelRequest,
          rejectedAt: new Date().toISOString(),
          rejectedBy: 'admin',
        },
      });
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
      action: action === 'approve' ? 'approved' : 'rejected',
    });
  } catch (error: any) {
    console.error('Error in validate-cancel:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
