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
    const { reservationId: bodyReservationId, requestedAt, requestedChanges, message } = body;

    // Vérifier que l'ID correspond
    if (bodyReservationId !== reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID mismatch' },
        { status: 400 }
      );
    }

    // Vérifier que le message est présent
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
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

    // Vérifier que l'événement n'est pas dans le passé
    const eventDate = new Date(reservation.start_date);
    const now = new Date();
    if (eventDate < now) {
      return NextResponse.json(
        { error: 'Cannot modify past events' },
        { status: 400 }
      );
    }

    // Vérifier qu'il reste au moins 5 jours (selon CGV)
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 5) {
      return NextResponse.json(
        { error: 'Modifications must be requested at least 5 days before the event' },
        { status: 400 }
      );
    }

    // Vérifier que le statut permet la modification
    const status = reservation.status?.toUpperCase();
    const forbiddenStatuses = ['CANCELLED', 'CANCELED', 'CANCEL_REQUESTED', 'COMPLETED', 'CHANGE_REQUESTED'];
    if (forbiddenStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Reservation cannot be modified' },
        { status: 400 }
      );
    }

    // Mettre à jour la réservation
    // Stocker les métadonnées dans notes JSON pour éviter les problèmes de colonnes manquantes
    const existingNotes = reservation.notes 
      ? (typeof reservation.notes === 'string' ? JSON.parse(reservation.notes) : reservation.notes) 
      : {};
    
    const updateData: any = {
      status: 'CHANGE_REQUESTED',
      updated_at: new Date().toISOString(),
      notes: JSON.stringify({
        ...existingNotes,
        changeRequest: {
          requestedAt: requestedAt || new Date().toISOString(),
          requestedChanges: requestedChanges || {},
          message: message,
          previousStatus: reservation.status, // Stocker le statut précédent pour pouvoir le restaurer si rejet
        },
      }),
    };

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
    console.error('Error in change-request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
