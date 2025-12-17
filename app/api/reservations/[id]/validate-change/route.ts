import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { data: reservation, error: fetchError } = await supabase
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

    // Vérifier que le statut est bien CHANGE_REQUESTED
    if (reservation.status !== 'CHANGE_REQUESTED') {
      return NextResponse.json(
        { error: 'Reservation status is not CHANGE_REQUESTED' },
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
      // Approuver la modification : appliquer les changements et revenir à CONFIRMED
      const changeRequest = existingNotes.changeRequest || {};
      const requestedChanges = changeRequest.requestedChanges || {};

      // Appliquer les modifications demandées
      if (requestedChanges.nouveauLieu) {
        updateData.address = requestedChanges.nouveauLieu;
      }
      if (requestedChanges.nouveauxHoraires) {
        // Les horaires peuvent être stockés dans notes
        updateData.notes = JSON.stringify({
          ...existingNotes,
          changeRequest: {
            ...changeRequest,
            approvedAt: new Date().toISOString(),
            approvedBy: 'admin',
          },
          startTime: requestedChanges.nouveauxHoraires.split('-')[0]?.trim(),
          endTime: requestedChanges.nouveauxHoraires.split('-')[1]?.trim(),
        });
      } else {
        updateData.notes = JSON.stringify({
          ...existingNotes,
          changeRequest: {
            ...changeRequest,
            approvedAt: new Date().toISOString(),
            approvedBy: 'admin',
          },
        });
      }

      // Revenir au statut CONFIRMED
      updateData.status = 'CONFIRMED';
    } else {
      // Rejeter la modification : revenir au statut précédent (ou CONFIRMED par défaut)
      const previousStatus = existingNotes.changeRequest?.previousStatus || 'CONFIRMED';
      updateData.status = previousStatus;
      
      // Stocker les détails du rejet
      updateData.notes = JSON.stringify({
        ...existingNotes,
        changeRequest: {
          ...existingNotes.changeRequest,
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
    console.error('Error in validate-change:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
