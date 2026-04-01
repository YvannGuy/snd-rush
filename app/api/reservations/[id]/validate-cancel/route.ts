import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/adminAuth';
import { calculateRefundPolicy } from '@/lib/reservationStatus';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Admin uniquement ─────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { isAdmin, error: adminError } = await verifyAdmin(authHeader.replace('Bearer ', ''));
  if (!isAdmin || adminError) {
    return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const reservationId = id;
    const body = await request.json();
    const { action } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Doit être "approve" ou "reject"' },
        { status: 400 }
      );
    }

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

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
      pickup_time: reservation.pickup_time || null,
      return_time: reservation.return_time || null,
    };

    if (action === 'approve') {
      updateData.status = 'CANCELLED';
      updateData.notes = JSON.stringify({
        ...existingNotes,
        cancelRequest: {
          ...existingNotes.cancelRequest,
          approvedAt: new Date().toISOString(),
          approvedBy: 'admin',
        },
      });
    } else {
      const previousStatus = existingNotes.cancelRequest?.previousStatus || 'CONFIRMED';
      updateData.status = previousStatus;
      updateData.notes = JSON.stringify({
        ...existingNotes,
        cancelRequest: {
          ...existingNotes.cancelRequest,
          rejectedAt: new Date().toISOString(),
          rejectedBy: 'admin',
        },
      });
    }

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

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      action: action === 'approve' ? 'approved' : 'rejected',
    });
  } catch (error: any) {
    console.error('Error in validate-cancel:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
