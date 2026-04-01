import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Authentification Bearer token ────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const { id } = await params;
    const reservationId = id;
    const body = await request.json();
    const { reservationId: bodyReservationId, requestedAt, requestedChanges, message } = body;

    if (bodyReservationId !== reservationId) {
      return NextResponse.json({ error: 'Reservation ID mismatch' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*, user_id')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // ── Vérification de propriété ─────────────────────────────────────────
    if (reservation.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    // ─────────────────────────────────────────────────────────────────────

    const eventDate = new Date(reservation.start_date);
    const now = new Date();
    if (eventDate < now) {
      return NextResponse.json({ error: 'Cannot modify past events' }, { status: 400 });
    }

    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 5) {
      return NextResponse.json(
        { error: 'Modifications must be requested at least 5 days before the event' },
        { status: 400 }
      );
    }

    const status = reservation.status?.toUpperCase();
    const forbiddenStatuses = ['CANCELLED', 'CANCELED', 'CANCEL_REQUESTED', 'COMPLETED', 'CHANGE_REQUESTED'];
    if (forbiddenStatuses.includes(status)) {
      return NextResponse.json({ error: 'Reservation cannot be modified' }, { status: 400 });
    }

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
          previousStatus: reservation.status,
        },
      }),
    };

    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reservation:', updateError);
      return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reservation: updatedReservation });
  } catch (error: any) {
    console.error('Error in change-request:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
