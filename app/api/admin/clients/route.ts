import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

const ORDERS_SUMMARY_LIMIT = 200;
const RESERVATIONS_RECENT_LIMIT = 200;

function filterReservationsForClient(
  orders: { stripe_session_id?: string | null }[],
  recentReservations: unknown[],
  clientEmail: string
): unknown[] {
  const sessionIds = orders.map((o) => o.stripe_session_id).filter(Boolean) as string[];
  const sessionIdsSet = new Set(sessionIds);
  const emailLower = clientEmail.toLowerCase();

  return (recentReservations || []).filter((reservation: any) => {
    if (!reservation?.notes) return false;
    try {
      const notesData = JSON.parse(reservation.notes);
      if (notesData.sessionId && sessionIdsSet.has(notesData.sessionId)) return true;
      if (
        notesData.customerEmail &&
        String(notesData.customerEmail).toLowerCase() === emailLower
      ) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
}

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { isAdmin, error: authError } = await verifyAdmin(authHeader.replace('Bearer ', ''));
  if (!isAdmin || authError) {
    return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
  }

  const emailRaw = req.nextUrl.searchParams.get('email');
  const clientEmail = emailRaw != null ? emailRaw.trim() : '';

  try {
    if (clientEmail !== '') {
      const { data: ordersData, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('customer_email', clientEmail)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('[admin/clients] orders by email:', ordersError);
        return NextResponse.json({ error: ordersError.message }, { status: 500 });
      }

      const { data: recentReservations, error: reservationsError } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(RESERVATIONS_RECENT_LIMIT);

      if (reservationsError) {
        console.error('[admin/clients] reservations:', reservationsError);
      }

      const reservationsData = filterReservationsForClient(
        ordersData || [],
        recentReservations || [],
        clientEmail
      );

      return NextResponse.json({
        orders: ordersData ?? [],
        reservations: reservationsData,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('customer_email, customer_name, customer_phone, total, created_at')
      .order('created_at', { ascending: false })
      .limit(ORDERS_SUMMARY_LIMIT);

    if (error) {
      console.error('[admin/clients] orders summary:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
